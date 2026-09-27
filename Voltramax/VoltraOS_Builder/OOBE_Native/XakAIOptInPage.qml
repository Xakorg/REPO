import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: root
    width: 1920
    height: 1080

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0a0a1a" }
            GradientStop { position: 1.0; color: "#1a003e" }
        }
    }

    Rectangle {
        id: glassPanel
        width: 720
        height: 580
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 28
            width: parent.width * 0.82

            Text {
                text: "Meet Xak Opal"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "The deeply integrated VoltraOS AI assistant. Would you like to enable it?"
                font.pixelSize: 16
                color: "#a0a0c0"
                anchors.horizontalCenter: parent.horizontalCenter
                horizontalAlignment: Text.AlignHCenter
            }

            RowLayout {
                width: parent.width
                spacing: 24
                Layout.topMargin: 15

                // Enable AI
                Rectangle {
                    width: parent.Layout.fillWidth ? (parent.width * 0.44) : 300
                    height: 320
                    radius: 16
                    color: enableMouse.containsMouse ? Qt.rgba(168/255, 85/255, 247/255, 0.15) : Qt.rgba(255/255, 255/255, 255/255, 0.03)
                    border.color: enableMouse.containsMouse ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                    border.width: 2
                    Behavior on color { ColorAnimation { duration: 250 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 20

                        Rectangle {
                            width: 80; height: 80
                            radius: 40
                            color: "#a855f7"
                            Text { text: "✨"; font.pixelSize: 36; anchors.centerIn: parent }
                        }

                        Text { text: "Enable Xak AI"; font.pixelSize: 22; color: "white"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Full voice commands, smart suggestions, and AI-powered automation."; font.pixelSize: 14; color: "#a0a0c0"; Layout.alignment: Qt.AlignHCenter }

                        ListView {
                            width: parent.width * 0.8
                            height: 80
                            spacing: 4
                            model: ["\"Hey Xak, what's the weather?\"", "\"Hey Xak, set a timer\"", "\"Hey Xak, find my files\""]
                            delegate: Text { text: modelData; font.pixelSize: 12; color: "#6666aa"; font.italic: true }
                        }
                    }

                    MouseArea {
                        id: enableMouse
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { OOBE.enableXakAI = true; stackView.push("XakAIPage.qml"); }
                    }
                }

                // Decline AI
                Rectangle {
                    width: parent.Layout.fillWidth ? (parent.width * 0.44) : 300
                    height: 320
                    radius: 16
                    color: declineMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.08) : Qt.rgba(255/255, 255/255, 255/255, 0.02)
                    border.color: declineMouse.containsMouse ? "#666666" : Qt.rgba(255/255, 255/255, 255/255, 0.1)
                    border.width: 2
                    Behavior on color { ColorAnimation { duration: 250 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 20

                        Rectangle {
                            width: 80; height: 80
                            radius: 40
                            color: "#333333"
                            Text { text: "✗"; font.pixelSize: 36; color: "#888888"; anchors.centerIn: parent }
                        }

                        Text { text: "Skip for Now"; font.pixelSize: 22; color: "white"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "You can enable Xak AI later from Settings."; font.pixelSize: 14; color: "#a0a0c0"; Layout.alignment: Qt.AlignHCenter }

                        Text { text: "Or continue without AI"; font.pixelSize: 13; color: primaryColor; font.italic: true; Layout.alignment: Qt.AlignHCenter }
                    }

                    MouseArea {
                        id: declineMouse
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { OOBE.enableXakAI = false; stackView.push("CompletePage.qml"); }
                    }
                }
            }

            // AI capabilities preview
            Rectangle {
                width: parent.width
                height: 120
                color: "#151530"
                radius: 14
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 8

                    Text { text: "Xak AI Capabilities"; font.pixelSize: 18; color: "#a855f7" }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12

                        Repeater {
                            model: ["🎤 Voice Control", "🔍 Smart Search", "📝 Auto-Complete", "🎮 Game Assist", "🛡️ Threat Scan"]
                            delegate: Rectangle {
                                width: parent.Layout.fillWidth ? (parent.width * 0.44) : 100
                                height: 40
                                radius: 8
                                color: "#1a1a3e"
                                Text { text: "  " + modelData; color: "#c0c0c0"; font.pixelSize: 13 }
                            }
                        }
                    }
                }
            }
        }
    }
}
