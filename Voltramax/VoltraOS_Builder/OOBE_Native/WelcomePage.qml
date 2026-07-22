import QtQuick
import QtQuick.Controls

Item {
    id: root
    width: 1920
    height: 1080

    Item {
        anchors.centerIn: parent
        width: childrenRect.width
        height: childrenRect.height

        Row {
            id: titleRow
            spacing: 5
            anchors.horizontalCenter: parent.horizontalCenter

            // Dynamic Letter Generation for VOLTRAMAX
            Repeater {
                model: ["V", "O", "L", "T", "R", "A", "M", "A", "X"]
                
                Text {
                    text: modelData
                    font.family: "Syne"
                    font.pixelSize: 140
                    font.weight: Font.Black
                    font.letterSpacing: 15
                    color: "white"
                    opacity: 0
                    y: 100

                    SpringAnimation on y {
                        from: 100
                        to: 0
                        spring: 2.0
                        damping: 0.15
                        epsilon: 0.25
                        running: true
                    }

                    NumberAnimation on opacity {
                        from: 0
                        to: 1
                        duration: 1000
                        easing.type: Easing.OutCubic
                        running: true
                    }
                }
            }
        }

        Text {
            id: subtitle
            anchors.top: titleRow.bottom
            anchors.topMargin: 30
            anchors.horizontalCenter: parent.horizontalCenter
            text: "Welcome to <font color='#ffd700'>VoltraMax</font>. Your 5-in-1 laptop. From Xakteir."
            font.family: "Inter"
            font.pixelSize: 36
            color: "#a0a0a0"
            textFormat: Text.RichText
            opacity: 0

            SequentialAnimation on opacity {
                running: true
                PauseAnimation { duration: 2000 }
                NumberAnimation { to: 1.0; duration: 1500; easing.type: Easing.InOutQuad }
            }
        }

        // Gorgeous Glassmorphism Button
        Rectangle {
            id: startButton
            anchors.top: subtitle.bottom
            anchors.topMargin: 80
            anchors.horizontalCenter: parent.horizontalCenter
            width: 280
            height: 70
            radius: 35
            color: mouseArea.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.15) : Qt.rgba(255/255, 255/255, 255/255, 0.05)
            border.color: mouseArea.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.3) : Qt.rgba(255/255, 255/255, 255/255, 0.1)
            border.width: 1
            opacity: 0

            Behavior on color { ColorAnimation { duration: 250 } }
            Behavior on border.color { ColorAnimation { duration: 250 } }

            Text {
                anchors.centerIn: parent
                text: "Begin Setup"
                font.family: "Inter"
                font.pixelSize: 22
                font.weight: Font.DemiBold
                color: "white"
                letterSpacing: 2
            }

            MouseArea {
                id: mouseArea
                anchors.fill: parent
                hoverEnabled: true
                onClicked: stackView.push("LanguagePage.qml")
            }

            SequentialAnimation on opacity {
                running: true
                PauseAnimation { duration: 3500 }
                NumberAnimation { to: 1.0; duration: 1500; easing.type: Easing.InOutQuad }
            }
        }
    }
}
