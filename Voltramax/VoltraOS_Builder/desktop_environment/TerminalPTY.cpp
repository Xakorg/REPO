#include "TerminalPTY.h"
#include <QRegularExpression>
#include <QTimer>
#include <QDebug>
#include "SyscallBridge.h"

TerminalPTY::TerminalPTY(QObject *parent) : QObject(parent) {
    // Initialize with a welcome message
    executeCommand("echo 'Welcome to VoltraOS Terminal (v1.0.0-ENTERPRISE)'");
}

TerminalPTY::~TerminalPTY() {
}

void TerminalPTY::executeCommand(const QString& command) {
    // Hardware bridge mock: We simulate executing a command via SyscallBridge
    // In a real scenario, this would use fork() / execve() via int 0x80
    qDebug() << "[TerminalPTY] Executing:" << command;
    
    // Echo the command being run
    processRawOutput("\033[1;32mvoltra@root\033[0m:\033[1;34m~\033[0m$ " + command + "\n");
    
    // Simulate complex outputs for certain commands
    if (command.startsWith("make")) {
        QTimer::singleShot(200, this, [this]() {
            processRawOutput("CC src/main.o\n");
            processRawOutput("CC src/kernel.o\n");
            processRawOutput("\033[31mError:\033[0m undefined reference to 'vmm_map_page'\n");
            processRawOutput("make: *** [Makefile:20: voltraos.iso] Error 1\n");
        });
    } else if (command == "ls") {
        QTimer::singleShot(100, this, [this]() {
            processRawOutput("\033[1;34mDesktop\033[0m  \033[1;34mDocuments\033[0m  \033[1;34mDownloads\033[0m  kernel.bin\n");
        });
    } else if (command.startsWith("echo")) {
        // Just print it back (stripping quotes for simulation)
        QString text = command.mid(5).replace("'", "").replace("\"", "");
        processRawOutput(text + "\n");
    } else {
        QTimer::singleShot(100, this, [this, command]() {
            processRawOutput("Command not found: " + command + "\n");
        });
    }
}

void TerminalPTY::askXakAI(const QString& query) {
    qDebug() << "[TerminalPTY] Xak AI Query:" << query;
    processRawOutput("\n\033[1;33m[Xak AI Analyzing Terminal Context...]\033[0m\n");
    
    // Simulate AI inference delay
    QTimer::singleShot(1500, this, [this, query]() {
        QString response;
        if (query.contains("make") || query.contains("error")) {
            response = "I detected an 'undefined reference' error. This means the linker cannot find the implementation of 'vmm_map_page'. You need to add 'src/vmm.o' to your Makefile's OBJS list.";
        } else {
            response = "I am processing your command. Do you want me to write the bash script for you?";
        }
        
        processRawOutput("\033[1;36mXak AI:\033[0m " + response + "\n");
        emit aiResponseReady(response);
    });
}

/**
 * The massive ANSI Escape Sequence Parser.
 * It manually crawls raw byte strings to interpret `\033[31;1m` style sequences.
 */
void TerminalPTY::processRawOutput(const QString& rawOutput) {
    TerminalLine currentLine;
    QString currentText = "";
    
    for (int i = 0; i < rawOutput.length(); i++) {
        QChar c = rawOutput[i];
        
        // Handle Newline
        if (c == '\n') {
            if (!currentText.isEmpty()) {
                currentLine.spans.append({currentText, m_currentForeground, m_currentBackground, m_currentBold, m_currentItalic, m_currentUnderline});
                currentText = "";
            }
            m_screenBuffer.append(currentLine);
            currentLine = TerminalLine(); // Reset for next line
            continue;
        }
        
        // Handle ANSI Escape `\033` (ESC / \e / \x1B)
        if (c == '\x1B' && i + 1 < rawOutput.length() && rawOutput[i+1] == '[') {
            // We found a sequence, push whatever text we had using current styles
            if (!currentText.isEmpty()) {
                currentLine.spans.append({currentText, m_currentForeground, m_currentBackground, m_currentBold, m_currentItalic, m_currentUnderline});
                currentText = "";
            }
            
            i += 2; // Skip \x1B and [
            QString seq = "";
            while (i < rawOutput.length() && (rawOutput[i].isDigit() || rawOutput[i] == ';')) {
                seq += rawOutput[i];
                i++;
            }
            
            // i is now at the sequence terminator (usually 'm')
            if (i < rawOutput.length() && rawOutput[i] == 'm') {
                // Parse the codes like "1;31"
                QStringList codes = seq.split(';', Qt::SkipEmptyParts);
                if (codes.isEmpty()) codes.append("0"); // Default reset
                
                for (const QString& codeStr : codes) {
                    int code = codeStr.toInt();
                    if (code == 0) { // Reset
                        m_currentForeground = QColor("#00FF00"); // Hacker Green Default
                        m_currentBackground = QColor("#000000");
                        m_currentBold = false;
                        m_currentItalic = false;
                        m_currentUnderline = false;
                    } else if (code == 1) { m_currentBold = true; }
                    else if (code == 3) { m_currentItalic = true; }
                    else if (code == 4) { m_currentUnderline = true; }
                    // Foreground Colors (30-37)
                    else if (code >= 30 && code <= 37) {
                        m_currentForeground = ANSI_COLORS[code - 30];
                    }
                    // Background Colors (40-47)
                    else if (code >= 40 && code <= 47) {
                        m_currentBackground = ANSI_COLORS[code - 40];
                    }
                }
            }
            continue;
        }
        
        currentText += c;
    }
    
    // Push remaining text
    if (!currentText.isEmpty()) {
        currentLine.spans.append({currentText, m_currentForeground, m_currentBackground, m_currentBold, m_currentItalic, m_currentUnderline});
        m_screenBuffer.append(currentLine);
    }
    
    // Ensure we don't exceed the ring buffer (e.g., 10,000 lines)
    while (m_screenBuffer.size() > 10000) {
        m_screenBuffer.removeFirst();
    }
    
    emit outputUpdated(renderToHtml());
}

QString TerminalPTY::renderToHtml() {
    QString html = "<pre style='margin: 0; white-space: pre-wrap;'>";
    for (const TerminalLine& line : m_screenBuffer) {
        for (const TerminalSpan& span : line.spans) {
            html += "<span style='";
            html += "color: " + span.foregroundColor.name() + "; ";
            // Only add background if it's not black to keep it clean
            if (span.backgroundColor != QColor("#000000")) {
                html += "background-color: " + span.backgroundColor.name() + "; ";
            }
            if (span.isBold) html += "font-weight: bold; ";
            if (span.isItalic) html += "font-style: italic; ";
            if (span.isUnderline) html += "text-decoration: underline; ";
            html += "'>";
            
            // Escape HTML entities in the raw text
            QString escapedText = span.text;
            escapedText.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
            
            html += escapedText;
            html += "</span>";
        }
        html += "<br>";
    }
    html += "</pre>";
    return html;
}
