import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: root
    width: 1920
    height: 1080

    ColumnLayout {
        anchors.centerIn: parent
        spacing: 40

        Text {
            text: "Privacy & Telemetry."
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            width: 700
            height: 350
            color: Qt.rgba(255/255, 255/255, 255/255, 0.03)
            border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
            radius: 20
            Layout.alignment: Qt.AlignHCenter

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 40
                spacing: 20

                // Diagnostic Data
                RowLayout {
                    Layout.fillWidth: true
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        Text { text: "Diagnostic Data"; color: "white"; font.pixelSize: 20; font.bold: true; font.family: "Inter" }
                        Text { text: "Send anonymous crash reports to Xakteir to help improve VoltraOS."; color: "#a0a0a0"; font.pixelSize: 14; font.family: "Inter" }
                    }
                    Switch { checked: true }
                }

                Rectangle { height: 1; Layout.fillWidth: true; color: Qt.rgba(255/255, 255/255, 255/255, 0.1) }

                // Location Services
                RowLayout {
                    Layout.fillWidth: true
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        Text { text: "Location Services"; color: "white"; font.pixelSize: 20; font.bold: true; font.family: "Inter" }
                        Text { text: "Allow apps like Weather and Maps to access your location."; color: "#a0a0a0"; font.pixelSize: 14; font.family: "Inter" }
                    }
                    Switch { checked: true }
                }

                Rectangle { height: 1; Layout.fillWidth: true; color: Qt.rgba(255/255, 255/255, 255/255, 0.1) }

                // Voice AI Training Data
                RowLayout {
                    Layout.fillWidth: true
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        Text { text: "Help Improve Xak AI"; color: "white"; font.pixelSize: 20; font.bold: true; font.family: "Inter" }
                        Text { text: "Allow Xak AI to process voice snippets to improve latency and accuracy."; color: "#a0a0a0"; font.pixelSize: 14; font.family: "Inter" }
                    }
                    Switch { checked: false }
                }
            }
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 20
            width: 250
            height: 60
            radius: 30
            color: nextMouse.containsMouse ? "#a855f7" : "#9333ea"
            
            Behavior on color { ColorAnimation { duration: 200 } }

            Text {
                anchors.centerIn: parent
                text: "Accept"
                font.family: "Inter"
                font.pixelSize: 20
                font.weight: Font.DemiBold
                color: "white"
            }

            MouseArea {
                id: nextMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: stackView.push("CompletePage.qml")
            }
        }
    }
}
