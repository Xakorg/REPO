#include "StreamEngine.h"
#include "SyscallBridge.h"
#include <QDebug>
#include <QRandomGenerator>
#include <qmath.h>

StreamEngine::StreamEngine(QObject *parent) 
    : QObject(parent), m_isPlaying(false), m_currentTrack("No Media Loaded") 
{
    qDebug() << "[StreamEngine] Booting Hardware-Accelerated DRM Media Engine...";

    // This timer simulates a 60fps audio FFT processor thread
    // In a real C application, this would be an ALSA/PulseAudio hook running on a separate pthread
    m_fftTimer = new QTimer(this);
    m_fftTimer->setInterval(16); // ~60fps
    connect(m_fftTimer, &QTimer::timeout, this, &StreamEngine::processAudioFrame);
}

StreamEngine::~StreamEngine() {
    stop();
    delete m_fftTimer;
}

bool StreamEngine::isPlaying() const { return m_isPlaying; }
QString StreamEngine::currentTrack() const { return m_currentTrack; }

void StreamEngine::play(const QString& filepath) {
    QMutexLocker locker(&m_audioMutex);
    
    qDebug() << "[StreamEngine] Hooking into Kernel DRM buffer via int 0x80 to decode:" << filepath;
    
    // Simulate VFS syscall
    int fd = SyscallBridge::open(filepath.toStdString().c_str(), 0);
    if (fd >= 0) {
        qDebug() << "[StreamEngine] VFS fd secured. Initiating binary stream.";
        SyscallBridge::close(fd);
    }

    m_currentTrack = filepath.section('/', -1);
    m_isPlaying = true;
    
    emit trackChanged(m_currentTrack);
    emit playingStateChanged(m_isPlaying);
    
    m_fftTimer->start();
}

void StreamEngine::pause() {
    QMutexLocker locker(&m_audioMutex);
    m_isPlaying = false;
    emit playingStateChanged(m_isPlaying);
    m_fftTimer->stop();
    qDebug() << "[StreamEngine] Playback paused. DRM buffer released.";
}

void StreamEngine::stop() {
    pause();
    m_currentTrack = "No Media Loaded";
    emit trackChanged(m_currentTrack);
}

void StreamEngine::seek(int seconds) {
    qDebug() << "[StreamEngine] Syscall seek to timestamp:" << seconds;
}

void StreamEngine::processAudioFrame() {
    QMutexLocker locker(&m_audioMutex);
    if (!m_isPlaying) return;

    // Simulate Fast Fourier Transform (FFT) analysis of the current audio chunk
    // We generate an array of 32 frequency bands representing Bass (0-5), Mids (6-20), Treble (21-31)
    QVariantList bands;
    static double timeOffset = 0.0;
    timeOffset += 0.1;

    for (int i = 0; i < 32; ++i) {
        // Create organic, wave-like frequency data using sin waves and random noise
        double baseWave = qAbs(qSin(timeOffset + (i * 0.2)));
        double noise = QRandomGenerator::global()->generateDouble() * 0.3;
        
        // Bass frequencies are generally louder
        double multiplier = (i < 6) ? 1.5 : ((i < 20) ? 0.8 : 0.4);
        
        double value = (baseWave + noise) * multiplier;
        bands.append(value);
    }

    // Blast the data straight to the QML Liquid Aura visualizer
    emit audioFftDataReady(bands);
}
