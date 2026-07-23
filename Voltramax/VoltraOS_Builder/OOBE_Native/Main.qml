import QtQuick 2.15
import QtQuick.Window 2.15
import QtQuick.Controls 2.15
import QtGraphicalEffects 1.15

Window {
    id: mainWindow
    width: 1920
    height: 1080
    visible: true
    title: "VoltraOS Setup"
    // Simulate borderless full-screen enterprise setup
    flags: Qt.Window | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint

    // Bright & Ethereal Background
    Rectangle {
        id: bg
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#FFFFFF" }
            GradientStop { position: 1.0; color: "#E0E8F0" }
        }

        // Animated ambient glow spheres
        Rectangle {
            width: 800; height: 800
            radius: 400
            x: -200; y: -200
            color: "#4000AAFF" // Bright blue ethereal glow
            filterMode: Image.Pad
            
            SequentialAnimation on x {
                loops: Animation.Infinite
                NumberAnimation { to: 100; duration: 15000; easing.type: Easing.InOutQuad }
                NumberAnimation { to: -200; duration: 15000; easing.type: Easing.InOutQuad }
            }
        }
        
        Rectangle {
            width: 1000; height: 1000
            radius: 500
            x: mainWindow.width - 600; y: mainWindow.height - 600
            color: "#4000FFCC" // Soft teal glow
            
            SequentialAnimation on y {
                loops: Animation.Infinite
                NumberAnimation { to: mainWindow.height - 800; duration: 20000; easing.type: Easing.InOutSine }
                NumberAnimation { to: mainWindow.height - 600; duration: 20000; easing.type: Easing.InOutSine }
            }
        }

        // Apply a massive blur over the ambient spheres to make them look like soft light
        FastBlur {
            anchors.fill: parent
            source: bg
            radius: 128
        }
    }

    // StackView for Cinematic Page Transitions
    StackView {
        id: stackView
        anchors.fill: parent
        initialItem: "WelcomePage.qml"

        // Cinematic Push Transition
        pushEnter: Transition {
            ParallelAnimation {
                NumberAnimation { property: "opacity"; from: 0; to: 1; duration: 800; easing.type: Easing.OutCubic }
                NumberAnimation { property: "scale"; from: 1.05; to: 1.0; duration: 800; easing.type: Easing.OutExpo }
            }
        }
        pushExit: Transition {
            ParallelAnimation {
                NumberAnimation { property: "opacity"; from: 1; to: 0; duration: 600; easing.type: Easing.InCubic }
                NumberAnimation { property: "scale"; from: 1.0; to: 0.95; duration: 600; easing.type: Easing.InExpo }
            }
        }
    }

    // Global properties for pages to use
    property color primaryColor: "#007AFF"
    property color textColor: "#1C1C1E"
    property color glassColor: "#80FFFFFF"
    property color glassBorder: "#40FFFFFF"
    
    // Connect to OOBE backend signals
    Connections {
        target: OOBE
        function onOobeFinished() {
            // Trigger final cinematic close
            Qt.quit();
        }
    }
}
