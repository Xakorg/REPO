import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: root
    width: 1920
    height: 1080

    // Animated background
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0a0a1a" }
            GradientStop { position: 0.5; color: "#1a1a3e" }
            GradientStop { position: 1.0; color: "#0a0a1a" }
        }

        // Animated glow orbs
        Rectangle {
            width: 600; height: 600
            radius: 300
            x: -100; y: -100
            color: "#2000AAFF"
            opacity: 0.4
            SequentialAnimation on x {
                loops: Animation.Infinite
                NumberAnimation { to: 400; duration: 8000; easing.type: Easing.InOutQuad }
                NumberAnimation { to: -100; duration: 8000; easing.type: Easing.InOutQuad }
            }
        }
        Rectangle {
            width: 800; height: 800
            radius: 400
            x: root.width - 400; y: root.height - 400
            color: "#2000FFCC"
            opacity: 0.3
            SequentialAnimation on y {
                loops: Animation.Infinite
                NumberAnimation { to: root.height - 600; duration: 10000; easing.type: Easing.InOutSine }
                NumberAnimation { to: root.height - 400; duration: 10000; easing.type: Easing.InOutSine }
            }
        }
    }

    // Center glass panel
    Rectangle {
        id: glassPanel
        width: 650
        height: 480
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        // Glass blur effect
        layer.enabled: true
        layer.effect: GaussianBlur {
            radius: 8
            samples: 16
            source: null
        }

        Column {
            anchors.centerIn: parent
            spacing: 35
            width: parent.width * 0.75

            // VoltraOS logo
            Rectangle {
                width: 100; height: 100
                radius: 20
                color: "#1a1a3e"
                border.color: primaryColor
                border.width: 2
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    text: "V"
                    font.pixelSize: 56
                    font.bold: true
                    color: primaryColor
                    anchors.centerIn: parent
                }
            }

            Text {
                text: "Welcome to VoltraOS"
                font.pixelSize: 42
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
                layer.enabled: true
                layer.effect: DropShadow {
                    color: "#0066FF"
                    radius: 12
                    samples: 16
                    verticalOffset: 4
                }
            }

            Text {
                text: "The absolute pinnacle of enterprise engineering.\nA new era of computing starts now."
                font.pixelSize: 18
                color: "#a0a0c0"
                anchors.horizontalCenter: parent.horizontalCenter
                horizontalAlignment: Text.AlignHCenter
                lineHeight: 1.4
            }

            // Feature highlights
            Column {
                spacing: 15
                anchors.horizontalCenter: parent.horizontalCenter

                Repeater {
                    model: ["⚡ Kernel-Level Optimization", "🔮 Xak AI Integration", "🛡️ Military-Grade Security", "🎨 VoltaMax Desktop"]
                    delegate: RowLayout {
                        spacing: 12
                        Text {
                            text: modelData
                            font.pixelSize: 16
                            color: "#c0c0e0"
                            Layout.alignment: Qt.AlignVCenter
                        }
                        Rectangle {
                            width: 60; height: 2
                            radius: 1
                            color: primaryColor
                            Layout.alignment: Qt.AlignVCenter
                        }
                    }
                }
            }

            // Start button
            Rectangle {
                id: startBtn
                width: parent.width
                height: 56
                radius: 14
                color: primaryColor
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    text: "Get Started →"
                    color: "white"
                    font.pixelSize: 20
                    font.bold: true
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        stackView.push("NetworkPage.qml");
                    }
                }
            }

            // Bottom text
            Text {
                text: "VoltraOS v1.0.0 | Build 2026"
                font.pixelSize: 13
                color: "#555570"
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }
}
