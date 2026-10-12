import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * SHORTCUT SHEET
 *
 * A minimal cheat sheet that exposes the global shortcuts without getting in
 * the way. The engine wires `Ctrl+/` to toggle it, and Escape closes it.
 */
Rectangle {
    id: shortcutSheet
    color: "#f7090b11"

    signal closeRequested()

    Rectangle {
        anchors.fill: parent
        color: "#cc000000"
        MouseArea {
            anchors.fill: parent
            onClicked: shortcutSheet.closeRequested()
        }
    }

    Rectangle {
        anchors.centerIn: parent
        width: Math.min(parent.width - 80, 480)
        height: Math.min(parent.height - 80, 520)
        radius: 16
        color: "#0d1018"
        border.color: "#202636"

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 24
            spacing: 16

            RowLayout {
                Layout.fillWidth: true
                Text {
                    Layout.fillWidth: true
                    text: "Keyboard shortcuts"
                    color: "white"
                    font.pixelSize: 17
                    font.bold: true
                }
                Button {
                    text: "\u2715"
                    flat: true
                    onClicked: shortcutSheet.closeRequested()
                    background: Rectangle {
                        radius: 6
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#a9aec1"
                        font.pixelSize: 13
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 1
                color: "#181c28"
            }

            ListModel {
                id: shortcuts
                ListElement { keys: "Ctrl+N"; action: "Compose new message" }
                ListElement { keys: "Ctrl+Shift+F"; action: "Search everywhere" }
                ListElement { keys: "Ctrl+/"; action: "Toggle this sheet" }
                ListElement { keys: "Ctrl+,"; action: "Open Settings" }
                ListElement { keys: "Ctrl+R"; action: "Sync now" }
                ListElement { keys: "Ctrl+Shift+A"; action: "Mark all as read" }
                ListElement { keys: "J/K"; action: "Move selection down/up" }
                ListElement { keys: "Return"; action: "Open selected thread" }
                ListElement { keys: "E"; action: "Archive selected" }
                ListElement { keys: "#"; action: "Trash selected" }
                ListElement { keys: "S"; action: "Star/unstar selected" }
                ListElement { keys: "Escape"; action: "Close panes/overlays" }
            }

            ListView {
                Layout.fillWidth: true
                Layout.fillHeight: true
                clip: true
                model: shortcuts
                spacing: 10
                boundsBehavior: Flickable.StopAtBounds
                ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

                delegate: RowLayout {
                    width: parent.width
                    spacing: 12
                    Text {
                        Layout.preferredWidth: 120
                        text: model.keys
                        color: "#0066ff"
                        font.pixelSize: 12
                        font.bold: true
                    }
                    Text {
                        Layout.fillWidth: true
                        text: model.action
                        color: "#c3c8d8"
                        font.pixelSize: 13
                    }
                }
            }

            Text {
                Layout.fillWidth: true
                text: "These are the global shortcuts in the main window."
                color: "#5b6178"
                font.pixelSize: 11
            }
        }
    }
}
