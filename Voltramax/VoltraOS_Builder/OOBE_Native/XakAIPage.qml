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

    // AI glow border
    Rectangle {
        id: xakGlow
        anchors.fill: parent
        color: "transparent"
        border.color: "#3b82f6"
        border.width: 0
        opacity: 0.8
        Behavior on border.color { ColorAnimation { duration: 500 } }
        Behavior on border.width { NumberAnimation { duration: 300; easing.type: Easing.OutBack } }
    }

    Rectangle {
        id: glassPanel
        width: 720
        height: 600
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 25
            width: parent.width * 0.82

            Text {
                text: "Train Your Voice"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Say <font color='#3b82f7'>\"Hey Xak\"</font> to activate Xak AI anytime."
                font.pixelSize: 18
                color: "#a0a0c0"
                anchors.horizontalCenter: parent.horizontalCenter
                textFormat: Text.RichText
            }

            // Voice waveform visualization
            Rectangle {
                width: parent.width
                height: 120
                color: "#0a0a1a"
                radius: 16
                border.color: "#333355"
                border.width: 1

                // Animated waveform bars
                RowLayout {
                    anchors.centerIn: parent
                    spacing: 3

                    Repeater {
                        model: 40
                        delegate: Rectangle {
                            width: 6
                            height: voiceLevel > 0 ? (Math.random() * 60 + 10) : 4
                            radius: 3
                            color: voiceActive ? "#3b82f7" : "#333355"
                            Layout.alignment: Qt.AlignVCenter

                            Behavior on height { NumberAnimation { duration: 100 } }
                        }
                    }
                }

                Text {
                    text: voiceActive ? "Listening..." : "Tap to record voice sample"
                    font.pixelSize: 16
                    color: voiceActive ? "#3b82f7" : "#666666"
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        voiceActive = !voiceActive;
                        if (voiceActive) {
                            // Simulate voice training
                            voiceLevel = 80;
                            QTimer.singleShot(3000, function() {
                                voiceActive = false;
                                voiceLevel = 0;
                                stackView.push("CustomizationPage.qml");
                            });
                        }
                    }
                }
            }

            property bool voiceActive: false
            property int voiceLevel: 0

            // Training progress
            Rectangle {
                width: parent.width
                height: 60
                color: "#151530"
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 16

                    Text {
                        text: "Training Progress"
                        color: "white"
                        font.pixelSize: 16
                        Layout.alignment: Qt.AlignVCenter
                    }

                    ProgressBar {
                        Layout.fillWidth: true
                        from: 0
                        to: 100
                        value: voiceTrainingProgress
                    }

                    Text {
                        text: voiceTrainingProgress + "%"
                        color: primaryColor
                        font.pixelSize: 16
                        font.bold: true
                    }
                }
            }

            property int voiceTrainingProgress: 0

            // Instructions
            Rectangle {
                width: parent.width
                height: 100
                color: "#151530"
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 8

                    Text { text: "📋 Voice Training Instructions"; color: "#3b82f7"; font.pixelSize: 18 }
                    Text { text: "1. Say \"Hey Xak\" clearly when prompted"; color: "#a0a0c0"; font.pixelSize: 14 }
                    Text { text: "2. Repeat 3 phrases for accurate voice matching"; color: "#a0a0c0"; font.pixelSize: 14 }
                    Text { text: "3. Training takes approximately 30 seconds"; color: "#666688"; font.pixelSize: 13 }
                }
            }

            // Buttons
            RowLayout {
                width: parent.width
                spacing: 16

                Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: 14
                    color: primaryColor
                    Text {
                        text: "Start Training →"
                        color: "white"
                        font.pixelSize: 18
                        font.bold: true
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            voiceActive = true;
                            voiceTrainingProgress = 33;
                            QTimer.singleShot(2000, function() {
                                voiceTrainingProgress = 66;
                            });
                            QTimer.singleShot(4000, function() {
                                voiceTrainingProgress = 100;
                                stackView.push("CompletePage.qml");
                            });
                        }
                    }
                }

                Rectangle {
                    width: 120
                    height: 52
                    radius: 14
                    color: "#40FFFFFF"
                    border.color: "#CCCCCC"
                    border.width: 1
                    Text {
                        text: "Skip"
                        color: "#666666"
                        font.pixelSize: 16
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { stackView.push("CompletePage.qml"); }
                    }
                }
            }
        }
    }
}
