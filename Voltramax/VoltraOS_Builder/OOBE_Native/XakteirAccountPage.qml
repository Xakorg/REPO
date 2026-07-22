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
            text: "Sign in to Xakteir"
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "Sync your files, games, and settings across the ecosystem."
            font.family: "Inter"
            font.pixelSize: 24
            color: "#a0a0a0"
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            width: 500
            height: 300
            color: Qt.rgba(255/255, 255/255, 255/255, 0.03)
            border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
            radius: 20
            Layout.alignment: Qt.AlignHCenter

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 40
                spacing: 25

                TextField {
                    placeholderText: "Email or Xakteir ID"
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
                    placeholderText: "Password"
                    echoMode: TextInput.Password
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

                Rectangle {
                    Layout.fillWidth: true
                    height: 50
                    radius: 25
                    color: signInMouse.containsMouse ? "#a855f7" : "#9333ea"
                    
                    Behavior on color { ColorAnimation { duration: 200 } }

                    Text {
                        anchors.centerIn: parent
                        text: "Sign In"
                        font.family: "Inter"
                        font.pixelSize: 20
                        font.weight: Font.DemiBold
                        color: "white"
                    }

                    MouseArea {
                        id: signInMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        onClicked: stackView.push("XakAIOptInPage.qml")
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
                onClicked: stackView.push("XakAIOptInPage.qml")
            }
        }
    }
}
