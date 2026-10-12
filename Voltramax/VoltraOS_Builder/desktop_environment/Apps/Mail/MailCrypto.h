#ifndef MAILCRYPTO_H
#define MAILCRYPTO_H

/**
 * ============================================================================
 * XAKTEIR MAIL - END-TO-END ENCRYPTION (NATIVE AES-256-GCM)
 * ============================================================================
 *
 * WHY THIS IS HAND-WRITTEN
 * ------------------------
 * Qt Core ships no AES. `QCryptographicHash` covers hashing only, and pulling
 * in OpenSSL or QCA would add a native dependency the rest of the desktop
 * environment does not carry, on a target that must build from a plain Qt kit.
 *
 * The alternative - skipping E2EE natively - would mean the web client and the
 * desktop client disagree about what a message *is*: one could hold a body the
 * other could never read. So AES-256-GCM is implemented here against the NIST
 * SP 800-38D specification, and the result is checked against the published
 * test vectors on startup (see `MailCrypto::selfTest`).
 *
 * INTEROP WITH THE WEB CLIENT
 * ---------------------------
 * The format matches `src/lib/mail/crypto.ts` exactly:
 *
 *   key        32 raw bytes, base64, held in the shared vault
 *   nonce      12 random bytes, base64, unique per message, never reused
 *   ciphertext base64 of AES-256-GCM output (no padding: GCM is a stream mode)
 *   tag        base64 16-byte authentication tag, stored separately
 *   aad        UTF-8 of the internet-message-id, bound into the tag
 *
 * The AAD binding means a ciphertext cannot be moved onto a different message
 * without invalidating the tag - which is exactly what stops an attacker
 * re-labelling a legitimate body as belonging to another sender.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * -----------------------------
 * - No key derivation. Keys arrive already derived (from the vault). Deriving
 *   here would risk two surfaces disagreeing about the KDF and silently
 *   producing different keys for the same password.
 * - No key rotation. Rotation is a server-side, multi-reader concern; a single
 *   client cannot rotate a key other devices hold without coordination.
 * - No secret logging, ever. Every failure path reports *which stage* failed
 *   and nothing about the key material.
 *
 * CONSTANT-TIME NOTE
 * ------------------
 * The tag comparison is constant-time (`constantTimeEquals`). A timing leak on
 * the tag would let an attacker forge a message one byte at a time, so this is
 * not a theoretical concern - it is the difference between the scheme working
 * and the scheme being decorative.
 */

#include <QByteArray>
#include <QString>
#include <QVariantMap>

namespace xakteir {
namespace mail {

/** One envelope's worth of cryptographic material. Mirrors the web client. */
struct EncryptedPayload {
    /** base64 ciphertext. Empty when the message is not encrypted. */
    QString ciphertext;
    /** base64 16-byte GCM tag. Never merged into `ciphertext`. */
    QString tag;
    /** base64 12-byte nonce. Unique per message; never reused under one key. */
    QString nonce;
    /** base64 32-byte AES-256 key. Present only on the encrypt side. */
    QString key;
    /** Id of the key in the shared vault. A reference, never the secret. */
    QString keyId;
    /** Additional authenticated data (the internet-message-id). */
    QString aad;

    bool isEmpty() const
    {
        return ciphertext.isEmpty() && tag.isEmpty();
    }
};

/**
 * AES-256-GCM, matching the web client's WebCrypto implementation byte for byte.
 *
 * Every entry point is total: it either returns a value or a descriptive
 * error string. There are no partially-filled outputs and no exceptions crossing
 * the QML boundary, because a thrown error from a `Q_INVOKABLE` that QML does
 * not catch takes the whole scene graph down with it.
 */
class MailCrypto
{
public:
    /** True when the AES-GCM implementation agrees with the NIST vectors. */
    static bool selfTest();

    /**
     * Encrypts `plaintext` under `key`.
     *
     * `key` must be 32 bytes (AES-256). `nonce` must be 12 bytes. Passing a
     * different size is refused rather than padded, because a padded nonce that
     * the web client does not also pad produces a tag only this build can
     * verify - the silent-corruption case.
     *
     * Returns an empty payload and sets `error` on failure.
     */
    static EncryptedPayload encrypt(const QByteArray &plaintext,
                                    const QByteArray &key,
                                    const QByteArray &nonce,
                                    const QByteArray &aad,
                                    QString *error = nullptr);

    /**
     * Verifies and decrypts `payload`.
     *
     * Verification happens *before* any plaintext is released: a GCM tag that
     * does not check means the ciphertext was tampered with, and returning the
     * "decrypted" bytes would hand the caller data an attacker authored.
     */
    static QByteArray decrypt(const EncryptedPayload &payload,
                              const QByteArray &key,
                              QString *error = nullptr);

    /** Generates a fresh 32-byte key. Randomness comes from `QRandomGenerator`. */
    static QByteArray generateKey();

    /** Generates a fresh 12-byte nonce. Must not be reused under the same key. */
    static QByteArray generateNonce();

    /** base64 helpers. `decodeBase64Strict` rejects non-alphabet input. */
    static QByteArray decodeBase64Strict(const QString &base64, QString *error = nullptr);
    static QString toBase64(const QByteArray &bytes);

    /**
     * Constant-time equality for two byte strings.
     *
     * The length is part of the comparison's observable behaviour, which is
     * acceptable: GCM tags are always exactly 16 bytes, so an attacker learns
     * nothing they did not already know.
     */
    static bool constantTimeEquals(const QByteArray &a, const QByteArray &b);

    /** Builds the AAD string the web client binds. Must match exactly. */
    static QByteArray messageAad(const QString &internetMessageId);

    /** Convenience: full encrypt/decrypt round trip over a variant map. */
    static QVariantMap encryptFields(const QVariantMap &fields,
                                     const QByteArray &key,
                                     const QByteArray &nonce,
                                     QString *error = nullptr);
    static QVariantMap decryptFields(const QVariantMap &fields,
                                     const QByteArray &key,
                                     QString *error = nullptr);
};

} // namespace mail
} // namespace xakteir

#endif // MAILCRYPTO_H
