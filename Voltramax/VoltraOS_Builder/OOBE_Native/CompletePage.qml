import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    width: 1920
    height: 1080

    Rectangle {
        width: 600
        height: 400
        anchors.centerIn: parent
        color: glassColor
        radius: 24
        border.color: glassBorder
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 30
            width: parent.width * 0.8

            Text {
                text: "You're all set."
                font.pixelSize: 42
                font.weight: Font.Light
                color: textColor
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "The system has been configured.\nWelcome to the future of computing."
                font.pixelSize: 18
                color: "#666666"
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Rectangle {
                width: 200
                height: 50
                radius: 25
                color: "#34C759" // Green
                anchors.horizontalCenter: parent.horizontalCenter
                
                Text {
                    text: "Enter VoltraOS"
                    color: "white"
                    font.pixelSize: 16
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        // Tell C++ to finalize writes and close OOBE
                        OOBE.finalizeOOBE(true, true);
                    }
                }
            }
        }
    }
}
