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
            text: "Who else will use this device?"
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "Add family members, roommates, or set up a child account."
            font.family: "Inter"
            font.pixelSize: 24
            color: "#a0a0a0"
            Layout.alignment: Qt.AlignHCenter
        }

        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 40
            Layout.topMargin: 20

            // Add Adult User
            Rectangle {
                width: 300
                height: 350
                radius: 20
                color: adultMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.1) : Qt.rgba(255/255, 255/255, 255/255, 0.03)
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 2

                Behavior on color { ColorAnimation { duration: 250 } }

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 20

                    Text {
                        text: "🧑"
                        font.pixelSize: 64
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Add Standard User"
                        font.family: "Inter"
                        font.pixelSize: 22
                        font.weight: Font.Bold
                        color: "white"
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "They will get their own\nfiles, games, and settings."
                        font.family: "Inter"
                        font.pixelSize: 14
                        color: "#a0a0a0"
                        horizontalAlignment: Text.AlignHCenter
                        Layout.alignment: Qt.AlignHCenter
                    }
                }

                MouseArea {
                    id: adultMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: {
                        // Loop back to AccountPage for the new user, 
                        // or for now, just skip to ThemePage for demo
                        stackView.push("ThemePage.qml")
                    }
                }
            }

            // Add Child User
            Rectangle {
                width: 300
                height: 400
                radius: 20
                color: childMouse.containsMouse ? Qt.rgba(168/255, 85/255, 247/255, 0.2) : Qt.rgba(255/255, 255/255, 255/255, 0.03)
                border.color: childMouse.containsMouse ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 2

                Behavior on color { ColorAnimation { duration: 250 } }

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 15

                    Text {
                        text: "🧸"
                        font.pixelSize: 64
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Set Up Child Account"
                        font.family: "Inter"
                        font.pixelSize: 22
                        font.weight: Font.Bold
                        color: "white"
                        Layout.alignment: Qt.AlignHCenter
                    }

                    TextField {
                        id: childEmailInput
                        placeholderText: "Child's Xakteir Email"
                        Layout.fillWidth: true
                        Layout.preferredWidth: 260
                        Layout.alignment: Qt.AlignHCenter
                        font.family: "Inter"
                        font.pixelSize: 16
                        color: "white"
                        horizontalAlignment: TextInput.AlignHCenter
                        background: Rectangle {
                            color: Qt.rgba(0,0,0,0.5)
                            border.color: parent.activeFocus ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                            radius: 8
                        }
                        padding: 10
                    }

                    Text {
                        text: "Enable web filtering, screen time\nlimits, and game restrictions."
                        font.family: "Inter"
                        font.pixelSize: 14
                        color: "#a0a0a0"
                        horizontalAlignment: Text.AlignHCenter
                        Layout.alignment: Qt.AlignHCenter
                    }
                }

                MouseArea {
                    id: childMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: {
                        if (childEmailInput.text.length > 0) {
                            stackView.push("ParentalControlsPage.qml")
                        } else {
                            childEmailInput.forceActiveFocus()
                        }
                    }
                }
            }
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 40
            width: 250
            height: 60
            radius: 30
            color: skipMouse.containsMouse ? "#a855f7" : "#9333ea"
            
            Behavior on color { ColorAnimation { duration: 200 } }

            Text {
                anchors.centerIn: parent
                text: "Just Me"
                font.family: "Inter"
                font.pixelSize: 20
                font.weight: Font.DemiBold
                color: "white"
            }

            MouseArea {
                id: skipMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: stackView.push("ThemePage.qml")
            }
        }
    }
}
