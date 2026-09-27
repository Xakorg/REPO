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
        width: 720
        height: 560
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 22
            width: parent.width * 0.82

            Text {
                text: "Privacy & Telemetry"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Control how VoltraOS collects and uses your data."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Diagnostic Data toggle
            Rectangle {
                width: parent.width
                height: 70
                color: "#151530"
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 16

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4
                        Text { text: "Diagnostic Data"; color: "white"; font.pixelSize: 17; font.bold: true }
                        Text { text: "Send anonymous crash reports to Xakteir to improve VoltraOS."; color: "#8888aa"; font.pixelSize: 13 }
                    }

                    Switch {
                        id: diagnosticToggle
                        checked: true
                        Layout.alignment: Qt.AlignRight
                    }
                }
            }

            // Location Services toggle
            Rectangle {
                width: parent.width
                height: 70
                color: "#151530"
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 16

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4
                        Text { text: "Location Services"; color: "white"; font.pixelSize: 17; font.bold: true }
                        Text { text: "Allow VoltraOS to use location for weather and local services."; color: "#8888aa"; font.pixelSize: 13 }
                    }

                    Switch {
                        checked: false
                        Layout.alignment: Qt.AlignRight
                    }
                }
            }

            // Usage Analytics toggle
            Rectangle {
                width: parent.width
                height: 70
                color: "#151530"
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 16

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4
                        Text { text: "Usage Analytics"; color: "white"; font.pixelSize: 17; font.bold: true }
                        Text { text: "Help us understand how VoltraOS is being used to prioritize features."; color: "#8888aa"; font.pixelSize: 13 }
                    }

                    Switch {
                        checked: OOBE.enableTelemetry
                        onCheckedChanged: { OOBE.enableTelemetry = checked; }
                        Layout.alignment: Qt.AlignRight
                    }
                }
            }

            // Data Sharing toggle
            Rectangle {
                width: parent.width
                height: 70
                color: "#151530"
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 16

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4
                        Text { text: "Data Sharing with Xakteir"; color: "white"; font.pixelSize: 17; font.bold: true }
                        Text { text: "Share device stats with Xakteir ecosystem partners."; color: "#8888aa"; font.pixelSize: 13 }
                    }

                    Switch {
                        checked: false
                        Layout.alignment: Qt.AlignRight
                    }
                }
            }

            // Encryption section
            Rectangle {
                width: parent.width
                height: 70
                color: "#151530"
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 16

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4
                        Text { text: "🛡️ Full Disk Encryption"; color: "white"; font.pixelSize: 17; font.bold: true }
                        Text { text: "All data is encrypted at rest using AES-256."; color: "#34C759"; font.pixelSize: 13 }
                    }

                    Text {
                        text: "✓ Active"
                        color: "#34C759"
                        font.pixelSize: 16
                        font.bold: true
                        Layout.alignment: Qt.AlignRight
                    }
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
                        text: "Continue →"
                        color: "white"
                        font.pixelSize: 18
                        font.bold: true
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { stackView.push("XakAIOptInPage.qml"); }
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
                        onClicked: { stackView.push("XakAIOptInPage.qml"); }
                    }
                }
            }
        }
    }
}
