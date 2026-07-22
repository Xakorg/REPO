import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

Window {
    id: storeWindow
    width: Screen.width
    height: Screen.height
    visible: true
    visibility: Window.FullScreen
    title: "Voltra Store"
    color: "#050505"

    // Close Button
    Rectangle {
        anchors.top: parent.top; anchors.left: parent.left; anchors.margins: 30
        width: 40; height: 40; radius: 20; color: "#22FFFFFF"; z: 100
        Text { anchors.centerIn: parent; text: "✖"; color: "white"; font.pixelSize: 16 }
        MouseArea { anchors.fill: parent; onClicked: storeWindow.close() }
    }

    Flickable {
        anchors.fill: parent
        contentHeight: 1500

        ColumnLayout {
            anchors.fill: parent
            spacing: 40

            // Top Navigation
            RowLayout {
                Layout.fillWidth: true
                Layout.topMargin: 30
                Layout.leftMargin: 100
                Layout.rightMargin: 100
                
                Text { text: "VOLTRA STORE"; font.family: "Syne"; font.pixelSize: 32; font.weight: Font.Black; color: "white" }
                Item { Layout.fillWidth: true }
                Row {
                    spacing: 30
                    Text { text: "Discover"; color: "white"; font.family: "Inter"; font.pixelSize: 16; font.bold: true }
                    Text { text: "Arcade"; color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 16; font.bold: true }
                    Text { text: "Create"; color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 16; font.bold: true }
                    Text { text: "Updates"; color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 16; font.bold: true }
                }
                Item { Layout.fillWidth: true }
                TextField {
                    Layout.preferredWidth: 250; placeholderText: "Search apps..."; color: "white"
                    background: Rectangle { color: "#11FFFFFF"; radius: 15; border.color: "#33FFFFFF" }
                }
            }

            // Massive Hero Banner
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 500
                Layout.margins: 80
                radius: 20
                color: "#1a1a2e"
                
                // Gradient Overlay
                Rectangle {
                    anchors.fill: parent; radius: 20
                    gradient: Gradient {
                        GradientStop { position: 0.0; color: "transparent" }
                        GradientStop { position: 1.0; color: "#EE000000" }
                    }
                }
                
                ColumnLayout {
                    anchors.left: parent.left; anchors.bottom: parent.bottom; anchors.margins: 40
                    spacing: 15
                    Text { text: "PREMIERE PRO"; font.family: "Syne"; font.pixelSize: 64; font.weight: Font.Black; color: "white" }
                    Text { text: "The industry standard for video editing, now running natively on VoltraOS."; color: "#DDFFFFFF"; font.family: "Inter"; font.pixelSize: 18 }
                    Rectangle {
                        width: 150; height: 50; radius: 25; color: "#a855f7"
                        Text { anchors.centerIn: parent; text: "GET - $20/mo"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 14 }
                    }
                }
            }

            // Top Free Apps Grid
            Text { text: "Top Free Apps"; color: "white"; font.family: "Syne"; font.pixelSize: 24; font.bold: true; Layout.leftMargin: 80 }
            
            GridView {
                Layout.fillWidth: true
                Layout.preferredHeight: 400
                Layout.leftMargin: 80
                cellWidth: 300; cellHeight: 150
                model: [
                    { name: "Discord", dev: "Discord Inc.", icon: "💬", tag: "Social" },
                    { name: "Spotify", dev: "Spotify AB", icon: "🎵", tag: "Music" },
                    { name: "Blender 3D", dev: "Blender Foundation", icon: "🧊", tag: "Create" },
                    { name: "VS Code", dev: "Microsoft", icon: "💻", tag: "Develop" },
                    { name: "Netflix", dev: "Netflix Inc.", icon: "🍿", tag: "Entertainment" }
                ]
                delegate: Rectangle {
                    width: 280; height: 100; radius: 15; color: "#11FFFFFF"; border.color: "#22FFFFFF"
                    RowLayout {
                        anchors.fill: parent; anchors.margins: 15; spacing: 15
                        Rectangle { width: 60; height: 60; radius: 12; color: "#22FFFFFF"; Text { anchors.centerIn: parent; text: modelData.icon; font.pixelSize: 32 } }
                        ColumnLayout {
                            Text { text: modelData.name; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 16 }
                            Text { text: modelData.dev; color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 12 }
                        }
                        Item { Layout.fillWidth: true }
                        Rectangle {
                            width: 60; height: 30; radius: 15; color: "#33FFFFFF"
                            Text { anchors.centerIn: parent; text: "GET"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 12 }
                        }
                    }
                }
            }
        }
    }
}
