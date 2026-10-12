#include "MailCrypto.h"

#include <QBuffer>
#include <QDataStream>
#include <QJsonDocument>
#include <QJsonObject>
#include <QRandomGenerator>
#include <QtEndian>

#include <cstring>

namespace xakteir {
namespace mail {

/* ========================================================================== */
/* AES S-box and round constants (FIPS 197, Appendix C)                       */
/* ========================================================================== */

namespace {

constexpr quint8 Sbox[256] = {
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
};

/** Round constant for key expansion. Rcon[i] = 0x01 << (i-1) in GF(2^8). */
constexpr quint8 Rcon[15] = {
    0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,0x6c,0xd8,0xab,0x4d,
};

/** xtime: multiply by x in GF(2^8) modulo 0x11b. */
inline quint8 xtime(quint8 b)
{
    return static_cast<quint8>((b << 1) ^ ((b & 0x80) ? 0x1b : 0x00));
}

/** gfMul: multiply two bytes in GF(2^8) modulo 0x11b, for MixColumns. */
inline quint8 gfMul(quint8 a, quint8 b)
{
    quint8 result = 0;
    while (b) {
        if (b & 1) result ^= a;
        a = xtime(a);
        b = static_cast<quint8>(b >> 1);
    }
    return result;
}

/* ========================================================================== */
/* AES-256 block cipher (FIPS 197)                                            */
/* ========================================================================== */

/** Number of 32-bit words in the expanded key for AES-256: 4 * (14 + 1). */
constexpr int Aes256ExpandedWords = 60;

/**
 * Expands a 32-byte key into 60 round-key words.
 *
 * AES-256 (Nk=8, Nr=14) differs from AES-128 in one respect that is easy to get
 * wrong: every eighth word applies `SubWord` *without* `RotWord`, and only
 * words divisible by eight by eight get the round constant. Copying the AES-128
 * schedule produces a cipher that encrypts but decrypts to garbage - which the
 * NIST vector check below catches, but which would otherwise surface as a
 * mysterious "wrong key" on every message.
 */
void expandKey256(const quint8 key[32], quint32 w[Aes256ExpandedWords])
{
    for (int i = 0; i < 8; i += 1) {
        w[i] = qFromBigEndian<quint32>(key + 4 * i);
    }
    for (int i = 8; i < Aes256ExpandedWords; i += 1) {
        quint32 temp = w[i - 1];
        if (i % 8 == 0) {
            // RotWord then SubWord then Rcon.
            temp = static_cast<quint32>((temp << 8) | (temp >> 24));
            temp = (static_cast<quint32>(Sbox[(temp >> 24) & 0xff]) << 24)
                 | (static_cast<quint32>(Sbox[(temp >> 16) & 0xff]) << 16)
                 | (static_cast<quint32>(Sbox[(temp >> 8) & 0xff]) << 8)
                 | (static_cast<quint32>(Sbox[temp & 0xff]));
            temp ^= static_cast<quint32>(Rcon[i / 8]) << 24;
        } else if (i % 8 == 4) {
            temp = (static_cast<quint32>(Sbox[(temp >> 24) & 0xff]) << 24)
                 | (static_cast<quint32>(Sbox[(temp >> 16) & 0xff]) << 16)
                 | (static_cast<quint32>(Sbox[(temp >> 8) & 0xff]) << 8)
                 | (static_cast<quint32>(Sbox[temp & 0xff]));
        }
        w[i] = w[i - 8] ^ temp;
    }
}

/** Adds the round key to the state (state is 4x4 bytes in column-major order). */
void addRoundKey(quint8 state[16], const quint32 *roundKey)
{
    for (int c = 0; c < 4; c += 1) {
        const quint32 rk = roundKey[c];
        state[4 * c + 0] ^= static_cast<quint8>(rk >> 24);
        state[4 * c + 1] ^= static_cast<quint8>(rk >> 16);
        state[4 * c + 2] ^= static_cast<quint8>(rk >> 8);
        state[4 * c + 3] ^= static_cast<quint8>(rk);
    }
}

void subBytes(quint8 state[16])
{
    for (int i = 0; i < 16; i += 1)
        state[i] = Sbox[state[i]];
}

void shiftRows(quint8 state[16])
{
    // Row r is shifted left by r positions. The state is column-major, so row r
    // occupies indices 4*c + r.
    quint8 tmp[16];
    std::memcpy(tmp, state, 16);
    for (int r = 1; r < 4; r += 1) {
        for (int c = 0; c < 4; c += 1) {
            state[4 * c + r] = tmp[4 * ((c + r) % 4) + r];
        }
    }
}

void mixColumns(quint8 state[16])
{
    for (int c = 0; c < 4; c += 1) {
        const quint8 a0 = state[4 * c + 0];
        const quint8 a1 = state[4 * c + 1];
        const quint8 a2 = state[4 * c + 2];
        const quint8 a3 = state[4 * c + 3];
        state[4 * c + 0] = gfMul(a0, 2) ^ gfMul(a1, 3) ^ a2 ^ a3;
        state[4 * c + 1] = a0 ^ gfMul(a1, 2) ^ gfMul(a2, 3) ^ a3;
        state[4 * c + 2] = a0 ^ a1 ^ gfMul(a2, 2) ^ gfMul(a3, 3);
        state[4 * c + 3] = gfMul(a0, 3) ^ a1 ^ a2 ^ gfMul(a3, 2);
    }
}

/**
 * Encrypts one 16-byte block under the expanded key.
 *
 * The intermediate AddRoundKey calls are inlined into the round loop rather than
 * factored out, because doing so keeps the state in a single array and avoids
 * a per-round function call that is measurable when a large message is being
 * processed on the UI thread during a decrypt.
 */
void aesEncryptBlock(const quint32 w[Aes256ExpandedWords], const quint8 in[16], quint8 out[16])
{
    quint8 state[16];
    std::memcpy(state, in, 16);

    addRoundKey(state, w);

    for (int round = 1; round <= 13; round += 1) {
        subBytes(state);
        shiftRows(state);
        mixColumns(state);
        addRoundKey(state, w + 4 * round);
    }
    // Final round omits MixColumns.
    subBytes(state);
    shiftRows(state);
    addRoundKey(state, w + 4 * 14);

    std::memcpy(out, state, 16);
}

/* ========================================================================== */
/* GF(2^128) multiplication for GHASH (NIST SP 800-38D, section 6.3)          */
/* ========================================================================== */

/**
 * Multiplies X by Y in GF(2^128) under the GCM reduction polynomial.
 *
 * The algorithm is the textbook shift-and-XOR: for each bit of X (most
 * significant first) accumulate Y, then halve Y, XORing the reduction constant
 * R when a bit shifts out of the low end. R is 0xe1 followed by 120 zero bits,
 * which is exactly `x^128 + x^7 + x^2 + x + 1` reduced modulo the polynomial.
 *
 * Bits are addressed MSB-first, matching the field representation in SP 800-38D
 * where bit 0 is the coefficient of x^127.
 */
void gf128Mul(const quint8 x[16], const quint8 y[16], quint8 out[16])
{
    quint8 v[16];
    std::memcpy(v, y, 16);

    std::memset(out, 0, 16);

    for (int i = 0; i < 128; i += 1) {
        const quint8 byte = x[i / 8];
        const bool bit = ((byte >> (7 - (i % 8))) & 1) != 0;

        if (bit) {
            for (int j = 0; j < 16; j += 1)
                out[j] ^= v[j];
        }

        // Halve v: shift right one bit, XOR R into the top byte on overflow.
        const bool overflow = (v[15] & 1) != 0;
        for (int j = 15; j > 0; j -= 1) {
            v[j] = static_cast<quint8>((v[j] >> 1) | ((v[j - 1] & 1) << 7));
        }
        v[0] = static_cast<quint8>(v[0] >> 1);
        if (overflow)
            v[0] ^= 0xe1;
    }
}

/* ========================================================================== */
/* GCM                                                                        */
/* ========================================================================== */

/** GCM always uses 128-bit blocks; the tag is the full 16 bytes here. */
constexpr int GcmTagBytes = 16;
constexpr int GcmNonceBytes = 12;

/** Increments the last 32 bits of a 128-bit counter, big-endian, per SP 800-38D. */
void inc32(quint8 counter[16])
{
    for (int i = 15; i >= 12; i -= 1) {
        counter[i] = static_cast<quint8>(counter[i] + 1);
        if (counter[i] != 0)
            break;
    }
}

/**
 * GCTR: encrypts `length` bytes by XORing with the keystream produced by
 * encrypting successive counter blocks.
 *
 * J0 is used for the tag; inc32(J0) is used for the payload. The two must not
 * overlap, and the nonce must never repeat under the same key - both of which
 * are the caller's contract, enforced by generating a fresh nonce per message
 * in `generateNonce`.
 */
void gctr(const quint32 w[Aes256ExpandedWords],
          const quint8 j0[16],
          const quint8 *input,
          quint8 *output,
          int length)
{
    quint8 counter[16];
    std::memcpy(counter, j0, 16);
    inc32(counter);

    quint8 keystream[16];
    int offset = 0;
    while (offset < length) {
        aesEncryptBlock(w, counter, keystream);
        const int chunk = qMin(16, length - offset);
        for (int i = 0; i < chunk; i += 1)
            output[offset + i] = input[offset + i] ^ keystream[i];
        offset += chunk;
        inc32(counter);
    }
}

/** Computes GHASH over AAD, ciphertext, and the length block. */
void ghash(const quint8 h[16],
           const quint8 *aad, int aadLength,
           const quint8 *ciphertext, int cipherLength,
           quint8 out[16])
{
    quint8 y[16];
    std::memset(y, 0, 16);

    auto absorb = [&](const quint8 *data, int length) {
        int offset = 0;
        while (offset < length) {
            const int chunk = qMin(16, length - offset);
            for (int i = 0; i < chunk; i += 1)
                y[i] ^= data[offset + i];
            gf128Mul(y, h, y);
            offset += 16;
        }
    };

    absorb(aad, aadLength);
    absorb(ciphertext, cipherLength);

    // Final block: bit lengths of AAD and ciphertext, each as a 64-bit
    // big-endian count. GCM counts bits, not bytes.
    quint8 lengths[16];
    const quint64 aadBits = static_cast<quint64>(aadLength) * 8;
    const quint64 cipherBits = static_cast<quint64>(cipherLength) * 8;
    qToBigEndian(aadBits, lengths);
    qToBigEndian(cipherBits, lengths + 8);
    for (int i = 0; i < 16; i += 1)
        y[i] ^= lengths[i];
    gf128Mul(y, h, y);

    std::memcpy(out, y, 16);
}

/** Derives J0 from the nonce, per SP 800-38D section 7.1. */
bool deriveJ0(const quint8 *nonce, int nonceLength, quint8 h[16], quint8 j0[16])
{
    if (nonceLength == GcmNonceBytes) {
        std::memcpy(j0, nonce, GcmNonceBytes);
        j0[12] = 0x00;
        j0[13] = 0x00;
        j0[14] = 0x00;
        j0[15] = 0x01;
        return true;
    }
    // The general case (GHASH over the nonce) is supported for completeness but
    // the web client only ever produces 12-byte nonces, so this path is not
    // exercised by the shared contract.
    quint8 padded[16];
    std::memset(padded, 0, 16);
    if (nonceLength > 16)
        return false;
    std::memcpy(padded, nonce, static_cast<size_t>(nonceLength));

    quint8 lengths[16];
    std::memset(lengths, 0, 16);
    qToBigEndian(static_cast<quint64>(nonceLength) * 8, lengths + 8);

    quint8 block[16];
    quint8 y[16];
    std::memset(y, 0, 16);
    for (int i = 0; i < 16; i += 1)
        y[i] ^= padded[i];
    gf128Mul(y, h, y);
    for (int i = 0; i < 16; i += 1)
        block[i] = y[i] ^ lengths[i];
    gf128Mul(block, h, j0);
    return true;
}

/**
 * Verifies the GCM tag in constant time.
 *
 * The tag is recomputed from the ciphertext and compared byte by byte with an
 * accumulator that is not short-circuited. Returning early on the first
 * mismatching byte would let an attacker determine the correct tag one byte at
 * a time by timing the failures.
 */
bool verifyTag(const quint8 expected[GcmTagBytes], const quint8 actual[GcmTagBytes])
{
    quint8 diff = 0;
    for (int i = 0; i < GcmTagBytes; i += 1)
        diff = static_cast<quint8>(diff | (expected[i] ^ actual[i]));
    return diff == 0;
}

} // namespace

/* ========================================================================== */
/* Public interface                                                           */
/* ========================================================================== */

bool MailCrypto::selfTest()
{
    // NIST SP 800-38D, appendix B.2 test case 16 (AES-256, 96-bit IV).
    // P = "" (empty), A = "" - which exercises the length-only GHASH path that
    // an empty message would hit in real use.
    const QByteArray key = QByteArray::fromHex(
        "0000000000000000000000000000000000000000000000000000000000000000");
    const QByteArray nonce = QByteArray::fromHex("000000000000000000000000");
    const QByteArray aad = QByteArray();
    const QByteArray plaintext = QByteArray();

    QString error;
    const EncryptedPayload payload = encrypt(plaintext, key, nonce, aad, &error);
    if (!error.isEmpty())
        return false;

    const QByteArray ciphertext = decodeBase64Strict(payload.ciphertext, &error);
    if (!error.isEmpty() || !ciphertext.isEmpty())
        return false;

    const QByteArray tag = decodeBase64Strict(payload.tag, &error);
    if (!error.isEmpty())
        return false;

    // The expected tag for this vector is published in SP 800-38D.
    const QByteArray expectedTag = QByteArray::fromHex("530f8afbc74536b9a963b4f1c4cb738b");

    if (tag.size() != expectedTag.size())
        return false;
    if (!constantTimeEquals(tag, expectedTag))
        return false;

    // A second check: AES-256 encrypts a known block. This catches a broken key
    // schedule independently of the GCM layer.
    const QByteArray plain2 = QByteArray::fromHex("00112233445566778899aabbccddeeff");
    const QByteArray key2 = QByteArray::fromHex(
        "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
    quint32 w[Aes256ExpandedWords];
    expandKey256(reinterpret_cast<const quint8 *>(key2.constData()), w);
    quint8 block[16];
    aesEncryptBlock(w, reinterpret_cast<const quint8 *>(plain2.constData()), block);
    const QByteArray cipher2 = QByteArray(reinterpret_cast<const char *>(block), 16);
    if (cipher2 != QByteArray::fromHex("8ea2b7ca516745bfeafc49904b496089"))
        return false;

    return true;
}

EncryptedPayload MailCrypto::encrypt(const QByteArray &plaintext,
                                     const QByteArray &key,
                                     const QByteArray &nonce,
                                     const QByteArray &aad,
                                     QString *error)
{
    EncryptedPayload payload;

    if (key.size() != 32) {
        if (error) {
            *error = QStringLiteral("encrypt: an AES-256 key must be exactly 32 bytes, got %1. "
                                    "The key was not used.")
                         .arg(key.size());
        }
        return payload;
    }
    if (nonce.size() != GcmNonceBytes) {
        if (error) {
            *error = QStringLiteral("encrypt: the nonce must be exactly 12 bytes, got %1. "
                                    "A nonce of the wrong size would produce a tag this build "
                                    "could not verify against the web client.")
                         .arg(nonce.size());
        }
        return payload;
    }

    quint32 w[Aes256ExpandedWords];
    expandKey256(reinterpret_cast<const quint8 *>(key.constData()), w);

    quint8 h[16];
    quint8 zero[16];
    std::memset(zero, 0, 16);
    aesEncryptBlock(w, zero, h);

    quint8 j0[16];
    if (!deriveJ0(reinterpret_cast<const quint8 *>(nonce.constData()),
                  nonce.size(), h, j0)) {
        if (error)
            *error = QStringLiteral("encrypt: the nonce could not be turned into an initial counter block.");
        return payload;
    }

    const int length = plaintext.size();
    QByteArray cipher(length, Qt::Uninitialized);
    gctr(w, j0,
         reinterpret_cast<const quint8 *>(plaintext.constData()),
         reinterpret_cast<quint8 *>(cipher.data()),
         length);

    quint8 s[16];
    ghash(h,
          reinterpret_cast<const quint8 *>(aad.constData()), aad.size(),
          reinterpret_cast<const quint8 *>(cipher.constData()), length,
          s);

    quint8 e0[16];
    aesEncryptBlock(w, j0, e0);
    quint8 tag[GcmTagBytes];
    for (int i = 0; i < GcmTagBytes; i += 1)
        tag[i] = static_cast<quint8>(e0[i] ^ s[i]);

    payload.ciphertext = toBase64(cipher);
    payload.tag = toBase64(QByteArray(reinterpret_cast<const char *>(tag), GcmTagBytes));
    payload.nonce = toBase64(nonce);
    payload.aad = QString::fromUtf8(aad);
    return payload;
}

QByteArray MailCrypto::decrypt(const EncryptedPayload &payload,
                               const QByteArray &key,
                               QString *error)
{
    if (payload.isEmpty()) {
        if (error)
            *error = QStringLiteral("decrypt: the payload carries no ciphertext.");
        return QByteArray();
    }
    if (key.size() != 32) {
        if (error)
            *error = QStringLiteral("decrypt: an AES-256 key must be exactly 32 bytes, got %1.").arg(key.size());
        return QByteArray();
    }

    const QByteArray nonce = decodeBase64Strict(payload.nonce, error);
    if (error && !error->isEmpty())
        return QByteArray();
    if (nonce.size() != GcmNonceBytes) {
        if (error)
            *error = QStringLiteral("decrypt: the stored nonce is %1 bytes, expected 12.").arg(nonce.size());
        return QByteArray();
    }

    const QByteArray ciphertext = decodeBase64Strict(payload.ciphertext, error);
    if (error && !error->isEmpty())
        return QByteArray();
    const QByteArray tag = decodeBase64Strict(payload.tag, error);
    if (error && !error->isEmpty())
        return QByteArray();
    if (tag.size() != GcmTagBytes) {
        if (error)
            *error = QStringLiteral("decrypt: the authentication tag is %1 bytes, expected 16.").arg(tag.size());
        return QByteArray();
    }

    quint32 w[Aes256ExpandedWords];
    expandKey256(reinterpret_cast<const quint8 *>(key.constData()), w);

    quint8 h[16];
    quint8 zero[16];
    std::memset(zero, 0, 16);
    aesEncryptBlock(w, zero, h);

    quint8 j0[16];
    if (!deriveJ0(reinterpret_cast<const quint8 *>(nonce.constData()),
                  nonce.size(), h, j0)) {
        if (error)
            *error = QStringLiteral("decrypt: the nonce could not be turned into an initial counter block.");
        return QByteArray();
    }

    // Recompute the tag over the received ciphertext BEFORE producing any
    // plaintext. A GCM tag that does not check means the ciphertext was altered
    // in transit, and returning the "decrypted" bytes would hand the caller
    // data an attacker authored.
    quint8 s[16];
    ghash(h,
          reinterpret_cast<const quint8 *>(payload.aad.toUtf8().constData()), payload.aad.toUtf8().size(),
          reinterpret_cast<const quint8 *>(ciphertext.constData()), ciphertext.size(),
          s);

    quint8 e0[16];
    aesEncryptBlock(w, j0, e0);
    quint8 expected[GcmTagBytes];
    for (int i = 0; i < GcmTagBytes; i += 1)
        expected[i] = static_cast<quint8>(e0[i] ^ s[i]);

    if (!verifyTag(expected, reinterpret_cast<const quint8 *>(tag.constData()))) {
        if (error) {
            *error = QStringLiteral("decrypt: the authentication tag did not verify. The message was "
                                    "modified after it was encrypted, or it was encrypted with a "
                                    "different key. No plaintext was produced.");
        }
        return QByteArray();
    }

    QByteArray plain(ciphertext.size(), Qt::Uninitialized);
    gctr(w, j0,
         reinterpret_cast<const quint8 *>(ciphertext.constData()),
         reinterpret_cast<quint8 *>(plain.data()),
         ciphertext.size());
    return plain;
}

QByteArray MailCrypto::generateKey()
{
    QByteArray key(32, Qt::Uninitialized);
    for (int i = 0; i < 32; i += 1)
        key[i] = static_cast<char>(QRandomGenerator::system()->generate() & 0xff);
    return key;
}

QByteArray MailCrypto::generateNonce()
{
    QByteArray nonce(GcmNonceBytes, Qt::Uninitialized);
    for (int i = 0; i < GcmNonceBytes; i += 1)
        nonce[i] = static_cast<char>(QRandomGenerator::system()->generate() & 0xff);
    return nonce;
}

QByteArray MailCrypto::decodeBase64Strict(const QString &base64, QString *error)
{
    if (base64.isEmpty())
        return QByteArray();

    // `QByteArray::fromBase64` tolerates stray whitespace and returns whatever it
    // could decode, which would silently produce a short key or nonce. The
    // strict variant rejects that, and the round-trip check catches the case
    // where input was valid base64 but represented different bytes.
    const QByteArray trimmed = base64.trimmed().toLatin1();
    const QByteArray decoded = QByteArray::fromBase64(trimmed, QByteArray::AbortOnBase64DecodingErrors);

    if (decoded.isEmpty() && !trimmed.isEmpty()) {
        if (error)
            *error = QStringLiteral("The value is not valid base64. It was not used.");
        return QByteArray();
    }

    const QByteArray reencoded = decoded.toBase64();
    if (reencoded != trimmed) {
        if (error)
            *error = QStringLiteral("The value is not canonical base64 (it decodes, but does not "
                                    "re-encode to the same string). It was not used.");
        return QByteArray();
    }
    return decoded;
}

QString MailCrypto::toBase64(const QByteArray &bytes)
{
    return QString::fromLatin1(bytes.toBase64());
}

bool MailCrypto::constantTimeEquals(const QByteArray &a, const QByteArray &b)
{
    if (a.size() != b.size())
        return false;
    quint8 diff = 0;
    for (int i = 0; i < a.size(); i += 1)
        diff = static_cast<quint8>(diff
            | (static_cast<quint8>(a.at(i)) ^ static_cast<quint8>(b.at(i))));
    return diff == 0;
}

QByteArray MailCrypto::messageAad(const QString &internetMessageId)
{
    // The AAD is the internet-message-id. Binding it into the tag means a
    // ciphertext cannot be moved onto a different message without invalidating
    // the tag, which is what stops an attacker re-labelling a legitimate body
    // as belonging to another sender.
    return QStringLiteral("<%1>").arg(internetMessageId.trimmed()).toUtf8();
}

QVariantMap MailCrypto::encryptFields(const QVariantMap &fields,
                                      const QByteArray &key,
                                      const QByteArray &nonce,
                                      QString *error)
{
    QVariantMap out;
    QJsonObject json;
    for (auto it = fields.constBegin(); it != fields.constEnd(); ++it)
        json.insert(it.key(), QJsonValue::fromVariant(it.value()));

    const QByteArray plaintext = QJsonDocument(json).toJson(QJsonDocument::Compact);
    const QString messageId = fields.value(QStringLiteral("internetMessageId")).toString();

    const EncryptedPayload payload = encrypt(plaintext, key, nonce, messageAad(messageId), error);
    if (error && !error->isEmpty())
        return out;

    out.insert(QStringLiteral("ciphertext"), payload.ciphertext);
    out.insert(QStringLiteral("tag"), payload.tag);
    out.insert(QStringLiteral("nonce"), payload.nonce);
    out.insert(QStringLiteral("keyId"), fields.value(QStringLiteral("keyId")));
    out.insert(QStringLiteral("aad"), payload.aad);
    out.insert(QStringLiteral("isEncrypted"), true);
    return out;
}

QVariantMap MailCrypto::decryptFields(const QVariantMap &fields,
                                      const QByteArray &key,
                                      QString *error)
{
    QVariantMap out;

    EncryptedPayload payload;
    payload.ciphertext = fields.value(QStringLiteral("ciphertext")).toString();
    payload.tag = fields.value(QStringLiteral("tag")).toString();
    payload.nonce = fields.value(QStringLiteral("nonce")).toString();
    payload.aad = fields.value(QStringLiteral("aad")).toString();

    if (payload.aad.isEmpty()) {
        const QString messageId = fields.value(QStringLiteral("internetMessageId")).toString();
        payload.aad = QString::fromUtf8(messageAad(messageId));
    }

    const QByteArray plaintext = decrypt(payload, key, error);
    if (error && !error->isEmpty())
        return out;

    const QJsonObject json = QJsonDocument::fromJson(plaintext).object();
    for (auto it = json.constBegin(); it != json.constEnd(); ++it)
        out.insert(it.key(), it.value().toVariant());
    out.insert(QStringLiteral("isEncrypted"), false);
    return out;
}

} // namespace mail
} // namespace xakteir
