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

    // MAIN CONTENT
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

                    // Real C++ Spring Physics Engine Hook
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

        // Subtitle fades in after the physics settle
        Text {
            id: subtitle
            anchors.top: titleRow.bottom
            anchors.topMargin: 50
            anchors.horizontalCenter: parent.horizontalCenter
            text: "Welcome to <font color='#ffd700'>VoltraMax</font>. Your 5-in-1 laptop. From Xakteir."
            font.family: "Inter"
            font.pixelSize: 36
            color: "#a0a0a0"
            textFormat: Text.RichText
            opacity: 0

            SequentialAnimation on opacity {
                running: true
                PauseAnimation { duration: 2500 }
                NumberAnimation { to: 1.0; duration: 2000; easing.type: Easing.InOutQuad }
            }
        }
    }
}
