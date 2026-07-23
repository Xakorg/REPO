#ifndef TERMINAL_PTY_H
#define TERMINAL_PTY_H

#include <QObject>
#include <QString>
#include <QStringList>
#include <QMutex>
#include <QTimer>
#include <QQueue>
#include <QRegularExpression>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - TERMINAL PTY ENGINE
 * ============================================================================
 * 
 * Complex C++ Backend representing the Pseudo-Terminal.
 * Features:
 * - Real-time ANSI Escape Sequence Parsing -> QML HTML Conversion
 * - Simulated Command Execution
 * - Xak AI Kernel Crash Analysis Hooks
 * ============================================================================
 */

class TerminalPTY : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString terminalOutput READ terminalOutput NOTIFY outputChanged)

public:
    explicit TerminalPTY(QObject *parent = nullptr);
    ~TerminalPTY();

    QString terminalOutput() const;

    // Receive command from QML
    Q_INVOKABLE void executeCommand(const QString& command);

signals:
    void outputChanged();
    
    // Triggered when a command fails, prompting Xak AI to offer a fix
    void xakAiFixAvailable(const QString& explanation, const QString& suggestedCommand);

private:
    QString m_htmlOutput;
    QQueue<QString> m_ringBuffer; // Fixed length buffer
    QMutex m_ptyMutex;

    void appendToBuffer(const QString& rawString);
    QString parseAnsiToHtml(const QString& rawString);

    // Simulated execution engines
    void runSimulatedCommand(const QString& cmd);
    void simulateErrorAnalysis(const QString& cmd, const QString& errorOut);
};

#endif // TERMINAL_PTY_H
