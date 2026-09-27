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
        height: 620
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
                text: "Personalize Your VoltraMax"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Make this device uniquely yours."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Avatar + Device Name + Display Name
            RowLayout {
                width: parent.width
                spacing: 30
                Layout.topMargin: 10

                // Avatar selector
                ColumnLayout {
                    Layout.weight: 1
                    spacing: 15
                    Text { text: "👤"; font.pixelSize: 48; Layout.alignment: Qt.AlignHCenter }
                    Text { text: "Avatar"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                    Rectangle {
                        width: 100; height: 100
                        radius: 50
                        color: "#1a1a3e"
                        border.color: primaryColor
                        border.width: 2
                        anchors.horizontalCenter: parent.horizontalCenter
                        Text { text: "V"; font.pixelSize: 40; color: primaryColor; anchors.centerIn: parent }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { /* Open avatar picker */ }
                        }
                    }
                    Text { text: "Tap to change"; font.pixelSize: 12; color: "#666666"; Layout.alignment: Qt.AlignHCenter }
                }

                // Device name
                ColumnLayout {
                    Layout.weight: 1
                    spacing: 10
                    Text { text: "📱"; font.pixelSize: 28; Layout.alignment: Qt.AlignHCenter }
                    Text { text: "Device Name"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                    TextField {
                        text: OOBE.deviceName
                        onTextChanged: { OOBE.setDeviceName(text); }
                        placeholderText: "VoltraMax"
                        Layout.fillWidth: true
                        font.pixelSize: 16
                        background: Rectangle { color: "#20FFFFFF"; radius: 8 }
                    }
                }

                // Display name
                ColumnLayout {
                    Layout.weight: 1
                    spacing: 10
                    Text { text: "✨"; font.pixelSize: 28; Layout.alignment: Qt.AlignHCenter }
                    Text { text: "Display Name"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                    TextField {
                        text: OOBE.displayName
                        onTextChanged: { OOBE.setDisplayName(text); }
                        placeholderText: "User"
                        Layout.fillWidth: true
                        font.pixelSize: 16
                        background: Rectangle { color: "#20FFFFFF"; radius: 8 }
                    }
                }
            }

            // Wallpaper selector
            Rectangle {
                width: parent.width
                height: 180
                color: "#151530"
                radius: 16
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    Text { text: "Wallpaper"; font.pixelSize: 20; color: "white" }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12

                        Repeater {
                            model: ["🌌", "🌊", "🌋", "🌿", "🌃", "⚡"]
                            delegate: Rectangle {
                                width: 100
                                height: 100
                                radius: 12
                                color: "#0a0a1a"
                                border.color: wallpaperSelected === index ? primaryColor : Qt.rgba(255/255, 255/255, 255/255, 0.1)
                                border.width: 2
                                Text { text: modelData; font.pixelSize: 36; anchors.centerIn: parent }
                                MouseArea {
                                    anchors.fill: parent
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: { wallpaperSelected = index; }
                                }
                            }
                        }
                    }
                }
            }

            // Sound & Vibration settings
            Rectangle {
                width: parent.width
                height: 140
                color: "#151530"
                radius: 16
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    Text { text: "Sound & Vibration"; font.pixelSize: 20; color: "white" }

                    RowLayout {
                        width: parent.width
                        spacing: 20

                        RowLayout {
                            Layout.weight: 1
                            Text { text: "🔊"; font.pixelSize: 24 }
                            Text { text: "Sound Effects"; color: "#c0c0c0"; font.pixelSize: 15 }
                            Switch { checked: true }
                        }

                        RowLayout {
                            Layout.weight: 1
                            Text { text: "📳"; font.pixelSize: 24 }
                            Text { text: "Haptic Feedback"; color: "#c0c0c0"; font.pixelSize: 15 }
                            Switch { checked: true }
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
                        onClicked: { stackView.push("SecurityPage.qml"); }
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
                        onClicked: { stackView.push("SecurityPage.qml"); }
                    }
                }
            }
        }
    }

    property int wallpaperSelected: 0
}
