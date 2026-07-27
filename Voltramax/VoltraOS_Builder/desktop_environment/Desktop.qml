import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Window {
    id: desktop
    width: 1920
    height: 1080
    visible: true
    visibility: Window.FullScreen
    
    // Transparent background to expose the Vulkan Weather Wallpaper
    color: "transparent"

    // State management for Sidebars
    property bool isAppLauncherOpen: false
    property bool isXakAIOpen: false

    // Simulate global key presses (Windows Key / Xak Key)
    focus: true
    Keys.onPressed: (event) => {
        if (event.key === Qt.Key_Super || event.key === Qt.Key_Meta) {
            isAppLauncherOpen = !isAppLauncherOpen;
            if (isAppLauncherOpen) isXakAIOpen = false;
        }
    }

    // =========================================================================
    // APP LAUNCHER SIDEBAR (Left Side)
    // =========================================================================
    Rectangle {
        id: appLauncherSidebar
        width: 450
        height: parent.height
        x: isAppLauncherOpen ? 0 : -width
        color: Qt.rgba(10/255, 10/255, 15/255, 0.85) // Dark frosted glass
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
        border.width: 1
        
        Behavior on x { NumberAnimation { duration: 350; easing.type: Easing.OutQuart } }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 30
            spacing: 20

            // Search Bar
            TextField {
                Layout.fillWidth: true
                placeholderText: "Search apps, files, or web..."
                font.family: "Inter"
                font.pixelSize: 18
                color: "white"
                background: Rectangle {
                    color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                    radius: 12
                    border.color: parent.activeFocus ? "#a855f7" : "transparent"
                }
                padding: 15
            }

            Text {
                text: "Pinned Apps"
                font.family: "Inter"
                font.pixelSize: 14
                font.weight: Font.Bold
                color: "#a0a0a0"
                Layout.topMargin: 20
            }

            // Grid of Pinned Apps
            GridLayout {
                columns: 4
                rowSpacing: 20
                columnSpacing: 20
                Layout.fillWidth: true

                Repeater {
                    model: ListModel {
                        id: appsModel
                        ListElement { name: "Xakteir Drive"; icon: "☁️"; iconColor: "#4285F4"; sourceFile: "XakteirDrive.qml" }
                        ListElement { name: "Install VoltraOS"; icon: "💿"; iconColor: "#FF0000"; sourceFile: "VoltraInstaller.qml" }
                        ListElement { name: "System Settings"; icon: "⚙️"; iconColor: "#888888"; sourceFile: "SystemSettings.qml" }
                        ListElement { name: "VoltMaster"; icon: "⚡"; iconColor: "#00FFCC"; sourceFile: "VoltMaster.qml" }
                        ListElement { name: "VoltraBrowser"; icon: "🌐"; iconColor: "#4285F4"; sourceFile: "VoltraBrowser.qml" }
                        ListElement { name: "VoltTerm"; icon: "💻"; iconColor: "#0F0"; sourceFile: "VoltTerm.qml" }
                        ListElement { name: "Xakteir Stream"; icon: "📡"; iconColor: "#FF5F56"; sourceFile: "XakteirStream.qml" }
                        ListElement { name: "OOBE Setup"; icon: "⚙️"; iconColor: "#9C27B0"; sourceFile: "../OOBE_Native/OOBE.qml" }
                        ListElement { name: "Files"; icon: "📁"; colorHex: "#eab308" }
                        ListElement { name: "Store"; icon: "🛍️"; colorHex: "#ec4899" }
                        ListElement { name: "XakChat"; icon: "💬"; colorHex: "#10b981" }
                        ListElement { name: "Xak AI"; icon: "✨"; colorHex: "#f59e0b" }
                        ListElement { name: "Studio"; icon: "🎬"; colorHex: "#ef4444" }
                        ListElement { name: "Weather"; icon: "⛅"; colorHex: "#06b6d4" }
                        ListElement { name: "Camera"; icon: "📷"; colorHex: "#8b5cf6" }
                    }
                    
                    Rectangle {
                        width: 70; height: 70; radius: 20
                        color: Qt.rgba(255/255, 255/255, 255/255, 0.05)
                        border.color: appMouse.containsMouse ? modelData.color : "transparent"
                        
                        Behavior on color { ColorAnimation { duration: 150 } }

                        Text { anchors.centerIn: parent; text: modelData.icon; font.pixelSize: 32 }
                        
                        MouseArea {
                            id: appMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                if (modelData.name === "Browser") {
                                    var component = Qt.createComponent("VoltraBrowser.qml")
                                    if (component.status === Component.Ready) {
                                        var browserWindow = component.createObject(desktop)
                                        browserWindow.show()
                                        isAppLauncherOpen = false // Auto-close launcher
                                    } else {
                                        console.log("Failed to load VoltraBrowser: " + component.errorString())
                                    }
                                } else if (modelData.name === "Terminal") {
                                    var compTerm = Qt.createComponent("Terminal.qml")
                                    if (compTerm.status === Component.Ready) {
                                        compTerm.createObject(desktop).show()
                                        isAppLauncherOpen = false
                                    } else {
                                        console.log("Failed to load Terminal: " + compTerm.errorString())
                                    }
                                } else if (modelData.name === "Game Hub") {
                                    var component2 = Qt.createComponent("GameHub.qml")
                                    if (component2.status === Component.Ready) {
                                        var hubWindow = component2.createObject(desktop)
                                        hubWindow.downloadStarted.connect(function(gameName) {
                                            globalNotification.showNotification(gameName)
                                        })
                                        hubWindow.showFullScreen()
                                        isAppLauncherOpen = false // Auto-close launcher
                                    } else {
                                        console.log("Failed to load GameHub: " + component2.errorString())
                                    }
                                } else if (modelData.name === "Files") {
                                    var component3 = Qt.createComponent("VoltraFiles.qml")
                                    if (component3.status === Component.Ready) {
                                        var filesWindow = component3.createObject(desktop)
                                        filesWindow.show()
                                        isAppLauncherOpen = false // Auto-close launcher
                                    } else {
                                        console.log("Failed to load VoltraFiles: " + component3.errorString())
                                    }
                                } else if (modelData.name === "Store") {
                                    var comp4 = Qt.createComponent("VoltraStore.qml"); if (comp4.status === Component.Ready) { comp4.createObject(desktop).show(); isAppLauncherOpen = false }
                                } else if (modelData.name === "XakChat") {
                                    var compChat = Qt.createComponent("XakChat.qml"); if (compChat.status === Component.Ready) { compChat.createObject(desktop).show(); isAppLauncherOpen = false }
                                } else if (modelData.name === "Xak AI") {
                                    var comp5 = Qt.createComponent("XakPlayground.qml"); if (comp5.status === Component.Ready) { comp5.createObject(desktop).show(); isAppLauncherOpen = false }
                                } else if (modelData.name === "Studio") {
                                    var comp6 = Qt.createComponent("VoltraStudio.qml"); if (comp6.status === Component.Ready) { comp6.createObject(desktop).show(); isAppLauncherOpen = false }
                                } else if (modelData.name === "Weather") {
                                    var comp7 = Qt.createComponent("VoltraWeather.qml"); if (comp7.status === Component.Ready) { comp7.createObject(desktop).show(); isAppLauncherOpen = false }
                                } else if (modelData.name === "Camera") {
                                    var comp8 = Qt.createComponent("VoltraCamera.qml"); if (comp8.status === Component.Ready) { comp8.createObject(desktop).show(); isAppLauncherOpen = false }
                                } else {
                                    // Send syscall request to Kernel via C++ Daemon for other apps
                                    VoltraDaemon.launchApplication(modelData.name, "windows")
                                }
                            }
                        }
                    }
                }
            }

            Item { Layout.fillHeight: true } // Spacer pushes user profile to bottom

            // User Profile (Bottom of Launcher)
            RowLayout {
                spacing: 15
                Rectangle {
                    width: 50; height: 50; radius: 25
                    color: Qt.rgba(138/255, 43/255, 226/255, 0.8)
                    Text { anchors.centerIn: parent; text: "👤"; font.pixelSize: 24 }
                }
                ColumnLayout {
                    spacing: 2
                    Text { text: "Main User"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 16 }
                    Text { text: "Online"; color: "#22c55e"; font.family: "Inter"; font.pixelSize: 12 }
                }
                Item { Layout.fillWidth: true }
                Text { text: "⏻"; color: "#ef4444"; font.pixelSize: 24 } // Power Button
            }
        }
    }

    // =========================================================================
    // BOTTOM-LEFT HOT CORNER (App Launcher Trigger)
    // =========================================================================
    Rectangle {
        anchors.left: parent.left
        anchors.bottom: parent.bottom
        width: 10
        height: 10
        color: "transparent"
        
        MouseArea {
            anchors.fill: parent
            anchors.margins: -50 // Expand hit area invisibly
            hoverEnabled: true
            onClicked: {
                isAppLauncherOpen = !isAppLauncherOpen;
                if (isAppLauncherOpen) isXakAIOpen = false;
            }
        }
    }

    // =========================================================================
    // XAK AI YELLOW LINE (Right Edge)
    // =========================================================================
    Rectangle {
        id: xakTriggerLine
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        width: 4
        height: 200
        radius: 2
        color: xakLineMouse.containsMouse ? "#ffd700" : Qt.rgba(255/255, 215/255, 0/255, 0.5) // Glowing Yellow
        
        Behavior on color { ColorAnimation { duration: 200 } }
        Behavior on height { NumberAnimation { duration: 200 } }

        MouseArea {
            id: xakLineMouse
            anchors.fill: parent
            anchors.margins: -20 // Expand hit area invisibly
            hoverEnabled: true
            onClicked: {
                isXakAIOpen = !isXakAIOpen;
                if (isXakAIOpen) isAppLauncherOpen = false;
            }
        }
    }

    // =========================================================================
    // XAK AI SIDEBAR (Right Side)
    // =========================================================================
    Rectangle {
        id: xakAISidebar
        width: 450
        height: parent.height
        x: isXakAIOpen ? parent.width - width : parent.width
        color: Qt.rgba(15/255, 10/255, 25/255, 0.85) // Deep purple frosted glass
        border.color: "#a855f7" // Xak Purple border
        border.width: 1
        
        Behavior on x { NumberAnimation { duration: 350; easing.type: Easing.OutQuart } }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 30
            spacing: 20

            RowLayout {
                spacing: 15
                Text { text: "✨"; font.pixelSize: 32 }
                Text {
                    text: "Xak Opal"
                    font.family: "Syne"
                    font.pixelSize: 28
                    font.weight: Font.Bold
                    color: "white"
                }
            }
            
            Rectangle { height: 1; Layout.fillWidth: true; color: Qt.rgba(255/255, 255/255, 255/255, 0.1) }

            // Chat History Area
            Item {
                Layout.fillWidth: true
                Layout.fillHeight: true
                
                ColumnLayout {
                    anchors.bottom: parent.bottom
                    spacing: 15
                    
                    // User Message
                    Rectangle {
                        id: userMessageBubble
                        visible: false
                        Layout.alignment: Qt.AlignRight
                        color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                        radius: 15
                        padding: 15
                        Text { id: userMessageText; text: ""; color: "white"; font.family: "Inter" }
                    }
                    
                    // Xak Response
                    RowLayout {
                        id: xakResponseBubble
                        visible: false
                        Layout.alignment: Qt.AlignLeft
                        spacing: 10
                        Text { text: "✨"; font.pixelSize: 18; Layout.alignment: Qt.AlignTop }
                        Rectangle {
                            color: "transparent"
                            Text { id: xakResponseText; text: ""; color: "#d8b4fe"; font.family: "Inter"; wrapMode: Text.WordWrap; width: 300 }
                        }
                    }
                }
            }

            // Input Field
            TextField {
                id: xakInput
                Layout.fillWidth: true
                placeholderText: "Ask Xak anything..."
                font.family: "Inter"
                font.pixelSize: 16
                color: "white"
                background: Rectangle {
                    color: Qt.rgba(0/255, 0/255, 0/255, 0.5)
                    radius: 20
                    border.color: parent.activeFocus ? "#a855f7" : "transparent"
                }
                padding: 15
                
                onAccepted: {
                    if (xakInput.text.trim() === "") return;
                    
                    // Display user message
                    userMessageText.text = xakInput.text;
                    userMessageBubble.visible = true;
                    
                    // Send to C++ Daemon and get response
                    xakResponseText.text = VoltraDaemon.processXakCommand(xakInput.text);
                    xakResponseBubble.visible = true;
                    
                    xakInput.text = "";
                }
            }
        }
    }

    // =========================================================================
    // BACKGROUND DISMISS (Click empty space to close sidebars)
    // =========================================================================
    MouseArea {
        anchors.fill: parent
        z: -1 // Behind everything
        onClicked: {
            isAppLauncherOpen = false;
            isXakAIOpen = false;
        }
    }

    // =========================================================================
    // GLOBAL NOTIFICATIONS (Top Right)
    // =========================================================================
    Rectangle {
        id: globalNotification
        width: 320; height: 80
        anchors.right: parent.right
        anchors.top: parent.top
        anchors.margins: 20
        y: isVisible ? 20 : -100
        opacity: isVisible ? 1 : 0
        property bool isVisible: false
        
        color: Qt.rgba(10/255, 10/255, 15/255, 0.9)
        radius: 12
        border.color: "#a855f7"
        
        Behavior on y { NumberAnimation { duration: 300; easing.type: Easing.OutBack } }
        Behavior on opacity { NumberAnimation { duration: 300 } }
        
        RowLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 15
            
            Text { text: "⬇️"; font.pixelSize: 24 }
            ColumnLayout {
                spacing: 2
                Text { id: notifTitle; text: "Downloading Game"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 14 }
                Text { text: "94.2 GB remaining (80 MB/s)"; color: "#a0a0a0"; font.family: "Inter"; font.pixelSize: 12 }
            }
        }
        
        // Expose a function to show it (e.g. called via C++ or other QML)
        function showNotification(gameName) {
            if (gameName) {
                notifTitle.text = "Downloading " + gameName
            }
            isVisible = true;
            hideTimer.start();
        }
        
        Timer {
            id: hideTimer
            interval: 5000
            onTriggered: globalNotification.isVisible = false
        }
    }
}
