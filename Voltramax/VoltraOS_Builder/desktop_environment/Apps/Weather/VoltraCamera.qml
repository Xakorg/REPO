import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15
import QtGraphicalEffects 1.15

Window {
    id: cameraWindow
    width: 1280
    height: 720
    visible: true
    title: "Voltra Camera"
    color: "black"
    flags: Qt.Window | Qt.FramelessWindowHint

    // Simulated Camera Feed (A dark, subtly animating gradient)
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#111111" }
            GradientStop { position: 1.0; color: "#222222" }
        }
    }

    // Drag Area (Title Bar)
    MouseArea {
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        height: 50
        property point startPos: Qt.point(0, 0)
        onPressed: startPos = Qt.point(mouse.x, mouse.y)
        onPositionChanged: {
            if (pressed) {
                cameraWindow.x += mouse.x - startPos.x
                cameraWindow.y += mouse.y - startPos.y
            }
        }
    }

    // Close Button
    Rectangle {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.margins: 20
        width: 16; height: 16; radius: 8; color: "#FF5F56"
        MouseArea { anchors.fill: parent; onClicked: cameraWindow.close() }
    }

    // Live AI AR Tracking Indicators (Sci-Fi squares scanning faces)
    Rectangle {
        width: 200; height: 200
        anchors.centerIn: parent
        color: "transparent"
        border.color: "#FFD700"
        border.width: 2
        opacity: 0.7
        
        Rectangle { width: 10; height: 10; color: "#FFD700"; anchors.top: parent.top; anchors.left: parent.left }
        Rectangle { width: 10; height: 10; color: "#FFD700"; anchors.bottom: parent.bottom; anchors.right: parent.right }
        
        SequentialAnimation on scale {
            loops: Animation.Infinite
            NumberAnimation { to: 1.05; duration: 1000; easing.type: Easing.InOutSine }
            NumberAnimation { to: 0.95; duration: 1000; easing.type: Easing.InOutSine }
        }
    }

    // AR Filter Carousel (Bottom)
    Rectangle {
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 120
        color: Qt.rgba(0, 0, 0, 0.6)

        ListView {
            anchors.fill: parent
            orientation: ListView.Horizontal
            spacing: 20
            anchors.margins: 20
            
            model: ["Natural", "Studio Light", "Cinematic", "Xak Background", "Neon Glitch", "Thermal"]
            
            delegate: Rectangle {
                width: 80; height: 80; radius: 40
                color: "#22FFFFFF"
                border.color: index === 3 ? "#a855f7" : "#44FFFFFF" // Highlight Xak filter
                border.width: index === 3 ? 3 : 1
                
                Text {
                    anchors.centerIn: parent
                    text: modelData
                    color: "white"
                    font.family: "Inter"
                    font.pixelSize: 10
                    horizontalAlignment: Text.AlignHCenter
                    wrapMode: Text.Wrap
                    width: 60
                }
            }
        }
    }

    // Shutter Button
    Rectangle {
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 25
        width: 70; height: 70; radius: 35
        color: "transparent"
        border.color: "white"
        border.width: 4
        
        Rectangle {
            anchors.centerIn: parent
            width: 54; height: 54; radius: 27
            color: "white"
            
            MouseArea {
                anchors.fill: parent
                onPressed: parent.scale = 0.9
                onReleased: parent.scale = 1.0
            }
            Behavior on scale { NumberAnimation { duration: 100 } }
        }
    }
}
