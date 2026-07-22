import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: root
    width: 1920
    height: 1080

    ColumnLayout {
        anchors.centerIn: parent
        spacing: 30

        Text {
            text: "All Set."
            font.family: "Syne"
            font.pixelSize: 100
            font.weight: Font.Black
            color: "white"
            Layout.alignment: Qt.AlignHCenter
            opacity: 0

            NumberAnimation on opacity {
                from: 0; to: 1; duration: 1500; easing.type: Easing.InOutQuad
            }
        }

        Text {
            text: "Your VoltraMax is ready."
            font.family: "Inter"
            font.pixelSize: 32
            color: "#ffd700"
            Layout.alignment: Qt.AlignHCenter
            opacity: 0

            SequentialAnimation on opacity {
                running: true
                PauseAnimation { duration: 1000 }
                NumberAnimation { to: 1.0; duration: 1500; easing.type: Easing.InOutQuad }
            }
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 80
            width: 300
            height: 80
            radius: 40
            color: launchMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.2) : Qt.rgba(255/255, 255/255, 255/255, 0.1)
            border.color: "white"
            border.width: 2
            opacity: 0

            SequentialAnimation on opacity {
                running: true
                PauseAnimation { duration: 2500 }
                NumberAnimation { to: 1.0; duration: 1500; easing.type: Easing.InOutQuad }
            }

            Behavior on color { ColorAnimation { duration: 200 } }

            Text {
                anchors.centerIn: parent
                text: "Launch VoltraOS"
                font.family: "Inter"
                font.pixelSize: 24
                font.weight: Font.Bold
                color: "white"
                letterSpacing: 2
            }

            MouseArea {
                id: launchMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: {
                    // In a real environment, this would call a C++ backend to exit OOBE and launch Wayland/Desktop
                    Qt.quit();
                }
            }
        }
    }
}
