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
    flags: Qt.Window | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint

    // Dark background for OOBE
    Rectangle {
        id: bg
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0a0a1a" }
            GradientStop { position: 0.5; color: "#1a1a3e" }
            GradientStop { position: 1.0; color: "#0a0a1a" }
        }

        // Animated ambient glow spheres
        Rectangle {
            width: 800; height: 800
            radius: 400
            x: -200; y: -200
            color: "#2000AAFF"
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
            color: "#2000FFCC"
            SequentialAnimation on y {
                loops: Animation.Infinite
                NumberAnimation { to: mainWindow.height - 800; duration: 20000; easing.type: Easing.InOutSine }
                NumberAnimation { to: mainWindow.height - 600; duration: 20000; easing.type: Easing.InOutSine }
            }
        }

        FastBlur {
            anchors.fill: parent
            source: bg
            radius: 128
        }
    }

    // StackView for cinematic page transitions
    StackView {
        id: stackView
        anchors.fill: parent
        initialItem: "WelcomePage.qml"
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

    // Global styling properties
    property color primaryColor: "#007AFF"
    property color textColor: "#E0E0E0"
    property color glassColor: Qt.rgba(10/255, 10/255, 20/255, 0.85)
    property color glassBorder: Qt.rgba(255/255, 255/255, 255/255, 0.15)

    // Connect to OOBE backend signals
    Connections {
        target: OOBE
        function onOobeFinished() {
            Qt.quit();
        }
        function onXakteirAuthSuccess() {
            console.log("[Main] Xakteir auth success!");
        }
        function onXakteirAuthFailed() {
            console.log("[Main] Xakteir auth failed.");
        }
        function onFingerprintEnrolledComplete() {
            console.log("[Main] Fingerprint enrolled successfully.");
        }
        function onDrawingVerified() {
            console.log("[Main] Drawing pattern verified.");
        }
        function onNetworkConnectionSuccess() {
            console.log("[Main] Network connected.");
        }
        function onNetworkConnectionFailed() {
            console.log("[Main] Network connection failed.");
        }
    }
}
