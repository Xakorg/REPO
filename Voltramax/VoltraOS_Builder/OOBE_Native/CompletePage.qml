import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: root
    width: 1920
    height: 1080

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0a0a1a" }
            GradientStop { position: 1.0; color: "#1a1a3e" }
        }
    }

    // Checkmark animation
    Rectangle {
        id: successGlow
        width: 300
        height: 300
        radius: 150
        color: "#2034C759"
        anchors.centerIn: parent
        opacity: 0

        NumberAnimation on opacity {
            from: 0; to: 1; duration: 1000
            running: true
        }

        Behavior on opacity { NumberAnimation { duration: 500 } }
    }

    Rectangle {
        id: glassPanel
        width: 650
        height: 480
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 30
            width: parent.width * 0.78

            // Success icon
            Rectangle {
                width: 80; height: 80
                radius: 40
                color: "#34C759"
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    text: "✓"
                    font.pixelSize: 48
                    color: "white"
                    anchors.centerIn: parent
                }

                NumberAnimation on scale {
                    from: 0; to: 1; duration: 600
                    easing.type: Easing.OutBack
                    running: true
                }
            }

            Text {
                text: "You're All Set!"
                font.pixelSize: 42
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "VoltraOS has been configured.\nWelcome to the future of computing."
                font.pixelSize: 18
                color: "#a0a0c0"
                anchors.horizontalCenter: parent.horizontalCenter
                horizontalAlignment: Text.AlignHCenter
                lineHeight: 1.4
            }

            // Setup summary
            Rectangle {
                width: parent.width
                color: "#151530"
                radius: 14
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 20
                    spacing: 10

                    Text { text: "Setup Summary"; font.pixelSize: 18; color: "white" }

                    Repeater {
                        model: [
                            "✓ Network: " + (OOBE.currentNetwork || "Not configured"),
                            "✓ Account: " + (OOBE.isXakteirSignedIn ? "Xakteir Signed In" : "Local Account"),
                            "✓ Security: " + (OOBE.fingerprintEnrolled > 0 ? "Fingerprint + PIN" : "PIN Only"),
                            "✓ Device: " + OOBE.deviceName,
                            "✓ Xak AI: " + (OOBE.enableXakAI ? "Enabled" : "Disabled"),
                            "✓ Telemetry: " + (OOBE.enableTelemetry ? "Enabled" : "Disabled")
                        ]
                        delegate: Text {
                            text: modelData
                            font.pixelSize: 14
                            color: "#a0a0c0"
                        }
                    }
                }
            }

            // Enter button
            Rectangle {
                width: parent.width
                height: 56
                radius: 14
                color: "#34C759"
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    text: "Enter VoltraOS →"
                    color: "white"
                    font.pixelSize: 20
                    font.bold: true
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        OOBE.finalizeOOBE(OOBE.enableXakAI, OOBE.enableTelemetry);
                    }
                }
            }

            // Boot progress
            Rectangle {
                width: parent.width
                height: 4
                radius: 2
                color: "#333333"

                Rectangle {
                    width: parent.width * (OOBE.oobeProgress / 100.0)
                    height: parent.height
                    radius: 2
                    color: "#34C759"
                    Behavior on width { NumberAnimation { duration: 500 } }
                }
            }
        }
    }

    // Xak AI status indicator - Diamond/Orb shape
    Rectangle {
        visible: OOBE.enableXakAI
        width: 60
        height: 60
        radius: 12
        color: "#34C759"
        border.color: "#FFD700"
        border.width: 3
        anchors {
            bottom: parent.bottom
            horizontalCenter: parent.horizontalCenter
            bottomMargin: 25
        }
        layer.enabled: true
        layer.effect: DropShadow {
            color: "#FFD700"
            radius: 15
            samples: 16
            spread: 0.3
        }

        // Diamond shape with rotation
        Rectangle {
            width: 36; height: 36
            radius: 4
            color: "#FFD700"
            anchors.centerIn: parent
            transform: Rotation { origin.x: 18; origin.y: 18; angle: 45 }
            
            Text {
                text: "No.1"
                font.pixelSize: 10
                font.bold: true
                color: "#0a0a1a"
                anchors.centerIn: parent
            }
        }

        // Pulse animation
        NumberAnimation on opacity {
            from: 0.7; to: 1.0; duration: 2000
            loops: Animation.Infinite
            easing.type: Easing.InOutQuad
        }
    }
}
