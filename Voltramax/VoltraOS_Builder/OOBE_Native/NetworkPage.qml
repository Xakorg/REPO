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
            text: "Let's get connected."
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "Select a Wi-Fi network to continue."
            font.family: "Inter"
            font.pixelSize: 24
            color: "#a0a0a0"
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            width: 600
            height: 400
            color: Qt.rgba(255/255, 255/255, 255/255, 0.03)
            border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
            radius: 20
            Layout.alignment: Qt.AlignHCenter
            
            ListView {
                anchors.fill: parent
                anchors.margins: 10
                clip: true
                model: ListModel {
                    ListElement { name: "Xakteir_5G_Ultra"; strength: "Excellent"; secure: true }
                    ListElement { name: "Voltra_Internal"; strength: "Good"; secure: true }
                    ListElement { name: "Guest_Network"; strength: "Fair"; secure: false }
                }
                delegate: Rectangle {
                    width: ListView.view.width
                    height: 80
                    color: itemMouseArea.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.1) : "transparent"
                    radius: 10

                    Behavior on color { ColorAnimation { duration: 200 } }

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 20
                        
                        Text {
                            text: name
                            font.family: "Inter"
                            font.pixelSize: 22
                            color: "white"
                            Layout.fillWidth: true
                        }

                        Text {
                            text: secure ? "🔒 " + strength : "🔓 " + strength
                            font.family: "Inter"
                            font.pixelSize: 18
                            color: "#888888"
                        }
                    }

                    MouseArea {
                        id: itemMouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        onClicked: stackView.push("XakteirAccountPage.qml")
                    }
                }
            }
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 20
            width: 200
            height: 50
            radius: 25
            color: skipMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.1) : "transparent"
            border.color: Qt.rgba(255/255, 255/255, 255/255, 0.2)
            
            Behavior on color { ColorAnimation { duration: 200 } }

            Text {
                anchors.centerIn: parent
                text: "Skip for now"
                font.family: "Inter"
                font.pixelSize: 18
                color: "#aaaaaa"
            }

            MouseArea {
                id: skipMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: stackView.push("XakteirAccountPage.qml")
            }
        }
    }
}
