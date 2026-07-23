#include "TerminalPTY.h"
#include "SyscallBridge.h"
#include <QDebug>
#include <QRandomGenerator>

TerminalPTY::TerminalPTY(QObject *parent) 
    : QObject(parent) 
{
    qDebug() << "[TerminalPTY] Initializing Master Pseudo-Terminal Backend...";
    appendToBuffer("\033[32mVoltraOS Enterprise Shell (v2.0) \033[0m\n");
    appendToBuffer("Type 'help' to see simulated commands.\n");
}

TerminalPTY::~TerminalPTY() {}

QString TerminalPTY::terminalOutput() const {
    return m_htmlOutput;
}

void TerminalPTY::executeCommand(const QString& command) {
    QMutexLocker locker(&m_ptyMutex);
    
    // Echo command
    appendToBuffer("\n\033[36mvoltra@root:~$ \033[0m" + command + "\n");
    
    // Asynchronously simulate execution
    QTimer::singleShot(200, this, [this, command]() {
        runSimulatedCommand(command);
    });
}

void TerminalPTY::runSimulatedCommand(const QString& cmd) {
    QMutexLocker locker(&m_ptyMutex);
    QString c = cmd.trimmed();

    if (c == "help") {
        appendToBuffer("Available mock commands:\n");
        appendToBuffer("  \033[33mls\033[0m     - List VFS directory\n");
        appendToBuffer("  \033[33mmake\033[0m   - Compile kernel (triggers error)\n");
        appendToBuffer("  \033[33mclear\033[0m  - Clear buffer\n");
    } 
    else if (c == "ls") {
        appendToBuffer("\033[34mdesktop_environment/\033[0m  \033[34mvoltra_kernel/\033[0m  Makefile  readme.txt\n");
    }
    else if (c == "clear") {
        m_ringBuffer.clear();
        m_htmlOutput = "";
        emit outputChanged();
    }
    else if (c.startsWith("make")) {
        // Simulate a massive compile error
        appendToBuffer("gcc -m32 -ffreestanding -c kernel.c -o kernel.o\n");
        appendToBuffer("\033[31mkernel.c:142:5: error: expected ';' before 'return'\033[0m\n");
        appendToBuffer("\033[31mmake: *** [Makefile:22: kernel.o] Error 1\033[0m\n");
        
        // Trigger Xak AI Error Analysis
        simulateErrorAnalysis(c, "kernel.c:142:5: error: expected ';' before 'return'");
    }
    else if (!c.isEmpty()) {
        appendToBuffer("\033[31mbash: " + c + ": command not found\033[0m\n");
    }
}

void TerminalPTY::simulateErrorAnalysis(const QString& cmd, const QString& errorOut) {
    qDebug() << "[TerminalPTY] Handing error to Xak Opal AI Context...";
    QTimer::singleShot(1000, this, [this, errorOut]() {
        QString explanation = "Syntax error detected in kernel.c on line 142. A semicolon is missing.";
        QString fix = "sed -i '142s/$/;/' voltra_kernel/src/kernel.c && make";
        emit xakAiFixAvailable(explanation, fix);
    });
}

// ----------------------------------------------------------------------------
// MASSIVE ANSI ESCAPE SEQUENCE PARSER
// ----------------------------------------------------------------------------
void TerminalPTY::appendToBuffer(const QString& rawString) {
    // 1. Maintain Ring Buffer Size (Max 1000 lines for mock, normally 10k)
    m_ringBuffer.enqueue(rawString);
    if (m_ringBuffer.size() > 1000) {
        m_ringBuffer.dequeue();
    }

    // 2. Rebuild the HTML output by parsing ANSI
    QString fullHtml;
    for (const QString& line : m_ringBuffer) {
        fullHtml += parseAnsiToHtml(line);
    }
    
    // Replace newlines with HTML breaks
    fullHtml.replace("\n", "<br>");
    
    m_htmlOutput = fullHtml;
    emit outputChanged();
}

QString TerminalPTY::parseAnsiToHtml(const QString& rawString) {
    QString html = rawString;
    
    // Escape HTML symbols
    html.replace("<", "&lt;");
    html.replace(">", "&gt;");

    // Standard ANSI regex pattern: \033[Nm
    QRegularExpression ansiRegex("\033\\[(\\d+)m");
    QRegularExpressionMatchIterator i = ansiRegex.globalMatch(html);
    
    int offset = 0;
    bool inSpan = false;

    while (i.hasNext()) {
        QRegularExpressionMatch match = i.next();
        QString colorCode = match.captured(1);
        QString htmlTag;

        if (colorCode == "0") {
            if (inSpan) { htmlTag = "</span>"; inSpan = false; }
            else { htmlTag = ""; }
        } else if (colorCode == "31") {
            if (inSpan) { htmlTag = "</span>"; }
            htmlTag += "<span style='color: #FF5F56;'>";
            inSpan = true;
        } else if (colorCode == "32") {
            if (inSpan) { htmlTag = "</span>"; }
            htmlTag += "<span style='color: #27C93F;'>";
            inSpan = true;
        } else if (colorCode == "33") {
            if (inSpan) { htmlTag = "</span>"; }
            htmlTag += "<span style='color: #FFBD2E;'>";
            inSpan = true;
        } else if (colorCode == "34") {
            if (inSpan) { htmlTag = "</span>"; }
            htmlTag += "<span style='color: #4285F4;'>";
            inSpan = true;
        } else if (colorCode == "36") {
            if (inSpan) { htmlTag = "</span>"; }
            htmlTag += "<span style='color: #00FFFF;'>";
            inSpan = true;
        } else {
            htmlTag = ""; // Unhandled code
        }

        html.replace(match.capturedStart() + offset, match.capturedLength(), htmlTag);
        offset += htmlTag.length() - match.capturedLength();
    }
    
    if (inSpan) {
        html += "</span>";
    }

    return html;
}
