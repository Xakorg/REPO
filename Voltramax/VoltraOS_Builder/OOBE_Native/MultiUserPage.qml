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
                text: "Multi-User Setup"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Who else will use this VoltraOS device? Each user gets their own encrypted profile."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
                horizontalAlignment: Text.AlignHCenter
            }

            // User type cards
            RowLayout {
                width: parent.width
                spacing: 20
                Layout.topMargin: 10

                // Adult User
                Rectangle {
                    width: 220
                    height: 300
                    radius: 16
                    color: "#151530"
                    border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                    border.width: 1
                    Behavior on color { ColorAnimation { duration: 250 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Text { text: "👤"; font.pixelSize: 50; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Adult"; font.pixelSize: 22; color: "white"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Full access\nFiles, apps, settings"; font.pixelSize: 14; color: "#8888aa"; Layout.alignment: Qt.AlignHCenter }

                        Rectangle {
                            width: 140; height: 42
                            radius: 10
                            color: primaryColor
                            Text {
                                text: "Add Adult"
                                color: "white"
                                font.pixelSize: 14
                                font.bold: true
                                anchors.centerIn: parent
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: { /* Add adult user */ }
                            }
                        }
                    }
                }

                // Child Account
                Rectangle {
                    width: 220
                    height: 300
                    radius: 16
                    color: "#151530"
                    border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                    border.width: 1
                    Behavior on color { ColorAnimation { duration: 250 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Text { text: "🧒"; font.pixelSize: 50; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Child"; font.pixelSize: 22; color: "white"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Parental controls\nLimited access"; font.pixelSize: 14; color: "#8888aa"; Layout.alignment: Qt.AlignHCenter }

                        Rectangle {
                            width: 140; height: 42
                            radius: 10
                            color: "#4a4a8a"
                            Text {
                                text: "Add Child"
                                color: "white"
                                font.pixelSize: 14
                                font.bold: true
                                anchors.centerIn: parent
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: { /* Add child user */ }
                            }
                        }
                    }
                }

                // Guest Account
                Rectangle {
                    width: 220
                    height: 300
                    radius: 16
                    color: "#151530"
                    border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                    border.width: 1
                    Behavior on color { ColorAnimation { duration: 250 } }

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Text { text: "👻"; font.pixelSize: 50; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Guest"; font.pixelSize: 22; color: "white"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
                        Text { text: "Temporary session\nNo data saved"; font.pixelSize: 14; color: "#8888aa"; Layout.alignment: Qt.AlignHCenter }

                        Rectangle {
                            width: 140; height: 42
                            radius: 10
                            color: "#3a3a4a"
                            Text {
                                text: "Add Guest"
                                color: "white"
                                font.pixelSize: 14
                                font.bold: true
                                anchors.centerIn: parent
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: { /* Add guest user */ }
                            }
                        }
                    }
                }
            }

            // Current users list
            Rectangle {
                width: parent.width
                height: 120
                color: "#151530"
                radius: 14
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 10

                    Text { text: "Current Users"; font.pixelSize: 18; color: "white" }

                    ListView {
                        Layout.fillHeight: true
                        Layout.fillWidth: true
                        clip: true
                        model: [
                            {"name": "VoltraAdmin", "type": "Admin", "status": "Active"},
                            {"name": "Guest", "type": "Guest", "status": "Inactive"}
                        ]
                        delegate: RowLayout {
                            width: ListView.view.width
                            height: 40
                            spacing: 12
                            Text { text: "👤 " + model.name; color: "white"; font.pixelSize: 15 }
                            Text { text: model.type; color: "#8888aa"; font.pixelSize: 13 }
                            Text { text: model.status; color: model.status === "Active" ? "#34C759" : "#FF9500"; font.pixelSize: 13 }
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
                        onClicked: { stackView.push("ThemePage.qml"); }
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
                        onClicked: { stackView.push("ThemePage.qml"); }
                    }
                }
            }
        }
    }
}
