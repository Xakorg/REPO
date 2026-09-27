import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Item {
    id: driveRoot
    anchors.fill: parent

    // Deep immersive background
    Rectangle {
        id: bg
        anchors.fill: parent
        color: "#08080A" // Near black
    }

    // Top Cloud Connection Banner
    Rectangle {
        id: headerBanner
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 80
        color: DriveEngine.isCloudConnected ? "#11FFFFFF" : "#55FF0000"
        border.color: DriveEngine.isCloudConnected ? "#33FFFFFF" : "#FF0000"
        border.width: 1

        Behavior on color { ColorAnimation { duration: 400 } }

        RowLayout {
            anchors.fill: parent
            anchors.margins: 20
            spacing: 20

            Text { 
                text: "☁️ Xakteir Drive"
                color: "white"
                font.pixelSize: 28 
                font.family: "Syne"
                font.bold: true
            }

            Item { Layout.fillWidth: true } // Spacer

            ColumnLayout {
                spacing: 2
                Text { 
                    text: DriveEngine.isCloudConnected ? "WebSocket: wss://xakteir.com/sync" : "WebSocket: Disconnected (Offline)"
                    color: DriveEngine.isCloudConnected ? "#00FFCC" : "white"
                    font.pixelSize: 12
                    font.family: "Courier New"
                    Layout.alignment: Qt.AlignRight
                }
                Text { 
                    text: DriveEngine.syncStatusText
                    color: "white"
                    font.pixelSize: 16
                    font.bold: true
                    Layout.alignment: Qt.AlignRight
                }
            }
            
            // Manual Sync Button
            Rectangle {
                width: 40; height: 40; radius: 8; color: "#33FFFFFF"
                Text { anchors.centerIn: parent; text: "🔄"; font.pixelSize: 20 }
                MouseArea {
                    anchors.fill: parent
                    onClicked: DriveEngine.triggerManualSync()
                }
            }
        }
    }

    // Main File View
    ColumnLayout {
        anchors.top: headerBanner.bottom
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: 20
        spacing: 15

        // File List Header
        RowLayout {
            Layout.fillWidth: true
            height: 30
            Text { text: "FILE NAME"; color: "#888"; font.pixelSize: 14; Layout.fillWidth: true }
            Text { text: "SIZE"; color: "#888"; font.pixelSize: 14; Layout.preferredWidth: 100 }
            Text { text: "MODIFIED"; color: "#888"; font.pixelSize: 14; Layout.preferredWidth: 150 }
            Text { text: "SYNC STATUS"; color: "#888"; font.pixelSize: 14; Layout.preferredWidth: 150; horizontalAlignment: Text.AlignRight }
        }

        Rectangle { Layout.fillWidth: true; height: 1; color: "#33FFFFFF" }

        // The massive file list
        ListView {
            id: fileList
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            spacing: 5
            
            model: ListModel { id: fModel }

            Connections {
                target: DriveEngine
                function onFileListUpdated() {
                    var data = DriveEngine.getCloudFiles();
                    fModel.clear();
                    for (var i = 0; i < data.length; ++i) {
                        fModel.append(data[i]);
                    }
                }
            }

            Component.onCompleted: {
                var data = DriveEngine.getCloudFiles();
                for (var i = 0; i < data.length; ++i) {
                    fModel.append(data[i]);
                }
            }

            delegate: Rectangle {
                width: fileList.width
                height: 60
                color: "#0AFFFFFF"
                radius: 6
                border.color: "#22FFFFFF"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 15
                    anchors.rightMargin: 15
                    spacing: 15

                    Text { text: "📄"; font.pixelSize: 24 }
                    
                    Text { 
                        text: model.name
                        color: "white"
                        font.pixelSize: 18
                        font.family: "Syne"
                        Layout.fillWidth: true
                    }

                    Text { text: model.size; color: "#AAAAAA"; font.pixelSize: 14; Layout.preferredWidth: 100 }
                    Text { text: model.lastModified; color: "#AAAAAA"; font.pixelSize: 14; Layout.preferredWidth: 150 }
                    
                    // Sync Status Indicator
                    RowLayout {
                        Layout.preferredWidth: 150
                        Layout.alignment: Qt.AlignRight
                        spacing: 10

                        Text { 
                            text: {
                                if (model.syncState === "Synced") return "✔️ Synced";
                                if (model.syncState === "Syncing") return "🔄 Syncing...";
                                return "☁️ Offline Pending";
                            }
                            color: {
                                if (model.syncState === "Synced") return "#00FFCC";
                                if (model.syncState === "Syncing") return "#4285F4";
                                return "#FFBD2E";
                            }
                            font.pixelSize: 14
                            font.bold: true
                            Layout.fillWidth: true
                            horizontalAlignment: Text.AlignRight
                        }
                    }

                    // Simulate Modifying the File (Triggers Delta Sync)
                    Rectangle {
                        width: 80; height: 30; radius: 4; color: "#33FFFFFF"
                        Text { anchors.centerIn: parent; text: "EDIT"; color: "white"; font.bold: true }
                        MouseArea {
                            anchors.fill: parent
                            onClicked: DriveEngine.modifyFileLocally(model.name)
                        }
                    }
                }
            }
        }
    }
}
