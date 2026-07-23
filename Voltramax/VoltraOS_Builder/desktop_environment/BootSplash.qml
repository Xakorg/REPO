import QtQuick 2.15
import QtQuick.Window 2.15

Window {
    id: bootSplash
    width: 1920
    height: 1080
    visible: true
    title: "VoltraOS Booting..."
    // Fullscreen borderless window to take raw control of the DRM framebuffer during boot
    flags: Qt.FramelessWindowHint | Qt.Window
    color: "#050505"

    property int bootProgress: 0

    // Center Logo
    Column {
        anchors.centerIn: parent
        spacing: 30

        Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: "VOLTRA"
            color: "white"
            font.pixelSize: 80
            font.bold: true
            font.letterSpacing: 20
            font.family: "Syne"
        }

        // 3-Second Loading Bar
        Rectangle {
            anchors.horizontalCenter: parent.horizontalCenter
            width: 400
            height: 4
            color: "#222"
            radius: 2

            Rectangle {
                id: progressBar
                height: 4
                width: (bootProgress / 100) * 400
                color: "#FFBD2E" // Industrial Boot Yellow
                radius: 2
            }
        }

        Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: {
                if (bootProgress < 30) return "Loading Kernel Modules...";
                if (bootProgress < 70) return "Mounting VFS...";
                if (bootProgress < 90) return "Starting Display Server...";
                return "Handing over to User Space...";
            }
            color: "#666"
            font.pixelSize: 14
            font.family: "Courier New"
        }
    }

    // The 3-second boot timer (3000ms)
    Timer {
        id: bootTimer
        interval: 30 // Update every 30ms (100 steps = 3000ms total)
        repeat: true
        running: true
        onTriggered: {
            bootProgress += 1;
            if (bootProgress >= 100) {
                bootTimer.stop();
                loadDesktop();
            }
        }
    }

    function loadDesktop() {
        var component = Qt.createComponent("Desktop.qml");
        if (component.status === Component.Ready) {
            var desktopWindow = component.createObject(null);
            desktopWindow.showFullScreen(); // Launch desktop
            bootSplash.destroy(); // Destroy the boot screen to free memory
        } else {
            console.error("Kernel Panic: Failed to load Desktop Environment ->", component.errorString());
        }
    }
}
