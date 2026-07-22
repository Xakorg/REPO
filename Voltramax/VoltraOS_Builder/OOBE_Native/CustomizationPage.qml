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
            text: "Personalize your VoltraMax."
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            width: 500
            height: 450
            color: Qt.rgba(255/255, 255/255, 255/255, 0.03)
            border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
            radius: 20
            Layout.alignment: Qt.AlignHCenter

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 40
                spacing: 25

                Rectangle {
                    width: 120
                    height: 120
                    radius: 60
                    color: Qt.rgba(138/255, 43/255, 226/255, 0.5)
                    border.color: "#a855f7"
                    border.width: 2
                    Layout.alignment: Qt.AlignHCenter

                    Text {
                        anchors.centerIn: parent
                        text: "👤"
                        font.pixelSize: 50
                    }
                    
                    Text {
                        anchors.bottom: parent.bottom
                        anchors.bottomMargin: -25
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "Change Avatar"
                        color: "#a855f7"
                        font.family: "Inter"
                        font.pixelSize: 14
                    }
                }

                Item { Layout.fillHeight: true } // Spacer

                TextField {
                    placeholderText: "Local Display Name"
                    Layout.fillWidth: true
                    font.family: "Inter"
                    font.pixelSize: 20
                    color: "white"
                    background: Rectangle {
                        color: Qt.rgba(0,0,0,0.5)
                        border.color: parent.activeFocus ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                        radius: 8
                    }
                    padding: 15
                }

                TextField {
                    placeholderText: "Device Name (e.g. My-VoltraMax)"
                    Layout.fillWidth: true
                    font.family: "Inter"
                    font.pixelSize: 20
                    color: "white"
                    background: Rectangle {
                        color: Qt.rgba(0,0,0,0.5)
                        border.color: parent.activeFocus ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                        radius: 8
                    }
                    padding: 15
                }
            }
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
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
                onClicked: stackView.push("SecurityPage.qml")
            }
        }
    }
}
