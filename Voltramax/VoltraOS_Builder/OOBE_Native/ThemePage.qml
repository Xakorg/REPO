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
            text: "Choose your look."
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 30
            Layout.topMargin: 20

            // Dark Mode
            Rectangle {
                width: 300
                height: 250
                radius: 15
                color: "#111111"
                border.color: darkMouse.containsMouse ? "#ffffff" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                border.width: 2
                
                Text {
                    anchors.centerIn: parent
                    text: "Dark Mode"
                    font.family: "Inter"
                    font.pixelSize: 24
                    font.weight: Font.Bold
                    color: "white"
                }

                MouseArea {
                    id: darkMouse
                    anchors.fill: parent
                    hoverEnabled: true
                }
            }

            // Light Mode
            Rectangle {
                width: 300
                height: 250
                radius: 15
                color: "#f0f0f0"
                border.color: lightMouse.containsMouse ? "#a855f7" : "transparent"
                border.width: 2
                
                Text {
                    anchors.centerIn: parent
                    text: "Light Mode"
                    font.family: "Inter"
                    font.pixelSize: 24
                    font.weight: Font.Bold
                    color: "black"
                }

                MouseArea {
                    id: lightMouse
                    anchors.fill: parent
                    hoverEnabled: true
                }
            }

            // Xakteir Dynamic Theme
            Rectangle {
                width: 300
                height: 250
                radius: 15
                // A simulated gradient
                gradient: Gradient {
                    GradientStop { position: 0.0; color: "#2d004b" }
                    GradientStop { position: 1.0; color: "#000000" }
                }
                border.color: xakMouse.containsMouse ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                border.width: 2
                
                Text {
                    anchors.centerIn: parent
                    text: "Xakteir Dynamic"
                    font.family: "Inter"
                    font.pixelSize: 24
                    font.weight: Font.Bold
                    color: "#ffd700" // Electric Yellow accent
                }

                MouseArea {
                    id: xakMouse
                    anchors.fill: parent
                    hoverEnabled: true
                }
            }
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 40
            width: 250
            height: 60
            radius: 30
            color: nextMouse.containsMouse ? "#a855f7" : "#9333ea"
            
            Behavior on color { ColorAnimation { duration: 200 } }

            Text {
                anchors.centerIn: parent
                text: "Continue"
                font.family: "Inter"
                font.pixelSize: 20
                font.weight: Font.DemiBold
                color: "white"
            }

            MouseArea {
                id: nextMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: stackView.push("PrivacyPage.qml")
            }
        }
    }
}
