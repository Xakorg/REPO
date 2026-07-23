import QtQuick 2.15
import QtQuick.Controls 2.15
import QtGraphicalEffects 1.15

Window {
    id: terminalWindow
    width: 1000
    height: 600
    title: "Terminal"
    color: "transparent"
    flags: Qt.Window | Qt.FramelessWindowHint

    // Cyberpunk Hacker Background
    Rectangle {
        id: bg
        anchors.fill: parent
        color: "#0a0a0c" // Deepest black
        border.color: "#00FF00"
        border.width: 1
        radius: 12
        
        // CRT Scanline Overlay
        Rectangle {
            anchors.fill: parent
            color: "transparent"
            radius: 12
            clip: true
            
            Repeater {
                model: terminalWindow.height / 4
                Rectangle {
                    width: parent.width
                    height: 1
                    y: index * 4
                    color: Qt.rgba(0, 0, 0, 0.4)
                }
            }
        }
        
        // Top Title Bar
        Rectangle {
            id: titleBar
            width: parent.width
            height: 40
            color: "#1a1a1c"
            radius: 12
            Rectangle {
                width: parent.width
                height: 10
                anchors.bottom: parent.bottom
                color: "#1a1a1c" // Cover bottom corners
            }
            
            Text {
                text: "voltra@root: ~ (bash)"
                color: "#00FF00"
                font.family: "Monospace"
                font.bold: true
                font.pixelSize: 14
                anchors.centerIn: parent
            }

            // Window Controls (Red, Yellow, Green)
            Row {
                anchors.right: parent.right
                anchors.rightMargin: 15
                anchors.verticalCenter: parent.verticalCenter
                spacing: 10
                
                Rectangle { width: 12; height: 12; radius: 6; color: "#FF5F56" }
                Rectangle { width: 12; height: 12; radius: 6; color: "#FFBD2E" }
                Rectangle { width: 12; height: 12; radius: 6; color: "#27C93F" }
            }
        }

        // Terminal Output Area
        ScrollView {
            id: scrollView
            anchors.top: titleBar.bottom
            anchors.bottom: commandRow.top
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.margins: 10
            
            TextEdit {
                id: terminalOutput
                width: parent.width
                readOnly: true
                textFormat: Text.RichText
                font.family: "Consolas, Courier New, Monospace"
                font.pixelSize: 15
                color: "#00FF00"
                wrapMode: TextEdit.Wrap
                selectByMouse: true
                
                // Glowing text effect
                layer.enabled: true
                layer.effect: Glow {
                    radius: 2
                    samples: 5
                    color: "#4000FF00" // Subtle green glow
                    source: terminalOutput
                }
            }
        }

        // Bottom Command Row
        Row {
            id: commandRow
            anchors.bottom: xakBar.top
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.margins: 10
            height: 30
            spacing: 5
            
            Text {
                text: "voltra@root:~$"
                color: "#00FF00"
                font.family: "Consolas, Courier New, Monospace"
                font.bold: true
                font.pixelSize: 15
                anchors.verticalCenter: parent.verticalCenter
            }
            
            TextField {
                id: commandInput
                width: parent.width - x - 10
                height: parent.height
                color: "#00FF00"
                font.family: "Consolas, Courier New, Monospace"
                font.pixelSize: 15
                background: Rectangle { color: "transparent" }
                
                onAccepted: {
                    if (text !== "") {
                        // Assuming TerminalPTY is exposed as a context property or global
                        if (typeof VoltPTY !== "undefined") {
                            VoltPTY.executeCommand(text);
                        } else {
                            terminalOutput.text += "<br><span style='color:#FF0000'>Error: VoltPTY C++ Backend not linked.</span>";
                        }
                        text = "";
                    }
                }
            }
        }

        // Xak AI Integration Bar
        Rectangle {
            id: xakBar
            anchors.bottom: parent.bottom
            anchors.left: parent.left
            anchors.right: parent.right
            height: 40
            color: "#1a1a1c"
            radius: 12
            border.color: "#00FF00"
            border.width: 1
            Rectangle {
                width: parent.width
                height: 10
                anchors.top: parent.top
                color: "#1a1a1c" // Cover top corners
            }
            
            Row {
                anchors.fill: parent
                anchors.margins: 5
                spacing: 10
                
                Text {
                    text: "✨ Ask Xak:"
                    color: "#ffd700" // Glowing yellow
                    font.family: "Consolas"
                    font.pixelSize: 14
                    anchors.verticalCenter: parent.verticalCenter
                }
                
                TextField {
                    id: xakInput
                    width: parent.width - 200
                    height: parent.height
                    placeholderText: "e.g., Explain the last error..."
                    placeholderTextColor: "#80ffd700"
                    color: "#ffd700"
                    font.family: "Consolas"
                    font.pixelSize: 14
                    background: Rectangle { color: "transparent" }
                    
                    onAccepted: {
                        if (text !== "" && typeof VoltPTY !== "undefined") {
                            VoltPTY.askXakAI(text);
                            text = "";
                        }
                    }
                }
            }
        }
    }
    
    // Connect to C++ Backend Signals
    Connections {
        target: typeof VoltPTY !== "undefined" ? VoltPTY : null
        function onOutputUpdated(html) {
            terminalOutput.text = html;
            // Scroll to bottom
            scrollView.ScrollBar.vertical.position = 1.0;
        }
    }
}
