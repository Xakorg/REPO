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
            text: "Secure your VoltraMax."
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 40
            Layout.topMargin: 20

            // PIN Code Setup
            Rectangle {
                width: 350
                height: 300
                color: Qt.rgba(255/255, 255/255, 255/255, 0.03)
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                radius: 20

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 20

                    Text {
                        text: "🔢"
                        font.pixelSize: 48
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Device PIN"
                        font.family: "Inter"
                        font.pixelSize: 22
                        font.weight: Font.Bold
                        color: "white"
                        Layout.alignment: Qt.AlignHCenter
                    }

                    TextField {
                        placeholderText: "Enter 6-digit PIN"
                        echoMode: TextInput.Password
                        font.family: "Inter"
                        font.pixelSize: 20
                        color: "white"
                        horizontalAlignment: TextInput.AlignHCenter
                        background: Rectangle {
                            color: Qt.rgba(0,0,0,0.5)
                            border.color: parent.activeFocus ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                            radius: 8
                        }
                        padding: 15
                        Layout.preferredWidth: 200
                        Layout.alignment: Qt.AlignHCenter
                    }
                }
            }

            // Fingerprint / Biometrics
            Rectangle {
                width: 350
                height: 300
                color: fingerprintMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.08) : Qt.rgba(255/255, 255/255, 255/255, 0.03)
                border.color: fingerprintMouse.containsMouse ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.1)
                radius: 20

                Behavior on color { ColorAnimation { duration: 200 } }

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 20

                    Text {
                        text: "👆"
                        font.pixelSize: 48
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Fingerprint"
                        font.family: "Inter"
                        font.pixelSize: 22
                        font.weight: Font.Bold
                        color: "white"
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: "Add a fingerprint for\ninstant hardware login."
                        font.family: "Inter"
                        font.pixelSize: 14
                        color: "#a0a0a0"
                        horizontalAlignment: Text.AlignHCenter
                        Layout.alignment: Qt.AlignHCenter
                    }
                }

                MouseArea {
                    id: fingerprintMouse
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
                onClicked: stackView.push("MultiUserPage.qml")
            }
        }
    }
}
