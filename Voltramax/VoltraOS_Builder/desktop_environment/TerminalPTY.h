#ifndef TERMINAL_PTY_H
#define TERMINAL_PTY_H

#include <QObject>
#include <QString>
#include <QList>
#include <QColor>
#include <QThread>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - TERMINAL PTY (PSEUDO-TERMINAL) BACKEND
 * ============================================================================
 * 
 * This class handles parsing complex raw byte streams from a shell process.
 * It decodes ANSI Escape Sequences (Colors, Bold, Cursor Movements) and 
 * structures them for the QML Frontend to render in real-time.
 * ============================================================================
 */

// Represents a single formatted character or span of text in the terminal
struct TerminalSpan {
    QString text;
    QColor foregroundColor;
    QColor backgroundColor;
    bool isBold;
    bool isItalic;
    bool isUnderline;
};

// Represents a single line in the terminal
struct TerminalLine {
    QList<TerminalSpan> spans;
};

class TerminalPTY : public QObject {
    Q_OBJECT

public:
    explicit TerminalPTY(QObject *parent = nullptr);
    ~TerminalPTY();

    Q_INVOKABLE void executeCommand(const QString& command);
    Q_INVOKABLE void askXakAI(const QString& query);

signals:
    // Fired when the terminal output updates, sending HTML-formatted strings to QML
    void outputUpdated(const QString& htmlOutput);
    // Fired when Xak AI finishes analyzing an error
    void aiResponseReady(const QString& response);

private:
    void processRawOutput(const QString& rawOutput);
    QString renderToHtml();

    // The Virtual Screen Buffer
    QList<TerminalLine> m_screenBuffer;
    
    // Current ANSI State Parser Variables
    QColor m_currentForeground = QColor("#00FF00"); // Hacker Green default
    QColor m_currentBackground = QColor("#000000"); // Pure Black default
    bool m_currentBold = false;
    bool m_currentItalic = false;
    bool m_currentUnderline = false;

    // ANSI Color Palettes (Standard 16 colors)
    const QColor ANSI_COLORS[8] = {
        QColor("#000000"), // Black
        QColor("#FF0000"), // Red
        QColor("#00FF00"), // Green
        QColor("#FFFF00"), // Yellow
        QColor("#0000FF"), // Blue
        QColor("#FF00FF"), // Magenta
        QColor("#00FFFF"), // Cyan
        QColor("#FFFFFF")  // White
    };
};

#endif // TERMINAL_PTY_H
