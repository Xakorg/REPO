import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

Window {
    id: chatWindow
    width: 1400
    height: 900
    visible: true
    title: "XakChat Native"
    color: Qt.rgba(15/255, 15/255, 20/255, 0.95) // Deep glassmorphism
    flags: Qt.Window | Qt.FramelessWindowHint

    property var chatService: VoltraDaemon.xakChat

    // Window Drag
    MouseArea {
        anchors.left: parent.left; anchors.right: parent.right; anchors.top: parent.top; height: 30
        property point startPos: Qt.point(0, 0)
        onPressed: startPos = Qt.point(mouse.x, mouse.y)
        onPositionChanged: {
            if (pressed) { chatWindow.x += mouse.x - startPos.x; chatWindow.y += mouse.y - startPos.y }
        }
    }
    
    // Window Controls
    RowLayout {
        anchors.top: parent.top; anchors.left: parent.left; anchors.margins: 15; spacing: 10; z: 100
        Rectangle { width: 14; height: 14; radius: 7; color: "#FF5F56"; MouseArea { anchors.fill: parent; onClicked: chatWindow.close() } }
        Rectangle { width: 14; height: 14; radius: 7; color: "#FFBD2E" }
        Rectangle { width: 14; height: 14; radius: 7; color: "#27C93F" }
    }

    RowLayout {
        anchors.fill: parent
        anchors.topMargin: 40 // Below controls
        spacing: 0

        // 1. Server Sidebar (Far Left)
        Rectangle {
            Layout.preferredWidth: 80
            Layout.fillHeight: true
            color: Qt.rgba(0, 0, 0, 0.4)
            border.color: "#11FFFFFF"

            ListView {
                anchors.fill: parent
                anchors.margins: 10
                spacing: 15
                model: chatService.servers
                
                delegate: Rectangle {
                    width: 60; height: 60; radius: 30
                    color: chatService.activeServer === modelData.id ? modelData.color : "#22FFFFFF"
                    border.color: chatService.activeServer === modelData.id ? "white" : "transparent"
                    border.width: 2
                    
                    Text { anchors.centerIn: parent; text: modelData.icon; font.pixelSize: 28 }
                    
                    // Selection indicator
                    Rectangle {
                        anchors.left: parent.left; anchors.leftMargin: -10; anchors.verticalCenter: parent.verticalCenter
                        width: 4; height: chatService.activeServer === modelData.id ? 40 : 0
                        radius: 2; color: "white"
                        Behavior on height { NumberAnimation { duration: 200 } }
                    }
                    
                    MouseArea { anchors.fill: parent; onClicked: chatService.setActiveServer(modelData.id) }
                }
            }
        }

        // 2. Channel List
        Rectangle {
            Layout.preferredWidth: 260
            Layout.fillHeight: true
            color: Qt.rgba(20/255, 20/255, 25/255, 0.9)
            border.color: "#11FFFFFF"

            ColumnLayout {
                anchors.fill: parent; anchors.margins: 15; spacing: 15
                
                Text { text: chatService.activeServer.toUpperCase(); color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 18 }
                Rectangle { Layout.fillWidth: true; height: 1; color: "#22FFFFFF" }
                
                ListView {
                    Layout.fillWidth: true; Layout.fillHeight: true
                    model: chatService.currentChannels
                    spacing: 5
                    
                    property string selectedChannel: "general"
                    
                    delegate: Item {
                        width: parent.width; height: modelData.category ? 30 : 40
                        
                        // Category Header
                        Text {
                            visible: modelData.category !== undefined
                            text: modelData.category ? modelData.category : ""
                            color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 11; font.bold: true; anchors.bottom: parent.bottom; anchors.bottomMargin: 5
                        }
                        
                        // Channel Row
                        Rectangle {
                            visible: modelData.category === undefined
                            anchors.fill: parent; radius: 8
                            color: parent.ListView.view.selectedChannel === modelData.id ? "#33FFFFFF" : "transparent"
                            
                            RowLayout {
                                anchors.fill: parent; anchors.leftMargin: 10; spacing: 10
                                Text { text: modelData.type === "voice" ? "🔊" : "#"; color: "#88FFFFFF"; font.pixelSize: 16 }
                                Text { text: modelData.name ? modelData.name : ""; color: parent.ListView.view.selectedChannel === modelData.id ? "white" : "#AAAAAA"; font.family: "Inter"; font.pixelSize: 14 }
                            }
                            
                            MouseArea {
                                anchors.fill: parent
                                onClicked: {
                                    if (modelData.type === "voice") {
                                        chatService.joinVoiceChannel(modelData.id)
                                    } else {
                                        parent.ListView.view.selectedChannel = modelData.id
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Main Chat View
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "transparent"

            ColumnLayout {
                anchors.fill: parent; spacing: 0
                
                // Chat Header
                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 60; color: Qt.rgba(0,0,0,0.2); border.color: "#11FFFFFF"
                    RowLayout {
                        anchors.fill: parent; anchors.margins: 20
                        Text { text: "# general"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 18 }
                        Item { Layout.fillWidth: true }
                        Text { text: "🔍 Search"; color: "#88FFFFFF"; font.family: "Inter" }
                        Text { text: "👥 Members"; color: "white"; font.family: "Inter" }
                    }
                }
                
                // Messages Area
                ListView {
                    id: messageList
                    Layout.fillWidth: true; Layout.fillHeight: true
                    anchors.margins: 20; spacing: 20
                    model: ListModel { id: messagesModel }
                    
                    delegate: RowLayout {
                        width: parent.width; spacing: 15
                        Rectangle { width: 40; height: 40; radius: 20; color: "#33FFFFFF"; Text { anchors.centerIn: parent; text: model.avatar; font.pixelSize: 20 } }
                        ColumnLayout {
                            RowLayout {
                                Text { text: model.sender; color: model.sender === "Xak AI" ? "#a855f7" : "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 14 }
                                Text { text: "Today at 4:20 PM"; color: "#66FFFFFF"; font.family: "Inter"; font.pixelSize: 11 }
                            }
                            Text { text: model.text; color: "#DDFFFFFF"; font.family: "Inter"; font.pixelSize: 14; wrapMode: Text.Wrap; Layout.maximumWidth: 600 }
                        }
                    }
                }
                
                // Message Input
                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 80; color: "transparent"
                    Rectangle {
                        anchors.fill: parent; anchors.margins: 15; radius: 10; color: "#1AFFFFFF"
                        TextInput {
                            id: msgInput
                            anchors.fill: parent; anchors.margins: 15
                            color: "white"; font.family: "Inter"; font.pixelSize: 14
                            text: "Message #general..."
                            onAccepted: {
                                chatService.sendMessage("general", msgInput.text)
                                messagesModel.append({sender: "Ridwan", text: msgInput.text, avatar: "😎"})
                                msgInput.text = ""
                            }
                        }
                    }
                }
            }
        }
        
        // 4. Right Panel (Extensions / Members)
        Rectangle {
            Layout.preferredWidth: 260
            Layout.fillHeight: true
            color: Qt.rgba(0,0,0,0.3)
            border.color: "#11FFFFFF"
            
            ColumnLayout {
                anchors.fill: parent; anchors.margins: 15; spacing: 15
                Text { text: "EXTENSIONS"; color: "#88FFFFFF"; font.family: "Inter"; font.bold: true; font.pixelSize: 12 }
                
                Repeater {
                    model: ["⚡ Poll Tool", "🖍️ Whiteboard", "📝 Notes", "🎮 Mini Games"]
                    Rectangle {
                        Layout.fillWidth: true; Layout.preferredHeight: 40; radius: 8; color: "#11FFFFFF"
                        Text { anchors.verticalCenter: parent.verticalCenter; anchors.left: parent.left; anchors.leftMargin: 10; text: modelData; color: "white"; font.family: "Inter"; font.pixelSize: 13 }
                    }
                }
                
                Item { Layout.fillHeight: true }
            }
        }
    }

    // WebRTC Voice PIP Overlay
    Rectangle {
        id: voicePip
        width: 300; height: 120; radius: 15
        color: Qt.rgba(20/255, 20/255, 30/255, 0.95)
        border.color: "#a855f7"; border.width: 2
        anchors.bottom: parent.bottom; anchors.right: parent.right; anchors.margins: 30
        visible: false
        
        property string channel: ""
        property bool isMuted: false
        property bool isDeafened: false

        Connections {
            target: chatService
            function onVoiceStateChanged(inCall, channelName, muted, deafened) {
                voicePip.visible = inCall;
                voicePip.channel = channelName;
                voicePip.isMuted = muted;
                voicePip.isDeafened = deafened;
            }
        }

        ColumnLayout {
            anchors.fill: parent; anchors.margins: 15; spacing: 10
            Text { text: "Voice Connected"; color: "#22c55e"; font.family: "Inter"; font.bold: true; font.pixelSize: 12 }
            Text { text: voicePip.channel; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 16 }
            
            RowLayout {
                Layout.fillWidth: true; spacing: 15
                Rectangle { 
                    width: 36; height: 36; radius: 18; color: voicePip.isMuted ? "#ef4444" : "#33FFFFFF"
                    Text { anchors.centerIn: parent; text: voicePip.isMuted ? "🔇" : "🎤"; font.pixelSize: 16 }
                    MouseArea { anchors.fill: parent; onClicked: chatService.toggleMute() }
                }
                Rectangle { 
                    width: 36; height: 36; radius: 18; color: voicePip.isDeafened ? "#ef4444" : "#33FFFFFF"
                    Text { anchors.centerIn: parent; text: voicePip.isDeafened ? "🔕" : "🎧"; font.pixelSize: 16 }
                    MouseArea { anchors.fill: parent; onClicked: chatService.toggleDeafen() }
                }
                Item { Layout.fillWidth: true }
                Rectangle {
                    width: 36; height: 36; radius: 18; color: "#ef4444"
                    Text { anchors.centerIn: parent; text: "✖"; color: "white"; font.pixelSize: 16; font.bold: true }
                    MouseArea { anchors.fill: parent; onClicked: chatService.leaveVoiceChannel() }
                }
            }
        }
    }
    
    // Simulate AI message reception
    Connections {
        target: chatService
        function onMessageReceived(channelId, sender, text, avatar) {
            messagesModel.append({sender: sender, text: text, avatar: avatar})
        }
    }
}
