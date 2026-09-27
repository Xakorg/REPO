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
            GradientStop { position: 1.0; color: "#1a1a3e" }
        }
    }

    Rectangle {
        id: glassPanel
        width: 700
        height: 620
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 28
            width: parent.width * 0.8

            Text {
                text: "Security Setup"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Protect your VoltraOS with multiple layers of security."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // PIN Code Setup
            Rectangle {
                width: parent.width
                height: 200
                color: "#151530"
                radius: 16
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 16
                    anchors.margins: 20

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 20

                        // PIN Setup
                        ColumnLayout {
                            Layout.weight: 1
                            Text { text: "🔢"; font.pixelSize: 36; Layout.alignment: Qt.AlignHCenter }
                            Text { text: "Device PIN"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                            TextField {
                                placeholderText: "Enter 4-8 digit PIN"
                                echoMode: TextInput.Password
                                Layout.fillWidth: true
                                font.pixelSize: 18
                                onAccepted: {
                                    if (text.length >= 4) OOBE.signInWithPin(text);
                                }
                            }
                        }

                        // Fingerprint Setup
                        ColumnLayout {
                            Layout.weight: 1
                            Text { text: "👆"; font.pixelSize: 36; Layout.alignment: Qt.AlignHCenter }
                            Text { text: "Fingerprint"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                            Rectangle {
                                width: 80; height: 80
                                radius: 40
                                color: OOBE.fingerprintEnrolled > 0 ? "#1a3a1a" : "#2a2a2a"
                                border.color: OOBE.fingerprintEnrolled > 0 ? "#34C759" : "#555555"
                                border.width: 2
                                anchors.horizontalCenter: parent.horizontalCenter
                                Text {
                                    text: OOBE.fingerprintEnrolled > 0 ? "✓" : "+"
                                    font.pixelSize: 32
                                    anchors.centerIn: parent
                                }
                                MouseArea {
                                    anchors.fill: parent
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: { OOBE.enrollFingerprint(); }
                                }
                            }
                        }
                    }
                }
            }

            // Drawing Pattern Setup
            Rectangle {
                width: parent.width
                height: 160
                color: "#151530"
                radius: 16
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 20
                    anchors.margins: 20

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 10
                        Text { text: "✏️"; font.pixelSize: 36; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Draw Pattern"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                        Text {
                            text: "Draw a pattern on a 3x3 grid to unlock your device."
                            font.pixelSize: 13
                            color: "#8888aa"
                            Layout.alignment: Qt.AlignHCenter
                        }
                    }

                    Rectangle {
                        width: 120; height: 120
                        radius: 8
                        color: "#0a0a1a"
                        border.color: primaryColor
                        border.width: 1
                        Text { text: "🎨"; font.pixelSize: 40; anchors.centerIn: parent }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { OOBE.setAuthMethod(4); }
                        }
                    }
                }
            }

            // Auto-lock settings
            ColumnLayout {
                width: parent.width
                spacing: 12

                Text { text: "Auto-Lock Settings"; font.pixelSize: 20; color: "white" }

                RowLayout {
                    width: parent.width
                    Rectangle {
                        Layout.fillWidth: true
                        height: 50
                        radius: 10
                        color: "#151530"
                        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                        border.width: 1
                        RowLayout {
                            anchors.centerIn: parent
                            Text { text: "Lock after"; color: "#c0c0c0"; font.pixelSize: 16 }
                            ComboBox {
                                model: ["1 minute", "5 minutes", "15 minutes", "30 minutes", "Never"]
                                currentIndex: 1
                                font.pixelSize: 14
                            }
                        }
                    }
                }
            }

            // Buttons row
            RowLayout {
                width: parent.width
                spacing: 16

                Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: 14
                    color: primaryColor
                    Text {
                        text: "Continue →"
                        color: "white"
                        font.pixelSize: 18
                        font.bold: true
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { stackView.push("MultiUserPage.qml"); }
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
