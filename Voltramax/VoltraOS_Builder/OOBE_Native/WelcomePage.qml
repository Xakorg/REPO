import QtQuick 2.15
import QtQuick.Controls 2.15
import QtGraphicalEffects 1.15

Item {
    width: 1920
    height: 1080

    // Center Glass Panel
    Rectangle {
        id: glassPanel
        width: 600
        height: 400
        anchors.centerIn: parent
        color: glassColor
        radius: 24
        border.color: glassBorder
        border.width: 1
        
        // Initial entry animation for the panel itself
        scale: 0.9
        opacity: 0
        Component.onCompleted: {
            panelAnim.start()
        }
        ParallelAnimation {
            id: panelAnim
            NumberAnimation { target: glassPanel; property: "opacity"; to: 1; duration: 1000; easing.type: Easing.OutCubic }
            NumberAnimation { target: glassPanel; property: "scale"; to: 1; duration: 1000; easing.type: Easing.OutBack }
        }

        Column {
            anchors.centerIn: parent
            spacing: 30
            width: parent.width * 0.8

            Text {
                text: "Welcome to VoltraOS"
                font.pixelSize: 42
                font.weight: Font.Light
                color: textColor
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "The absolute pinnacle of enterprise engineering."
                font.pixelSize: 18
                color: "#666666"
                anchors.horizontalCenter: parent.horizontalCenter
                horizontalAlignment: Text.AlignHCenter
            }

            // Custom Premium Button
            Rectangle {
                id: startBtn
                width: 200
                height: 50
                radius: 25
                color: primaryColor
                anchors.horizontalCenter: parent.horizontalCenter
                
                Text {
                    text: "Begin Setup"
                    color: "white"
                    font.pixelSize: 16
                    font.weight: Font.Medium
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    onEntered: btnHover.start()
                    onExited: btnHoverRev.start()
                    onClicked: {
                        startBtn.opacity = 0.5; // simple click feedback
                        stackView.push("NetworkPage.qml");
                    }
                }

                NumberAnimation { id: btnHover; target: startBtn; property: "scale"; to: 1.05; duration: 200; easing.type: Easing.OutQuad }
                NumberAnimation { id: btnHoverRev; target: startBtn; property: "scale"; to: 1.0; duration: 200; easing.type: Easing.OutQuad }
            }
        }
    }
}
