import QtQuick
import QtQuick.Window

Window {
    width: 1920
    height: 1080
    visible: true
    title: qsTr("VoltraOS Setup")
    
    // Forces the OOBE to be fullscreen native, locking out the system until complete
    visibility: Window.FullScreen
    color: "#050505"

    // CINEMATIC BACKGROUND: Hardware-accelerated GPU orbs
    Rectangle {
        id: bgOrb1
        width: 1200; height: 1200
        radius: 600
        color: Qt.rgba(138/255, 43/255, 226/255, 0.15) // Xakteir Purple
        x: -200; y: -200
        
        // Fluid, zero-CPU-cost animation
        SequentialAnimation on x {
            loops: Animation.Infinite
            NumberAnimation { to: 600; duration: 20000; easing.type: Easing.InOutQuad }
            NumberAnimation { to: -200; duration: 20000; easing.type: Easing.InOutQuad }
        }
    }

    Rectangle {
        id: bgOrb2
        width: 1400; height: 1400
        radius: 700
        color: Qt.rgba(255/255, 215/255, 0/255, 0.08) // Xakteir Electric Yellow
        x: parent.width - 800; y: parent.height - 800
        
        SequentialAnimation on y {
            loops: Animation.Infinite
            NumberAnimation { to: 100; duration: 25000; easing.type: Easing.InOutQuad }
            NumberAnimation { to: parent.height - 800; duration: 25000; easing.type: Easing.InOutQuad }
        }
    }

    // MAIN CONTENT (Handled by StackView for fluid page transitions)
    StackView {
        id: stackView
        anchors.fill: parent
        initialItem: "WelcomePage.qml"

        // Custom push transition for a premium slide-up and fade-in effect
        pushEnter: Transition {
            PropertyAnimation {
                property: "opacity"
                from: 0
                to: 1
                duration: 600
                easing.type: Easing.OutCubic
            }
            PropertyAnimation {
                property: "y"
                from: 50
                to: 0
                duration: 600
                easing.type: Easing.OutBack
            }
        }
        
        pushExit: Transition {
            PropertyAnimation {
                property: "opacity"
                from: 1
                to: 0
                duration: 400
                easing.type: Easing.InCubic
            }
        }
    }
}
