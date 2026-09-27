import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: root
    width: 1920
    height: 1080

    Rectangle {
        width: 820
        height: 640
        anchors.centerIn: parent
        color: glassColor
        radius: 24
        border.color: glassBorder
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 25
            width: parent.width * 0.78

            Text {
                text: "Secure Your Device"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: textColor
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Choose your biometric authentication method"
                font.pixelSize: 16
                color: "#666666"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Auth method tabs
            RowLayout {
                width: parent.width
                spacing: 8

                Repeater {
                    model: ["Face ID", "Fingerprint", "Draw Pattern", "Skip"]
                    delegate: Rectangle {
                        width: parent.Layout.fillWidth ? (root.width * 0.78 * 0.24) : 100
                        height: 44
                        radius: 10
                        color: index === activeTab ? primaryColor : "#40FFFFFF"
                        border.color: index === activeTab ? primaryColor : "#CCCCCC"
                        border.width: 1

                        Text {
                            anchors.centerIn: parent
                            text: modelData
                            color: index === activeTab ? "white" : textColor
                            font.pixelSize: 13
                            font.bold: index === activeTab
                        }

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                activeTab = index;
                                OOBE.setAuthMethod(index === 3 ? 0 : index);
                            }
                        }
                    }
                }
            }

            property int activeTab: 0

            // Face ID Scanner
            Item {
                id: faceScanArea
                width: 240
                height: 240
                anchors.horizontalCenter: parent.horizontalCenter
                visible: OOBE.authMethod === 3

                Rectangle {
                    anchors.fill: parent
                    radius: 120
                    color: "transparent"
                    border.color: OOBE.biometricProgress > 0 ? primaryColor : "#E0E0E0"
                    border.width: 4
                    Behavior on border.color { ColorAnimation { duration: 500 } }

                    // Scanning ring animation
                    Rectangle {
                        anchors.centerIn: parent
                        width: 240 * (OOBE.biometricProgress / 100.0)
                        height: 240 * (OOBE.biometricProgress / 100.0)
                        radius: width / 2
                        color: primaryColor
                        opacity: 0.2
                        Behavior on width { NumberAnimation { duration: 200 } }
                        Behavior on height { NumberAnimation { duration: 200 } }
                    }

                    Text {
                        text: OOBE.biometricProgress > 0 && OOBE.biometricProgress < 100 ? (OOBE.biometricProgress + "%") : ""
                        font.pixelSize: 24
                        color: textColor
                        anchors.centerIn: parent
                    }
                }

                Text {
                    text: OOBE.biometricProgress >= 100 ? "✓ Face Detected" : "Position your face in the frame"
                    font.pixelSize: 16
                    color: OOBE.biometricProgress >= 100 ? "#34C759" : "#666666"
                    anchors.horizontalCenter: parent.horizontalCenter
                }
            }

            // Fingerprint Scanner
            Item {
                id: fingerprintArea
                width: 240
                height: 240
                anchors.horizontalCenter: parent.horizontalCenter
                visible: OOBE.authMethod === 2

                Rectangle {
                    anchors.fill: parent
                    radius: 120
                    color: "#1a1a2e"
                    border.color: OOBE.fingerprintEnrolled > 0 ? "#34C759" : "#E0E0E0"
                    border.width: 4

                    // Fingerprint icon
                    Text {
                        text: OOBE.fingerprintEnrolled > 0 ? "✅" : "👆"
                        font.pixelSize: 64
                        anchors.centerIn: parent
                    }

                    Rectangle {
                        anchors.bottom: parent.bottom
                        anchors.horizontalCenter: parent.horizontalCenter
                        width: 200
                        height: 4
                        radius: 2
                        color: OOBE.biometricProgress > 0 ? primaryColor : "#333333"
                        visible: OOBE.biometricProgress > 0 && OOBE.biometricProgress < 100
                        Behavior on width { NumberAnimation { duration: 200 } }
                    }
                }

                Text {
                    text: OOBE.fingerprintEnrolled > 0 ? "Fingerprint enrolled — tap to verify" : "Place finger on scanner"
                    font.pixelSize: 16
                    color: "#666666"
                    anchors.horizontalCenter: parent.horizontalCenter
                }
            }

            // Draw Pattern Area
            Item {
                id: drawingArea
                width: 260
                height: 260
                anchors.horizontalCenter: parent.horizontalCenter
                visible: OOBE.authMethod === 4

                Rectangle {
                    anchors.fill: parent
                    radius: 16
                    color: "#0a0a1a"
                    border.color: primaryColor
                    border.width: 2

                    // Drawing canvas
                    MouseArea {
                        id: drawCanvas
                        anchors.fill: parent
                        property point lastPos

                        onPressed: {
                            drawingArea.lastPos = Qt.point(mouse.x, mouse.y);
                        }
                        onPositionChanged: {
                            // Draw line segments
                            var canvas = drawingArea;
                            canvas.lastPos = Qt.point(mouse.x, mouse.y);
                        }
                        onReleased: {
                            // Pattern complete
                            var pattern = JSON.stringify({x: mouse.x, y: mouse.y});
                            OOBE.verifyDrawingPattern(pattern);
                        }
                    }

                    Text {
                        text: OOBE.biometricProgress > 0 && OOBE.biometricProgress < 100 ? "Drawing..." : "Draw a pattern on the grid"
                        font.pixelSize: 16
                        color: "#666666"
                        anchors.centerIn: parent
                    }

                    // 3x3 grid overlay
                    Grid {
                        columns: 3
                        anchors.centerIn: parent
                        rowSpacing: 20
                        columnSpacing: 20
                        Repeater {
                            model: 9
                            delegate: Rectangle {
                                width: 50; height: 50
                                radius: 8
                                color: "#20FFFFFF"
                                border.color: "#333333"
                                border.width: 1
                            }
                        }
                    }
                }

                Text {
                    text: OOBE.drawingProgress >= 100 ? "✓ Pattern Verified" : "Draw your unlock pattern"
                    font.pixelSize: 16
                    color: OOBE.drawingProgress >= 100 ? "#34C759" : "#666666"
                    anchors.horizontalCenter: parent.horizontalCenter
                }
            }

            // Status text
            Text {
                text: OOBE.biometricStatus
                font.pixelSize: 16
                color: primaryColor
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Action buttons row
            RowLayout {
                width: parent.width
                spacing: 12

                // Start/Scan button
                Rectangle {
                    Layout.fillWidth: true
                    Layout.weight: 1
                    height: 50
                    radius: 12
                    color: primaryColor

                    Text {
                        text: OOBE.biometricProgress >= 100 ? "Continue →" : (OOBE.authMethod === 2 ? "Enroll Fingerprint" : "Start Scan")
                        color: "white"
                        font.pixelSize: 16
                        font.bold: true
                        anchors.centerIn: parent
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (OOBE.authMethod === 2) {
                                OOBE.enrollFingerprint();
                            } else if (OOBE.authMethod === 3) {
                                OOBE.startBiometricScan();
                            } else if (OOBE.authMethod === 4) {
                                OOBE.verifyDrawingPattern("pattern");
                            } else {
                                OOBE.startBiometricScan();
                            }
                        }
                    }
                }

                // Skip button
                Rectangle {
                    height: 50
                    radius: 12
                    color: "#40FFFFFF"
                    border.color: "#CCCCCC"
                    border.width: 1
                    width: 120

                    Text {
                        text: "Skip"
                        color: "#666666"
                        font.pixelSize: 16
                        anchors.centerIn: parent
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            OOBE.skipBiometric();
                            stackView.push("CompletePage.qml");
                        }
                    }
                }
            }

            // Progress bar at bottom
            Rectangle {
                width: parent.width
                height: 4
                radius: 2
                color: "#E0E0E0"
                anchors.bottom: parent.bottom
                anchors.bottomMargin: 10

                Rectangle {
                    width: parent.width * (OOBE.biometricProgress / 100.0)
                    height: parent.height
                    radius: 2
                    color: primaryColor
                    Behavior on width { NumberAnimation { duration: 300 } }
                }
            }
        }
    }

    // Xak AI indicator
    Rectangle {
        visible: OOBE.enableXakAI && OOBE.biometricProgress > 0
        color: "transparent"
        border.color: "#3b82f6"
        border.width: 2
        radius: 12
        anchors {
            top: parent.top
            horizontalCenter: parent.horizontalCenter
            topMargin: 10
        }

        Text {
            text: "Xak AI: Active Security Monitor"
            font.pixelSize: 12
            color: "#3b82f6"
            anchors.centerIn: parent
        }
    }
}
