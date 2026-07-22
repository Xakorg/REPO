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
            text: "Meet Xak Opal."
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "The deeply integrated VoltraMax AI. Would you like to enable it?"
            font.family: "Inter"
            font.pixelSize: 24
            color: "#a0a0a0"
            Layout.alignment: Qt.AlignHCenter
        }

        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 40
            Layout.topMargin: 40

            // Enable Button
            Rectangle {
                width: 300
                height: 350
                radius: 20
                color: enableMouse.containsMouse ? Qt.rgba(168/255, 85/255, 247/255, 0.2) : Qt.rgba(255/255, 255/255, 255/255, 0.03)
                border.color: enableMouse.containsMouse ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                border.width: 2

                Behavior on color { ColorAnimation { duration: 250 } }

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 20

                    Text {
                        text: "✨"
                        font.pixelSize: 64
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Enable Xak AI"
                        font.family: "Inter"
                        font.pixelSize: 24
                        font.weight: Font.Bold
                        color: "white"
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Voice combat, system control,\nand intelligent assistance."
                        font.family: "Inter"
                        font.pixelSize: 16
                        color: "#a0a0a0"
                        horizontalAlignment: Text.AlignHCenter
                        Layout.alignment: Qt.AlignHCenter
                    }
                }

                MouseArea {
                    id: enableMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: stackView.push("XakAIPage.qml")
                }
            }

            // Disable Button
            Rectangle {
                width: 300
                height: 350
                radius: 20
                color: disableMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.1) : Qt.rgba(255/255, 255/255, 255/255, 0.03)
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 2

                Behavior on color { ColorAnimation { duration: 250 } }

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 20

                    Text {
                        text: "❌"
                        font.pixelSize: 64
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Skip AI"
                        font.family: "Inter"
                        font.pixelSize: 24
                        font.weight: Font.Bold
                        color: "white"
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Keep the system purely\nmanual and offline."
                        font.family: "Inter"
                        font.pixelSize: 16
                        color: "#606060"
                        horizontalAlignment: Text.AlignHCenter
                        Layout.alignment: Qt.AlignHCenter
                    }
                }

                MouseArea {
                    id: disableMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: stackView.push("CustomizationPage.qml") // Skip setup
                }
            }
        }
    }
}
