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

    Rectangle {
        id: glassPanel
        width: 720
        height: 580
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 28
            width: parent.width * 0.82

            Text {
                text: "Choose Your Look"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Personalize the VoltraOS experience with themes and aesthetics."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Theme cards row
            RowLayout {
                width: parent.width
                spacing: 20
                Layout.topMargin: 10

                // Dark Mode
                Rectangle {
                    width: 220
                    height: 260
                    radius: 16
                    color: "#0a0a0a"
                    border.color: themeSelected === 0 ? "#ffffff" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                    border.width: 2
                    Behavior on border.color { ColorAnimation { duration: 300 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Rectangle {
                            width: 60; height: 60
                            radius: 12
                            color: "#1a1a2e"
                            Text { text: "🌙"; font.pixelSize: 30; anchors.centerIn: parent }
                        }
                        Text { text: "Dark Mode"; font.pixelSize: 18; color: "white"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Classic dark theme\nEasy on the eyes"; font.pixelSize: 13; color: "#8888aa"; Layout.alignment: Qt.AlignHCenter }

                        Rectangle {
                            width: 120; height: 36
                            radius: 8
                            color: themeSelected === 0 ? primaryColor : "#40FFFFFF"
                            Text {
                                text: themeSelected === 0 ? "✓ Selected" : "Select"
                                color: themeSelected === 0 ? "white" : "#666666"
                                font.pixelSize: 14
                                anchors.centerIn: parent
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: { themeSelected = 0; OOBE.setAuthMethod(0); }
                            }
                        }
                    }
                }

                // Light Mode
                Rectangle {
                    width: 220
                    height: 260
                    radius: 16
                    color: "#f5f5f5"
                    border.color: themeSelected === 1 ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                    border.width: 2
                    Behavior on border.color { ColorAnimation { duration: 300 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Rectangle {
                            width: 60; height: 60
                            radius: 12
                            color: "#ffffff"
                            Text { text: "☀️"; font.pixelSize: 30; anchors.centerIn: parent }
                        }
                        Text { text: "Light Mode"; font.pixelSize: 18; color: "#1a1a1a"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Bright clean look\nFor daytime use"; font.pixelSize: 13; color: "#8888aa"; Layout.alignment: Qt.AlignHCenter }

                        Rectangle {
                            width: 120; height: 36
                            radius: 8
                            color: themeSelected === 1 ? "#a855f7" : "#40FFFFFF"
                            Text {
                                text: themeSelected === 1 ? "✓ Selected" : "Select"
                                color: themeSelected === 1 ? "white" : "#666666"
                                font.pixelSize: 14
                                anchors.centerIn: parent
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: { themeSelected = 1; }
                            }
                        }
                    }
                }

                // Voltra Mode (Custom)
                Rectangle {
                    width: 220
                    height: 260
                    radius: 16
                    color: "#0a1a2e"
                    border.color: themeSelected === 2 ? primaryColor : Qt.rgba(255/255, 255/255, 255/255, 0.2)
                    border.width: 2
                    Behavior on border.color { ColorAnimation { duration: 300 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Rectangle {
                            width: 60; height: 60
                            radius: 12
                            color: "#0044aa"
                            Text { text: "⚡"; font.pixelSize: 30; anchors.centerIn: parent }
                        }
                        Text { text: "Voltra Mode"; font.pixelSize: 18; color: "white"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Premium blue glow\nThe default Voltra look"; font.pixelSize: 13; color: "#8888aa"; Layout.alignment: Qt.AlignHCenter }

                        Rectangle {
                            width: 120; height: 36
                            radius: 8
                            color: themeSelected === 2 ? primaryColor : "#40FFFFFF"
                            Text {
                                text: themeSelected === 2 ? "✓ Selected" : "Select"
                                color: themeSelected === 2 ? "white" : "#666666"
                                font.pixelSize: 14
                                anchors.centerIn: parent
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: { themeSelected = 2; }
                            }
                        }
                    }
                }
            }

            // Accent color picker
            Rectangle {
                width: parent.width
                height: 100
                color: "#151530"
                radius: 14
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 10

                    RowLayout {
                        spacing: 15
                        Text { text: "Accent Color:"; color: "white"; font.pixelSize: 16; Layout.alignment: Qt.AlignVCenter }

                        Repeater {
                            model: ["#3b82f6", "#a855f7", "#34C759", "#FF3B30", "#FF9500", "#06B6D4"]
                            delegate: Rectangle {
                                width: 36; height: 36
                                radius: 18
                                color: modelData
                                border.color: accentColor === modelData ? "white" : "transparent"
                                border.width: 2
                                MouseArea {
                                    anchors.fill: parent
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: { accentColor = modelData; }
                                }
                            }
                        }
                    }
                }
            }

            // Buttons
            RowLayout {
                width: parent.width
                spacing: 16

                Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: 14
                    color: primaryColor
                    Text {
                        text: "Continue →"
                        color: "white"
                        font.pixelSize: 18
                        font.bold: true
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { stackView.push("CustomizationPage.qml"); }
                    }
                }

                Rectangle {
                    width: 120
                    height: 52
                    radius: 14
                    color: "#40FFFFFF"
                    border.color: "#CCCCCC"
                    border.width: 1
                    Text {
                        text: "Skip"
                        color: "#666666"
                        font.pixelSize: 16
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { stackView.push("CustomizationPage.qml"); }
                    }
                }
            }
        }
    }

    property int themeSelected: 2
    property string accentColor: "#3b82f6"
}
