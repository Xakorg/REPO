import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Item {
    id: voltTermRoot
    anchors.fill: parent

    // Property for Xak AI Auto-Fix
    property bool isXakFixVisible: false
    property string xakExplanation: ""
    property string xakSuggestedCmd: ""

    // Deep Black Background
    Rectangle {
        id: bg
        anchors.fill: parent
        color: "#050505"
    }

    // Option B: Retro CRT Phosphor Scanlines Effect
    // Simulated via overlapping semi-transparent lines
    ShaderEffectSource {
        id: terminalSource
        sourceItem: terminalContent
        anchors.fill: parent
        hideSource: false
    }

    Item {
        id: terminalContent
        anchors.fill: parent
        anchors.margins: 10

        // The Massive Text Output
        ScrollView {
            id: scrollView
            anchors.top: parent.top
            anchors.bottom: cmdInputLayout.top
            anchors.left: parent.left
            anchors.right: parent.right
            clip: true

            Text {
                id: ptyOutput
                width: scrollView.width
                text: TerminalPTY.terminalOutput
                textFormat: Text.RichText
                color: "#00FF00" // Fallback matrix green
                font.family: "Courier New"
                font.pixelSize: 16
                wrapMode: Text.WrapAnywhere

                onTextChanged: {
                    // Auto scroll to bottom
                    scrollView.ScrollBar.vertical.position = 1.0;
                }
            }
        }

        // Input Line
        RowLayout {
            id: cmdInputLayout
            anchors.bottom: parent.bottom
            anchors.left: parent.left
            anchors.right: parent.right
            height: 30

            Text {
                text: "voltra@root:~$"
                color: "#00FFFF"
                font.family: "Courier New"
                font.pixelSize: 16
                font.bold: true
            }

            TextInput {
                id: cmdInput
                Layout.fillWidth: true
                color: "#00FF00"
                font.family: "Courier New"
                font.pixelSize: 16
                focus: true

                onAccepted: {
                    var cmd = text;
                    text = "";
                    isXakFixVisible = false; // Hide AI fix on new command
                    TerminalPTY.executeCommand(cmd);
                }
            }
        }
    }

    // CRT Scanlines Overlay
    Item {
        anchors.fill: parent
        opacity: 0.15
        Repeater {
            model: Math.floor(parent.height / 3)
            Rectangle {
                width: parent.width
                height: 1
                y: index * 3
                color: "black"
            }
        }
    }

    // Connect to C++ Signals
    Connections {
        target: TerminalPTY
        function onXakAiFixAvailable(explanation, suggestedCmd) {
            xakExplanation = explanation;
            xakSuggestedCmd = suggestedCmd;
            isXakFixVisible = true;
        }
    }

    // Xak AI Glowing Fix Popup
    Rectangle {
        id: xakFixPopup
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 20
        width: 400
        height: isXakFixVisible ? 120 : 0
        visible: height > 0
        color: "#111111"
        border.color: "#FF5F56"
        border.width: 2
        radius: 8
        clip: true

        Behavior on height { NumberAnimation { duration: 300; easing.type: Easing.OutBack } }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 5

            RowLayout {
                Text { text: "✨ Xak Opal Auto-Debugger"; color: "#FFD700"; font.bold: true; font.family: "Syne"; Layout.fillWidth: true }
            }

            Text { 
                text: voltTermRoot.xakExplanation 
                color: "white"; font.pixelSize: 12; wrapMode: Text.WordWrap; Layout.fillWidth: true 
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 30
                color: "#330000"
                border.color: "#FF5F56"
                radius: 4

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 5
                    Text { text: voltTermRoot.xakSuggestedCmd; color: "#00FF00"; font.family: "Courier New"; font.pixelSize: 12; Layout.fillWidth: true }
                    
                    Rectangle {
                        width: 60; height: 20; color: "#FF5F56"; radius: 4
                        Text { anchors.centerIn: parent; text: "RUN"; color: "white"; font.bold: true; font.pixelSize: 10 }
                        MouseArea {
                            anchors.fill: parent
                            onClicked: {
                                isXakFixVisible = false;
                                TerminalPTY.executeCommand(voltTermRoot.xakSuggestedCmd);
                            }
                        }
                    }
                }
            }
        }
    }
}
