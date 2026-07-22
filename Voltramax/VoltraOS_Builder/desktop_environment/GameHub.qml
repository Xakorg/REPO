import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15
import QtGraphicalEffects 1.15

Window {
    id: gameHubWindow
    width: Screen.width
    height: Screen.height
    visible: true
    visibility: Window.FullScreen
    title: "Game Hub"
    color: "black"

    // The currently focused game (determines background color/blur)
    property string activeGameColor: "#eab308"
    property string activeGameName: "Cyberpunk 2077"
    property string activeGameStore: "steam"
    property string activeGameURI: "steam://rungameid/1091500"
    property int activeDownloadProgress: 0

    // Signal to tell the Desktop to show the global notification
    signal downloadStarted(string gameName)

    // Dynamic Background
    Rectangle {
        id: dynamicBg
        anchors.fill: parent
        color: activeGameColor
        opacity: 0.25
        Behavior on color { ColorAnimation { duration: 600; easing.type: Easing.InOutQuad } }
        
        // Massive radial gradient to simulate console light bleed
        RadialGradient {
            anchors.fill: parent
            gradient: Gradient {
                GradientStop { position: 0.0; color: gameHubWindow.activeGameColor }
                GradientStop { position: 1.0; color: "transparent" }
            }
            horizontalOffset: 0
            verticalOffset: -300
            horizontalRadius: 1000
            verticalRadius: 800
            opacity: 0.4
            Behavior on gradient { ColorAnimation { duration: 600 } }
        }
    }

    // Top Navigation Bar
    RowLayout {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: 40
        height: 60

        Text {
            text: "GAME HUB"
            font.family: "Syne"
            font.pixelSize: 32
            font.weight: Font.Bold
            color: "white"
        }

        Item { Layout.fillWidth: true } // Spacer

        // Profile & Close
        RowLayout {
            spacing: 30
            Rectangle {
                width: 40; height: 40; radius: 20; color: "#33FFFFFF"
                Text { anchors.centerIn: parent; text: "👤"; font.pixelSize: 20 }
            }
            Text {
                text: "Main User"
                font.family: "Inter"
                font.pixelSize: 18
                font.bold: true
                color: "white"
            }
            Rectangle {
                width: 40; height: 40; radius: 20; color: "#ef4444"
                Text { anchors.centerIn: parent; text: "✖"; color: "white"; font.pixelSize: 20; font.bold: true }
                MouseArea { anchors.fill: parent; onClicked: gameHubWindow.close() }
            }
        }
    }

    // Main Hero Section (Currently Selected Game)
    ColumnLayout {
        anchors.left: parent.left
        anchors.bottom: gameCarousel.top
        anchors.leftMargin: 80
        anchors.bottomMargin: 50
        spacing: 15

        Text {
            text: gameHubWindow.activeGameName
            font.family: "Syne"
            font.pixelSize: 72
            font.weight: Font.Black
            color: "white"
            layer.enabled: true
            layer.effect: DropShadow { color: "black"; radius: 10; samples: 16; spread: 0.5 }
        }

        RowLayout {
            spacing: 20
            
            // "Play" or "Download" Button
            Rectangle {
                width: 200; height: 60; radius: 30
                color: "white"
                
                Text {
                    anchors.centerIn: parent
                    text: gameHubWindow.activeDownloadProgress > 0 ? "DOWNLOADING " + gameHubWindow.activeDownloadProgress + "%" : "PLAY"
                    font.family: "Inter"
                    font.pixelSize: 20
                    font.weight: Font.Bold
                    color: "black"
                }

                // Internal Progress Bar Visuals
                Rectangle {
                    anchors.left: parent.left
                    anchors.top: parent.top
                    anchors.bottom: parent.bottom
                    width: parent.width * (gameHubWindow.activeDownloadProgress / 100.0)
                    radius: 30
                    color: gameHubWindow.activeGameColor
                    opacity: 0.3
                    visible: gameHubWindow.activeDownloadProgress > 0
                    Behavior on width { NumberAnimation { duration: 250 } }
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        if (gameHubWindow.activeDownloadProgress === 0) {
                            // Trigger invisible Steam/Epic backend via VoltraDaemon IPC
                            VoltraDaemon.executeGameURI(gameHubWindow.activeGameURI)
                            
                            // Simulate a download starting for demonstration
                            if (gameHubWindow.activeGameName === "Cyberpunk 2077") {
                                downloadTimer.start()
                                gameHubWindow.downloadStarted(gameHubWindow.activeGameName)
                            }
                        }
                    }
                }
            }
            
            // Platform Indicator
            Rectangle {
                width: 60; height: 60; radius: 30
                color: "#22FFFFFF"
                border.color: "#44FFFFFF"
                Text {
                    anchors.centerIn: parent
                    text: gameHubWindow.activeGameStore === "steam" ? "💨" : (gameHubWindow.activeGameStore === "epic" ? "E" : "V")
                    color: "white"
                    font.pixelSize: 24
                    font.bold: true
                }
            }
        }
    }

    // Horizontal Scrolling Carousel
    ListView {
        id: gameCarousel
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 60
        height: 350
        orientation: ListView.Horizontal
        spacing: 30
        leftMargin: 80
        rightMargin: 80

        model: [
            { name: "Cyberpunk 2077", color: "#eab308", store: "steam", uri: "steam://rungameid/1091500" },
            { name: "Fortnite", color: "#3b82f6", store: "epic", uri: "com.epicgames.launcher://apps/fn%3A4%3Acore?action=launch&silent=true" },
            { name: "Roblox", color: "#ef4444", store: "voltra", uri: "roblox://placeId=1818" },
            { name: "Elden Ring", color: "#d4af37", store: "steam", uri: "steam://rungameid/1245620" }
        ]

        delegate: Rectangle {
            width: 250
            height: 350
            radius: 20
            color: modelData.color
            
            // Gradient Overlay
            Rectangle {
                anchors.fill: parent
                radius: 20
                gradient: Gradient {
                    GradientStop { position: 0.0; color: "transparent" }
                    GradientStop { position: 1.0; color: "#EE000000" }
                }
            }

            Text {
                anchors.bottom: parent.bottom
                anchors.left: parent.left
                anchors.margins: 20
                text: modelData.name
                color: "white"
                font.family: "Inter"
                font.pixelSize: 24
                font.bold: true
                wrapMode: Text.WordWrap
                width: parent.width - 40
            }

            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                onEntered: {
                    gameHubWindow.activeGameName = modelData.name
                    gameHubWindow.activeGameColor = modelData.color
                    gameHubWindow.activeGameStore = modelData.store
                    gameHubWindow.activeGameURI = modelData.uri
                    gameCarousel.currentIndex = index
                }
                onClicked: {
                    VoltraDaemon.executeGameURI(modelData.uri)
                }
            }
            
            // Selection Ring
            Rectangle {
                anchors.fill: parent
                anchors.margins: -4
                color: "transparent"
                border.color: "white"
                border.width: 3
                radius: 24
                visible: gameCarousel.currentIndex === index
            }
        }
    }

    // Dummy Timer to simulate a massive game download
    Timer {
        id: downloadTimer
        interval: 100
        repeat: true
        onTriggered: {
            if (gameHubWindow.activeDownloadProgress < 100) {
                gameHubWindow.activeDownloadProgress += 1;
            } else {
                stop();
                gameHubWindow.activeDownloadProgress = 0; // Reset to play state
            }
        }
    }
}
