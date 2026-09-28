import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtGraphicalEffects

Window {
    id: desktop
    width: 1920
    height: 1080
    visible: true
    visibility: Window.FullScreen

    color: "transparent"

    // =========================================================================
    // CORE STATE MANAGEMENT
    // =========================================================================
    property bool isAppLauncherOpen: false
    property bool isXakAIOpen: false
    property bool isHardwareModeNormal: true
    property bool isHardwareModeStylus: false
    property bool isHardwareModeTV: false
    property bool isHardwareModeTablet: false
    property bool isHardwareModeDualTablet: false
    property string currentHardwareMode: "normal"
    property string wakeWord: "Hey Xak"
    property int xakAIState: 0 // 0=idle, 1=blue(listening), 2=purple(thinking), 3=yellow(responding)
    property var activeWeatherType: "clear"
    property var selectedLocation: { lat: 40.7128, lon: -74.0060, name: "New York" }
    property int oobeCompleted: 1
    property bool soundEnabled: true
    property bool hapticEnabled: true
    property bool vpnEnabled: false
    property bool firewallEnabled: true
    property bool diskEncryptionEnabled: true
    property string cpuTemp: "45°C"
    property string gpuTemp: "52°C"
    property double cpuUsage: 23.5
    property double ramUsage: 41.2
    property double storageUsed: 67.8
    property double storageTotal: 512.0
    property int uptimeSeconds: 86400
    property string kernelVersion: "VoltraOS 1.0.0 (Ring 0)"
    property bool xakAIEnabled: true
    property bool xakVoiceOutput: true
    property string xakResponseStyle: "professional"
    property int xakMaxResponseLength: 500
    property bool xakOpalIndexing: true
    property bool micAccessEnabled: true
    property bool cameraAccessEnabled: true
    property string displayResolution: "1920x1080"
    property int displayRefreshRate: 120
    property bool hdrEnabled: true
    property string cpuScheduler: "balanced"
    property bool hyperThreadingEnabled: true
    property bool xakteirMeshEnabled: true
    property string wifiNetwork: "VoltraNet-5G"
    property string ethernetStatus: "Connected"
    property string dnsPrimary: "1.1.1.1"
    property string dnsSecondary: "8.8.8.8"
    property int bandwidthLimit: 0 // 0 = unlimited
    property bool fontSizeLarge: false
    property int contrastMode: 0 // 0=normal, 1=high, 2=low
    property bool screenReaderEnabled: false
    property bool keyboardNavMode: false
    property double animationSpeed: 1.0
    property bool colorBlindMode: false
    property int colorBlindType: 0
    property bool fontSmoothing: true
    property bool dpiScaling: true
    property double dpiScaleFactor: 1.0
    property bool nightModeEnabled: true
    property bool autoDimDisplay: true
    property int autoDimDelay: 300000
    property bool touchPressureSensitive: true
    property bool palmRejectionEnabled: true
    property bool stylusButtonMode: false
    property int stylusMode: 0 // 0=pen, 1=eraser, 2=highlighter
    property bool stylusPressureCurve: true
    property bool stylusTiltSupport: true
    property bool stylusHover: true
    property bool foldSenseEnabled: true
    property int foldAngle: 90 // 90=normal, 270=stylus, 360=TV, 0=tablet, 45=dual
    property bool dualTabletMode: false
    property string dualTabletLeftUser: "User1"
    property string dualTabletRightUser: "Guest"
    property bool dualTabletSessionActive: false
    property bool gameBarEnabled: true
    property bool gameBarSteamEnabled: true
    property bool gameBarEpicEnabled: true
    property bool gameBarAutoDetect: true
    property bool gameBarOverlayVisible: false
    property string gameBarActiveGame: ""
    property int gameBarFrameRate: 60
    property bool gameBarRecordEnabled: false
    property bool gameBarStreamEnabled: false
    property bool gameBarScreenshotEnabled: true
    property bool linuxCompatibilityEnabled: true
    property bool linuxVisibleInStartMenu: false
    property bool linuxRootAccess: false
    property bool linuxPackageManager: "apt" // apt, pacman, yum
    property string linuxDesktopEnv: "none" // hidden
    property bool linuxKernelVisible: false
    property string linuxDistro: "VoltraLinux"
    property int linuxVersion: 1
    property bool ecoAIEnabled: true
    property string ecoAISource: "Wikipedia"
    property bool ecoAIUserLinks: true
    property int ecoAIMaxLinks: 50
    property bool ecoAIVerbose: true
    property bool ecoAIExplain: true
    property string ecoAITemperature: "medium" // low, medium, high
    property string ecoAIResponseFormat: "text" // text, bullet, summary
    property int ecoAIContextLength: 1024
    property bool ecoAIWebCache: true
    property string ecoAIWebsite: "https://ecoknowledge.voltraos.com"
    property bool ecoAIReadOnly: true
    property bool ecoAILearning: true
    property string ecoAILastLearned: ""
    property int ecoAISessions: 0
    property bool ecoAISharing: false
    property string ecoAICommunityVersion: "1.0.0"

    // =========================================================================
    // ANIMATED WEATHER BACKGROUND
    // =========================================================================
    Rectangle {
        id: weatherBackground
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: activeWeatherType === "rain" ? "#0a1628" : (activeWeatherType === "snow" ? "#1a2035" : (activeWeatherType === "night" ? "#050510" : (activeWeatherType === "sunset" ? "#1a0a20" : "#0a1a2e"))))
            GradientStop { position: 1.0; color: activeWeatherType === "rain" ? "#1a2844" : (activeWeatherType === "snow" ? "#253050" : (activeWeatherType === "night" ? "#0a0a15" : (activeWeatherType === "sunset" ? "#2a1030" : "#102040")))
        }

        // Animated weather effects
        WeatherLayer {
            anchors.fill: parent
            weatherType: activeWeatherType
            location: selectedLocation
            opacity: 0.3
        }

        // Animated character overlay
        AnimatedCharacter {
            id: animatedCharacter
            anchors.fill: parent
            weatherType: activeWeatherType
            location: selectedLocation
            visible: true
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
        color: Qt.rgba(10/255, 10/255, 15/255, 0.85)
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
                onTextChanged: {
                    // Filter apps, files, and settings
                    searchResults.visible = text.length > 0
                }
            }

            // Search Results Dropdown
            Rectangle {
                id: searchResults
                Layout.fillWidth: true
                height: 200
                color: Qt.rgba(15/255, 15/255, 25/255, 0.9)
                radius: 12
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                visible: false
                clip: true

                ListView {
                    anchors.fill: parent
                    anchors.margins: 8
                    model: searchModel
                    delegate: Rectangle {
                        width: parent.width
                        height: 40
                        color: mouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.08) : "transparent"
                        Text { text: model.name; anchors.verticalCenter: parent.verticalCenter; anchors.leftMargin: 15; color: "white" }
                        MouseArea { anchors.fill: parent; onClicked: { /* Launch or navigate */ } }
                    }
                }
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
                        ListElement { name: "Xakteir Drive"; iconSource: "file-disk"; iconColor: "#4285F4"; appType: "drive"; launchFile: "XakteirDrive.qml" }
                        ListElement { name: "Install VoltraOS"; iconSource: "setup"; iconColor: "#FF0000"; appType: "installer"; launchFile: "VoltraInstaller.qml" }
                        ListElement { name: "System Settings"; iconSource: "settings"; iconColor: "#888888"; appType: "settings"; launchFile: "SystemSettings.qml" }
                        ListElement { name: "VoltMaster"; iconSource: "terminal"; iconColor: "#00FFCC"; appType: "terminal"; launchFile: "VoltMaster.qml" }
                        ListElement { name: "VoltraBrowser"; iconSource: "browser"; iconColor: "#4285F4"; appType: "browser"; launchFile: "VoltraBrowser.qml" }
                        ListElement { name: "VoltTerm"; iconSource: "code"; iconColor: "#0F0"; appType: "terminal"; launchFile: "VoltTerm.qml" }
                        ListElement { name: "Xakteir Stream"; iconSource: "video"; iconColor: "#FF5F56"; appType: "stream"; launchFile: "XakteirStream.qml" }
                        ListElement { name: "OOBE Setup"; iconSource: "setup"; iconColor: "#9C27B0"; appType: "oobe"; launchFile: "../OOBE_Native/OOBE.qml" }
                        ListElement { name: "Files"; iconSource: "folder"; iconColor: "#eab308"; appType: "files"; launchFile: "VoltraFiles.qml" }
                        ListElement { name: "Store"; iconSource: "store"; iconColor: "#ec4899"; appType: "store"; launchFile: "VoltraStore.qml" }
                        ListElement { name: "XakChat"; iconSource: "chat"; iconColor: "#10b981"; appType: "chat"; launchFile: "XakChat.qml" }
                        ListElement { name: "Xak AI"; iconSource: "ai"; iconColor: "#f59e0b"; appType: "ai"; launchFile: "XakPlayground.qml" }
                        ListElement { name: "Studio"; iconSource: "studio"; iconColor: "#ef4444"; appType: "studio"; launchFile: "VoltraStudio.qml" }
                        ListElement { name: "Weather"; iconSource: "weather"; iconColor: "#06b6d4"; appType: "weather"; launchFile: "VoltraWeather.qml" }
                        ListElement { name: "Camera"; iconSource: "camera"; iconColor: "#8b5cf6"; appType: "camera"; launchFile: "VoltraCamera.qml" }
                        ListElement { name: "Maps"; iconSource: "map"; iconColor: "#FF6B35"; appType: "maps"; launchFile: "VoltraMaps.qml" }
                        ListElement { name: "Games"; iconSource: "games"; iconColor: "#a855f7"; appType: "games"; launchFile: "GameHub.qml" }
                    }

                    Rectangle {
                        width: 70; height: 70; radius: 20
                        color: Qt.rgba(255/255, 255/255, 255/255, 0.05)
                        border.color: appMouse.containsMouse ? modelData.iconColor : "transparent"
                        Behavior on color { ColorAnimation { duration: 150 } }

                        // Icon drawn with Canvas based on iconSource
                        Canvas {
                            width: 28; height: 28
                            anchors.centerIn: parent
                            onPaint: {
                                var ctx = getContext("2d")
                                ctx.clearRect(0, 0, width, height)
                                drawAppIcon(ctx, modelData.iconSource, modelData.iconColor)
                            }
                        }

                        Text {
                            text: modelData.name.length > 6 ? modelData.name.substring(0,6) : modelData.name
                            anchors.bottom: parent.bottom
                            anchors.horizontalCenter: parent.horizontalCenter
                            anchors.bottomMargin: 4
                            color: "white"
                            font.pixelSize: 8
                            font.family: "Inter"
                        }

                        MouseArea {
                            id: appMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                launchApplication(modelData)
                                isAppLauncherOpen = false
                            }
                        }
                    }
                }
            }

            // Recently Used Apps
            Text {
                text: "Recent"
                font.family: "Inter"
                font.pixelSize: 14
                font.weight: Font.Bold
                color: "#a0a0a0"
                Layout.topMargin: 25
            }

            GridLayout {
                columns: 4
                rowSpacing: 12
                columnSpacing: 12
                Layout.fillWidth: true
                Layout.preferredHeight: 80

                Repeater {
                    model: recentAppsModel
                    delegate: Rectangle {
                        width: 60; height: 60; radius: 15
                        color: Qt.rgba(255/255, 255/255, 255/255, 0.05)
                        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                        Text { text: modelData.icon; font.pixelSize: 18; anchors.centerIn: parent }
                        Text { text: modelData.name; anchors.bottom: parent.bottom; anchors.horizontalCenter: parent.horizontalCenter; anchors.bottomMargin: 1; color: "#888888"; font.pixelSize: 6 }
                        MouseArea { anchors.fill: parent; onClicked: { /* Launch recent app */ } }
                    }
                }
            }

            // Bottom section
            Item { Layout.fillHeight: true }

            // System Status Bar
            Rectangle {
                width: parent.width
                height: 50
                color: Qt.rgba(0/255, 0/255, 0/255, 0.5)
                radius: 10

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 15

                    Text { text: "⚡"; font.pixelSize: 16 }
                    Text { text: cpuUsage.toFixed(1) + "%"; color: "#a0a0a0"; font.pixelSize: 12 }
                    Text { text: "🧠"; font.pixelSize: 16 }
                    Text { text: ramUsage.toFixed(1) + "%"; color: "#a0a0a0"; font.pixelSize: 12 }
                    Text { text: "💾"; font.pixelSize: 16 }
                    Text { text: storageUsed.toFixed(1) + "/" + storageTotal + "GB"; color: "#a0a0a0"; font.pixelSize: 12 }
                    Text { text: "🌡"; font.pixelSize: 16 }
                    Text { text: cpuTemp; color: "#a0a0a0"; font.pixelSize: 12 }
                }
            }

            // User Profile
            RowLayout {
                spacing: 15
                Rectangle {
                    width: 50; height: 50; radius: 25
                    color: Qt.rgba(138/255, 43/255, 226/255, 0.8)
                    Canvas { width: 30; height: 30; anchors.centerIn: parent; onPaint: { var ctx = getContext("2d"); ctx.clearRect(0,0,30,30); ctx.fillStyle = "#a855f7"; ctx.beginPath(); ctx.arc(15,12,8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(15,22); ctx.lineTo(5,38); ctx.lineTo(25,38); ctx.closePath(); ctx.fill(); } }
                }
                ColumnLayout {
                    spacing: 2
                    Text { text: "Main User"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 16 }
                    Text { text: "Online • " + currentHardwareMode.toUpperCase(); color: "#22c55e"; font.family: "Inter"; font.pixelSize: 12 }
                }
                Item { Layout.fillWidth: true }
                Text { text: "⏻"; color: "#ef4444"; font.pixelSize: 24 }
            }
        }
    }

    // =========================================================================
    // BOTTOM-LEFT HOT CORNER
    // =========================================================================
    Rectangle {
        anchors.left: parent.left
        anchors.bottom: parent.bottom
        width: 10; height: 10
        color: "transparent"

        MouseArea {
            anchors.fill: parent
            anchors.margins: -50
            hoverEnabled: true
            onClicked: {
                isAppLauncherOpen = !isAppLauncherOpen
                if (isAppLauncherOpen) isXakAIOpen = false
            }
        }
    }

    // =========================================================================
    // BOTTOM-RIGHT HOT CORNER (Xak AI)
    // =========================================================================
    Rectangle {
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        width: 10; height: 10
        color: "transparent"

        MouseArea {
            anchors.fill: parent
            anchors.margins: -50
            hoverEnabled: true
            onClicked: {
                isXakAIOpen = !isXakAIOpen
                if (isXakAIOpen) isAppLauncherOpen = false
            }
        }
    }

    // =========================================================================
    // HARDWARE MODE INDICATOR (Top Center)
    // =========================================================================
    Rectangle {
        id: hardwareModeIndicator
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: 15
        width: 200
        height: 30
        radius: 15
        color: Qt.rgba(10/255, 10/255, 20/255, 0.7)
        border.color: "#a855f7"
        border.width: 1
        visible: !isHardwareModeNormal

        Text {
            text: "MODE: " + currentHardwareMode.toUpperCase()
            color: "#a855f7"
            font.pixelSize: 12
            font.bold: true
            font.family: "Inter"
            anchors.centerIn: parent
        }
    }

    // =========================================================================
    // XAK AI YELLOW LINE with State Machine
    // =========================================================================
    Rectangle {
        id: xakTriggerLine
        anchors.right: parent.right
        anchors.verticalCenter: parent.verticalCenter
        width: xakAIState === 0 ? 4 : (xakAIState === 1 ? 6 : (xakAIState === 2 ? 8 : 5))
        height: xakAIState === 0 ? 200 : (xakAIState === 1 ? 250 : (xakAIState === 2 ? 250 : 300))
        radius: 2
        color: {
            if (xakAIState === 0) return Qt.rgba(255/255, 215/255, 0/255, 0.5)
            if (xakAIState === 1) return "#0066FF" // Bright Blue - Listening
            if (xakAIState === 2) return "#a855f7" // Purple - Thinking
            if (xakAIState === 3) return "#FFD700" // Yellow - Responding
            return "#FFD700"
        }

        Behavior on color { ColorAnimation { duration: 500 } }
        Behavior on height { NumberAnimation { duration: 500; easing.type: Easing.OutBack } }
        Behavior on width { NumberAnimation { duration: 300 } }

        // Glow effect
        layer.enabled: true
        layer.effect: Glow {
            color: xakTriggerLine.color
            radius: 15
            samples: 16
            spread: 0.3
            visible: xakAIState > 0
        }

        MouseArea {
            id: xakLineMouse
            anchors.fill: parent
            anchors.margins: -20
            hoverEnabled: true
            onClicked: {
                if (xakAIState === 0) {
                    // Activate listening
                    xakAIState = 1
                    xakTriggerLine.color = "#0066FF"
                    xakTriggerLine.height = 250
                    xakAIStatus.text = "Listening... Say what you need"
                    xakAIStatus.opacity = 1
                    voiceIndicator.visible = true
                    QTimer.singleShot(2000, function() {
                        xakAIState = 2
                        xakTriggerLine.color = "#a855f7"
                        xakAIStatus.text = "Thinking..."
                        QTimer.singleShot(2000, function() {
                            xakAIState = 3
                            xakTriggerLine.color = "#FFD700"
                            xakTriggerLine.height = 300
                            xakAIStatus.text = "Here is what I found..."
                            QTimer.singleShot(3000, function() {
                                xakAIState = 0
                                xakTriggerLine.height = 200
                                xakAIStatus.opacity = 0
                                voiceIndicator.visible = false
                            })
                        })
                    })
                }
            }
            onEntered: {
                if (xakAIState === 0) xakTriggerLine.color = Qt.rgba(255/255, 215/255, 0/255, 0.8)
            }
            onExited: {
                if (xakAIState === 0) xakTriggerLine.color = Qt.rgba(255/255, 215/255, 0/255, 0.5)
            }
        }
    }

    // Voice Indicator Ring
    Rectangle {
        id: voiceIndicator
        width: 60; height: 60
        radius: 30
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: 60
        color: "transparent"
        border.color: "#0066FF"
        border.width: 2
        opacity: 0
        visible: false

        NumberAnimation on border.width { from: 2; to: 8; duration: 1000; loops: Animation.Infinite; easing.type: Easing.InOutQuad }
        NumberAnimation on opacity { from: 0; to: 1; duration: 500; loops: Animation.Infinite; easing.type: Easing.InOutQuad }

        Text { text: "🎙"; font.pixelSize: 24; anchors.centerIn: parent }
    }

    // Xak AI Status Text
    Text {
        id: xakAIStatus
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: 20
        text: ""
        font.family: "Inter"
        font.pixelSize: 18
        color: "#3b82f6"
        opacity: 0
        Behavior on opacity { NumberAnimation { duration: 300 } }
    }

    // =========================================================================
    // XAK AI SIDEBAR (Fullscreen when active)
    // =========================================================================
    Rectangle {
        id: xakAISidebar
        width: isXakAIOpen && isHardwareModeTV ? parent.width : 450
        height: parent.height
        x: isXakAIOpen ? (isHardwareModeTV ? 0 : parent.width - width) : parent.width
        color: Qt.rgba(15/255, 10/255, 25/255, 0.85)
        border.color: "#a855f7"
        border.width: 1

        Behavior on x { NumberAnimation { duration: 350; easing.type: Easing.OutQuart } }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 30
            spacing: 20

            RowLayout {
                spacing: 15
                Canvas { width: 32; height: 32; onPaint: { var ctx = getContext("2d"); ctx.clearRect(0,0,32,32); ctx.fillStyle = "#a855f7"; ctx.beginPath(); ctx.arc(16,16,12,0,Math.PI*2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "bold 14px Inter"; ctx.fillText("✨", 8, 21); } }
                Text { text: "Xak Opal"; font.family: "Syne"; font.pixelSize: 28; font.weight: Font.Bold; color: "white" }
                Item { Layout.fillWidth: true }
                Text { text: xakAIState === 0 ? "Idle" : (xakAIState === 1 ? "Listening..." : (xakAIState === 2 ? "Thinking..." : "Responding...")); color: xakAIState === 0 ? "#666666" : "#a855f7"; font.pixelSize: 12 }
                Rectangle { width: 12; height: 12; radius: 6; color: xakAIState === 1 ? "#0066FF" : (xakAIState === 2 ? "#a855f7" : (xakAIState === 3 ? "#FFD700" : "#666666")); MouseArea { anchors.fill: parent; enabled: false } }
            }

            Rectangle { height: 1; Layout.fillWidth: true; color: Qt.rgba(255/255, 255/255, 255/255, 0.1) }

            // Chat History
            Item {
                Layout.fillWidth: true
                Layout.fillHeight: true

                ColumnLayout {
                    anchors.bottom: parent.bottom
                    spacing: 15

                    Rectangle {
                        id: userMessageBubble
                        visible: false
                        Layout.alignment: Qt.AlignRight
                        color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                        radius: 15
                        padding: 15
                        Text { id: userMessageText; text: ""; color: "white"; font.family: "Inter" }
                    }

                    RowLayout {
                        id: xakResponseBubble
                        visible: false
                        Layout.alignment: Qt.AlignLeft
                        spacing: 10
                        Text { text: "✨"; font.pixelSize: 18; Layout.alignment: Qt.AlignTop }
                        Rectangle { color: "transparent" }
                        Text { id: xakResponseText; text: ""; color: "#d8b4fe"; font.family: "Inter"; wrapMode: Text.WordWrap; width: 300 }
                    }

                    // Quick Actions
                    Rectangle {
                        Layout.fillWidth: true
                        height: 60
                        color: Qt.rgba(0/255, 0/255, 0/255, 0.3)
                        radius: 10

                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 10
                            spacing: 10

                            Text { text: "Quick Actions:"; color: "#888888"; font.pixelSize: 12; Layout.alignment: Qt.AlignVCenter }
                            Text { text: "🌤️ Weather"; color: "#06b6d4"; font.pixelSize: 14; Layout.alignment: Qt.AlignVCenter; MouseArea { anchors.fill: parent; onClicked: { xakResponseText.text = "Current weather: 14°C, partly cloudy. Perfect day for coding!"; xakResponseBubble.visible = true; } } }
                            Text { text: "📁 Files"; color: "#eab308"; font.pixelSize: 14; Layout.alignment: Qt.AlignVCenter; MouseArea { anchors.fill: parent; onClicked: { xakResponseText.text = "Opening file manager..."; xakResponseBubble.visible = true; VoltraDaemon.launchApplication("Files", "windows"); } } }
                            Text { text: "🎮 Games"; color: "#a855f7"; font.pixelSize: 14; Layout.alignment: Qt.AlignVCenter; MouseArea { anchors.fill: parent; onClicked: { xakResponseText.text = "Opening Game Hub..."; xakResponseBubble.visible = true; VoltraDaemon.launchApplication("Game Hub", "games"); } } }
                        }
                    }
                }
            }

            // Input Field
            TextField {
                id: xakInput
                Layout.fillWidth: true
                placeholderText: "Ask Xak anything... (or say 'Hey Xak')"
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
                    if (xakInput.text.trim() === "") return
                    userMessageText.text = xakInput.text
                    userMessageBubble.visible = true
                    xakResponseText.text = VoltraDaemon.processXakCommand(xakInput.text)
                    xakResponseBubble.visible = true
                    xakInput.text = ""
                }
            }
        }
    }

    // =========================================================================
    // GLOBAL NOTIFICATIONS
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

            Canvas { width: 24; height: 24; onPaint: { var ctx = getContext("2d"); ctx.clearRect(0,0,24,24); ctx.fillStyle = "#00FFCC"; ctx.beginPath(); ctx.moveTo(4,12); ctx.lineTo(10,18); ctx.lineTo(20,6); ctx.stroke(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); } }
            ColumnLayout {
                spacing: 2
                Text { id: notifTitle; text: "Notification"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 14 }
                Text { text: "System update available"; color: "#a0a0a0"; font.family: "Inter"; font.pixelSize: 12 }
            }
        }

        function showNotification(title, message) {
            if (title) notifTitle.text = title
            notifMessage.text = message
            isVisible = true
            hideTimer.start()
        }

        Timer {
            id: hideTimer
            interval: 5000
            onTriggered: globalNotification.isVisible = false
        }
    }

    Text { id: notifMessage; visible: false; text: "" }

    // =========================================================================
    // VOLUME CONTROL (Bottom Right)
    // =========================================================================
    Rectangle {
        id: volumeControl
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.margins: 20
        width: 60; height: 120
        radius: 12
        color: Qt.rgba(10/255, 10/255, 15/255, 0.7)
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
        visible: isAppLauncherOpen || isXakAIOpen

        ColumnLayout {
            anchors.centerIn: parent
            spacing: 10

            Text { text: "🔊"; font.pixelSize: 18 }
            Rectangle { width: 8; height: 60; radius: 4; color: "#33FFFFFF"; Layout.fillWidth: true; Layout.fillHeight: true; Rectangle { width: 4; height: 40; radius: 2; color: soundEnabled ? "#00FFCC" : "#666666"; anchors.centerIn: parent } }
            Text { text: "🔇"; font.pixelSize: 14 }
        }
    }

    // =========================================================================
    // KEYBOARD SHORTCUTS
    // =========================================================================
    Keys.onPressed: (event) => {
        if (event.key === Qt.Key_Super || event.key === Qt.Key_Meta) {
            isAppLauncherOpen = !isAppLauncherOpen
            if (isAppLauncherOpen) isXakAIOpen = false
        }
        if (event.key === Qt.Key_Escape) {
            isAppLauncherOpen = false
            isXakAIOpen = false
        }
        if (event.key === Qt.Key_F && event.modifiers & Qt.ControlModifier) {
            // Fullscreen toggle for active window
        }
        if (event.key === Qt.Key_T && event.modifiers & Qt.ControlModifier) {
            // Open new terminal
            VoltraDaemon.launchApplication("Terminal", "terminal")
        }
        if (event.key === Qt.Key_W && event.modifiers & Qt.ControlModifier) {
            // Close active window
        }
        if (event.key === Qt.Key_L && event.modifiers & Qt.ControlModifier) {
            // Lock screen
            isAppLauncherOpen = false
            isXakAIOpen = false
        }
        if (event.key === Qt.Key_F5) {
            // Refresh
        }
        if (event.key === Qt.Key_F11) {
            // Fullscreen
        }
    }
}
