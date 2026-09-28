import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Window {
    id: lockScreen
    width: 1920
    height: 1080
    visible: true
    visibility: Window.FullScreen

    // Weather-based background with animated character
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0a0a1a" }
            GradientStop { position: 1.0; color: "#1a1a3e" }
        }

        // Weather animation layer - changes based on simulated location
        Rectangle {
            id: weatherLayer
            anchors.fill: parent
            opacity: 0.3

            // Animated rain effect
            Repeater {
                id: rainRepeater
                model: 200
                Rectangle {
                    width: 2; height: 15
                    radius: 1
                    color: "#4488CC"
                    opacity: 0.4
                    x: Math.random() * parent.width
                    y: Math.random() * -100
                    SequentialAnimation on y {
                        loops: Animation.Infinite
                        NumberAnimation { to: parent.height + 20; duration: 1000; easing.type: Easing.Linear }
                        NumberAnimation { to: Math.random() * parent.width; duration: 0 }
                    }
                }
            }

            // Sun/moon indicator based on time
            Rectangle {
                width: 80; height: 80
                radius: 40
                anchors.top: parent.top
                anchors.right: parent.right
                anchors.margins: 50
                color: {
                    var h = Qt.formatTime(new Date(), "H").toInt()
                    h >= 6 && h < 18 ? "#FFD700" : "#444466"
                }
                opacity: 0.8
                Behavior on color { ColorAnimation { duration: 2000 } }
                layer.enabled: true
                layer.effect: GaussianBlur { radius: 8 }
            }
        }
    }

    // --- XAK AI EDGE GLOW with Voice Activation ---
    Rectangle {
        id: xakAIGlow
        anchors.fill: parent
        color: "transparent"
        border.color: "#3b82f6"
        border.width: 0
        opacity: 0

        Behavior on border.color { ColorAnimation { duration: 500 } }
        Behavior on border.width { NumberAnimation { duration: 300; easing.type: Easing.OutBack } }
        Behavior on opacity { NumberAnimation { duration: 300 } }
    }

    // Xak AI status text
    Text {
        id: xakAIStatus
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: 20
        text: ""
        font.family: "Inter"
        font.pixelSize: 18
        color: "#3b82f6"
        opacity: 0
        Behavior on opacity { NumberAnimation { duration: 300 } }
    }

    // Voice indicator ring
    Rectangle {
        id: voiceIndicator
        width: 60; height: 60
        radius: 30
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: 60
        color: "transparent"
        border.color: "#3b82f6"
        border.width: 2
        opacity: 0
        visible: false

        NumberAnimation on border.width {
            from: 2; to: 6; duration: 1000
            loops: Animation.Infinite
            easing.type: Easing.InOutQuad
        }

        NumberAnimation on opacity {
            from: 0; to: 1; duration: 500
            loops: Animation.Infinite
            easing.type: Easing.InOutQuad
        }

        Text {
            text: "🎙"
            font.pixelSize: 24
            anchors.centerIn: parent
        }
    }

    // --- CENTER CLOCK & WEATHER ---
    ColumnLayout {
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -100
        spacing: -20

        Text {
            text: Qt.formatTime(new Date(), "hh:mm")
            font.family: "Syne"
            font.pixelSize: 250
            font.weight: Font.Black
            color: "white"
            Layout.alignment: Qt.AlignHCenter
            layer.enabled: true
            layer.effect: DropShadow {
                color: "#000000"
                radius: 20
                samples: 16
                verticalOffset: 4
            }
        }

        Text {
            text: Qt.formatDate(new Date(), "dddd, MMMM d") + "  |  14°C  🌧️"
            font.family: "Inter"
            font.pixelSize: 32
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }
    }

    // --- NON-WINDOWS USER SWITCHER (Bottom Left) ---
    RowLayout {
        anchors.left: parent.left
        anchors.bottom: parent.bottom
        anchors.margins: 50
        spacing: 20

        // Main User
        Rectangle {
            width: 70; height: 70; radius: 35
            color: Qt.rgba(138/255, 43/255, 226/255, 0.8)
            border.color: "white"; border.width: 3
            Text { anchors.centerIn: parent; text: "👤"; font.pixelSize: 32 }
        }

        // Child User
        Rectangle {
            width: 50; height: 50; radius: 25
            color: Qt.rgba(255/255, 255/255, 255/255, 0.2)
            border.color: "transparent"; border.width: 2
            Text { anchors.centerIn: parent; text: "🧸"; font.pixelSize: 24 }

            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                onEntered: parent.border.color = "white"
                onExited: parent.border.color = "transparent"
            }
        }
    }

    // --- BIOMETRICS & AUTHENTICATION (Bottom Center) ---
    ColumnLayout {
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 80
        spacing: 15

        // Face Unlock Scanning Indicator
        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 10

            Text { text: "👁️"; font.pixelSize: 24 }
            Text {
                text: "Scanning Face..."
                font.family: "Inter"
                font.pixelSize: 18
                color: "white"
                opacity: 0.8
            }
        }

        // Password / PIN Field
        TextField {
            width: 350; height: 60
            Layout.preferredWidth: 350
            Layout.preferredHeight: 60
            placeholderText: "Password or PIN"
            echoMode: TextInput.Password
            horizontalAlignment: TextInput.AlignHCenter
            color: "white"
            font.pixelSize: 24
            font.family: "Inter"

            background: Rectangle {
                color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.color: parent.activeFocus ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.3)
                radius: 15
            }
        }

        // Fingerprint Indicator
        Text {
            text: "👆 Or use Fingerprint"
            font.family: "Inter"
            font.pixelSize: 16
            color: "#a0a0a0"
            Layout.alignment: Qt.AlignHCenter
        }
    }

    // --- MINI MEDIA PLAYER (Bottom Right) ---
    Rectangle {
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.margins: 50
        width: 300
        height: 100
        radius: 20
        color: Qt.rgba(0, 0, 0, 0.5)
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)

        RowLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 15

            // Album Art
            Rectangle {
                width: 70; height: 70; radius: 10
                color: "#a855f7"
                Text { anchors.centerIn: parent; text: "🎵"; font.pixelSize: 32 }
            }

            ColumnLayout {
                spacing: 5
                Text { text: "Voltra Soundtrack"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 16 }
                Text { text: "Xakteir Studios"; color: "#a0a0a0"; font.family: "Inter"; font.pixelSize: 12 }
            }
        }
    }

    // --- VOICE ACTIVATION: "Hey Xak" Detection ---
    MouseArea {
        id: voiceActivationArea
        anchors.fill: parent
        hoverEnabled: true
        property bool heyXakDetected: false
        property int voiceCounter: 0

        onPressed: {
            // Simulate voice input detection
            if (voiceActivationArea.voiceCounter >= 3) {
                // Activate Xak AI
                xakAIGlow.border.width = 20
                xakAIGlow.border.color = "#3b82f6" // Blue = listening
                xakAIGlow.opacity = 1
                xakAIStatus.text = "Listening... Say what you need"
                xakAIStatus.opacity = 1
                voiceIndicator.visible = true
                voiceIndicator.opacity = 1
                voiceActivationArea.voiceCounter = 0

                // Simulate thinking then responding
                QTimer.singleShot(2000, function() {
                    xakAIGlow.border.color = "#a855f7" // Purple = thinking
                })
                QTimer.singleShot(4000, function() {
                    xakAIGlow.border.color = "#FFD700" // Yellow = responding
                    xakAIStatus.text = "Here is what I found..."
                    QTimer.singleShot(3000, function() {
                        xakAIGlow.border.width = 0
                        xakAIGlow.opacity = 0
                        xakAIStatus.opacity = 0
                        voiceIndicator.visible = false
                    })
                })
            } else {
                voiceActivationArea.voiceCounter++
            }
        }

        // Visual feedback on hover
        onEntered: {
            voiceActivationArea.cursorShape = Qt.PointingHandCursor
        }
    }
}
