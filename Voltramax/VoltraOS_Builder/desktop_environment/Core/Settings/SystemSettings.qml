import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: settingsRoot
    anchors.fill: parent

    // UI State
    property string activePage: "display" // 'display', 'network', 'privacy', 'kernel', 'xakai', 'accessibility', 'storage', 'systeminfo'
    property bool isKernelVaultMode: activePage === "kernel"
    property bool isXakAIPage: activePage === "xakai"
    property bool isAccessibilityPage: activePage === "accessibility"
    property bool isStoragePage: activePage === "storage"
    property bool isSystemInfoPage: activePage === "systeminfo"

    // Background Layer (Dynamically shifts for Vault Aesthetic)
    Rectangle {
        id: bg
        anchors.fill: parent
        color: isKernelVaultMode ? "#0F0F0F" : (isXakAIPage ? "#0A0515" : "#0A0D14")

        Behavior on color { ColorAnimation { duration: 400 } }

        // Vault Warning Stripes (Only visible in Kernel mode)
        Item {
            anchors.fill: parent
            opacity: isKernelVaultMode ? 0.1 : 0.0
            Behavior on opacity { NumberAnimation { duration: 400 } }

            Repeater {
                model: 20
                Rectangle {
                    y: index * 60
                    width: parent.width
                    height: 20
                    color: "#FFBD2E"
                    rotation: -10
                    transformOrigin: Item.Center
                }
            }
        }

        // Xak AI Purple Glow (For Xak AI page)
        Rectangle {
            visible: isXakAIPage
            anchors.fill: parent
            gradient: Gradient {
                GradientStop { position: 0.0; color: Qt.rgba(168/255, 85/255, 247/255, 0.05) }
                GradientStop { position: 1.0; color: Qt.rgba(59/255, 130/255, 246/255, 0.05) }
            }
            Behavior on opacity { NumberAnimation { duration: 500 } }
        }

        // Accessibility High Contrast Mode
        Rectangle {
            visible: isAccessibilityPage
            anchors.fill: parent
            color: contrastMode === 1 ? "#FFFFFF" : (contrastMode === 2 ? "#000000" : "transparent")
            opacity: 0.15
            Behavior on color { ColorAnimation { duration: 500 } }
        }
    }

    // Top Search Bar
    Rectangle {
        id: searchHeader
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 70
        color: isKernelVaultMode ? "#222222" : (isXakAIPage ? "#1A0A2E" : "#11FFFFFF")
        border.color: isKernelVaultMode ? "#FFBD2E" : (isXakAIPage ? "#a855f7" : "#22FFFFFF")
        border.width: 1

        Behavior on color { ColorAnimation { duration: 400 } }
        Behavior on border.color { ColorAnimation { duration: 400 } }

        RowLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 15

            Canvas {
                width: 24; height: 24
                onPaint: {
                    var ctx = getContext("2d")
                    ctx.clearRect(0,0,24,24)
                    ctx.fillStyle = "#888888"
                    ctx.beginPath(); ctx.arc(12,12,8,0,Math.PI*2); ctx.fill()
                    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5
                    ctx.beginPath(); ctx.moveTo(16,16); ctx.lineTo(20,20); ctx.stroke()
                }
            }

            TextInput {
                Layout.fillWidth: true
                color: "white"
                font.pixelSize: 18
                font.family: "Syne"
                text: "Search settings, kernel flags, or hardware..."
                opacity: 0.5
                onFocusChanged: { if (focus) { text = ""; opacity = 1.0; } }
            }

            Text {
                text: activePage.toUpperCase()
                color: "#a0a0a0"
                font.pixelSize: 14
                font.family: "Inter"
            }
        }
    }

    // Main Content Area Layout
    RowLayout {
        anchors.top: searchHeader.bottom
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        spacing: 0

        // --------------------------------------------------------------------
        // SIDEBAR NAVIGATION
        // --------------------------------------------------------------------
        Rectangle {
            id: sidebar
            Layout.preferredWidth: 250
            Layout.fillHeight: true
            color: isKernelVaultMode ? "#111111" : (isXakAIPage ? "#0D051A" : "#05FFFFFF")
            border.color: isKernelVaultMode ? "#FFBD2E" : (isXakAIPage ? "#a855f7" : "#22FFFFFF")
            border.width: 1

            Behavior on color { ColorAnimation { duration: 400 } }

            ColumnLayout {
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.topMargin: 20
                spacing: 5

                SidebarButton { text: "🖥️ Display & DRM"; isActive: activePage === "display"; onClicked: activePage = "display" }
                SidebarButton { text: "🌐 Network & Mesh"; isActive: activePage === "network"; onClicked: activePage = "network" }
                SidebarButton { text: "🛡️ Privacy & Security"; isActive: activePage === "privacy"; onClicked: activePage = "privacy" }
                SidebarButton { text: "🎨 Xak AI Settings"; isActive: activePage === "xakai"; onClicked: activePage = "xakai" }
                SidebarButton { text: "♿ Accessibility"; isActive: activePage === "accessibility"; onClicked: activePage = "accessibility" }
                SidebarButton { text: "💾 Storage & Memory"; isActive: activePage === "storage"; onClicked: activePage = "storage" }

                Item { Layout.preferredHeight: 20 }

                Rectangle {
                    Layout.fillWidth: true
                    height: 1
                    color: "#55FFBD2E"
                }

                SidebarButton { text: "⚠️ KERNEL TUNING"; isActive: activePage === "kernel"; isDanger: true; onClicked: activePage = "kernel" }
                SidebarButton { text: "ℹ️ System Info"; isActive: activePage === "systeminfo"; onClicked: activePage = "systeminfo" }
            }
        }

        // --------------------------------------------------------------------
        // DYNAMIC PAGE LOADER
        // --------------------------------------------------------------------
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true

            ScrollView {
                anchors.fill: parent
                anchors.margins: 40
                contentWidth: availableWidth

                ColumnLayout {
                    width: parent.width
                    spacing: 30

                    // ==================== 1. DISPLAY PAGE ====================
                    ColumnLayout {
                        visible: activePage === "display"
                        width: parent.width
                        spacing: 20

                        Text { text: "Display & DRM Buffer"; color: "white"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }

                        SettingToggle {
                            title: "Hardware HDR (10-bit Color)"
                            description: "Enables raw 10-bit color space directly in the DRM framebuffer."
                            checked: SettingsEngine.hdrEnabled
                            onToggled: SettingsEngine.hdrEnabled = checked
                        }

                        SettingDropdown {
                            title: "DRM Resolution"
                            description: "Kernel-level display scaling."
                            currentValue: SettingsEngine.resolution
                            options: ["1920x1080", "2560x1440", "3840x2160", "5120x2880"]
                            onSelected: SettingsEngine.resolution = value
                        }

                        SettingDropdown {
                            title: "Hardware Refresh Rate"
                            description: "Lock the VSync interval."
                            currentValue: SettingsEngine.refreshRate + " Hz"
                            options: ["60 Hz", "120 Hz", "144 Hz", "240 Hz"]
                            onSelected: SettingsEngine.refreshRate = parseInt(value)
                        }

                        SettingToggle {
                            title: "HDR Auto-Detect"
                            description: "Automatically switch HDR based on content detection."
                            checked: SettingsEngine.hdrAutoDetect
                            onToggled: SettingsEngine.hdrAutoDetect = checked
                        }

                        SettingToggle {
                            title: "Variable Refresh Rate (VRR)"
                            description: "Enable FreeSync/G-Sync compatible VRR."
                            checked: SettingsEngine.vrrEnabled
                            onToggled: SettingsEngine.vrrEnabled = checked
                        }

                        SettingDropdown {
                            title: "Color Space"
                            description: "Select the output color space."
                            currentValue: SettingsEngine.colorSpace
                            options: ["sRGB", "Adobe RGB", "DCI-P3", "Rec. 2020"]
                            onSelected: SettingsEngine.colorSpace = value
                        }

                        SettingToggle {
                            title: "Night Mode"
                            description: "Reduce blue light emission during evening hours."
                            checked: SettingsEngine.nightModeEnabled
                            onToggled: SettingsEngine.nightModeEnabled = checked
                        }

                        SettingSlider {
                            title: "Night Mode Warmth"
                            description: "Adjust the warmth level of night mode."
                            value: SettingsEngine.nightModeWarmth
                            min: 0; max: 100
                            onChanged: SettingsEngine.nightModeWarmth = value
                        }

                        SettingToggle {
                            title: "Auto-Dim Display"
                            description: "Automatically dim the display after inactivity."
                            checked: SettingsEngine.autoDimDisplay
                            onToggled: SettingsEngine.autoDimDisplay = checked
                        }

                        SettingDropdown {
                            title: "Auto-Dim Delay"
                            description: "Time before display dims."
                            currentValue: SettingsEngine.autoDimDelay + " ms"
                            options: ["30000 ms", "60000 ms", "120000 ms", "300000 ms"]
                            onSelected: SettingsEngine.autoDimDelay = parseInt(value.replace(" ms",""))
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 1
                            color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                        }

                        Text { text: "Hardware Mode Support"; color: "#a855f7"; font.pixelSize: 20; font.bold: true }

                        HardwareModeSelector {
                            currentMode: SettingsEngine.hardwareMode
                            onModeSelected: SettingsEngine.hardwareMode = value
                        }
                    }

                    // ==================== 2. NETWORK PAGE ====================
                    ColumnLayout {
                        visible: activePage === "network"
                        width: parent.width
                        spacing: 20

                        Text { text: "Network & Mesh"; color: "white"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }

                        SettingToggle {
                            title: "Enable Wi-Fi 7 Interface"
                            description: "Powers the PCIe network hardware."
                            checked: SettingsEngine.wifiEnabled
                            onToggled: SettingsEngine.wifiEnabled = checked
                        }

                        SettingToggle {
                            title: "Xakteir Global Mesh"
                            description: "Contribute 10% bandwidth to the decentralized OS mesh."
                            checked: SettingsEngine.xakteirMeshEnabled
                            onToggled: SettingsEngine.xakteirMeshEnabled = checked
                        }

                        SettingToggle {
                            title: "VPN Connection"
                            description: "Enable encrypted tunnel for all network traffic."
                            checked: SettingsEngine.vpnEnabled
                            onToggled: SettingsEngine.vpnEnabled = checked
                        }

                        SettingToggle {
                            title: "Firewall Protection"
                            description: "Enable kernel-level packet filtering."
                            checked: SettingsEngine.firewallEnabled
                            onToggled: SettingsEngine.firewallEnabled = checked
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 180
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                Text { text: "Available Networks"; color: "white"; font.bold: true }
                                Text { text: "✓ " + SettingsEngine.currentNetwork; color: "#00FFCC"; font.pixelSize: 16 }
                                Text { text: "   Volt_Corp_Guest_5G"; color: "#AAAAAA"; font.pixelSize: 14 }
                                Text { text: "   Home_WiFi_7"; color: "#AAAAAA"; font.pixelSize: 14 }
                            }
                        }

                        SettingDropdown {
                            title: "DNS Primary"
                            description: "Primary DNS resolver."
                            currentValue: SettingsEngine.dnsPrimary
                            options: ["1.1.1.1", "8.8.8.8", "9.9.9.9", "208.67.222.222"]
                            onSelected: SettingsEngine.dnsPrimary = value
                        }

                        SettingDropdown {
                            title: "DNS Secondary"
                            description: "Fallback DNS resolver."
                            currentValue: SettingsEngine.dnsSecondary
                            options: ["1.0.0.1", "8.8.4.4", "9.9.9.10", "208.67.220.220"]
                            onSelected: SettingsEngine.dnsSecondary = value
                        }

                        SettingSlider {
                            title: "Bandwidth Limit"
                            description: "Throttle network bandwidth (0 = unlimited)."
                            value: SettingsEngine.bandwidthLimit
                            min: 0; max: 1000
                            onChanged: SettingsEngine.bandwidthLimit = value
                        }

                        SettingToggle {
                            title: "Ethernet Auto-Negotiate"
                            description: "Automatically detect Ethernet speed."
                            checked: SettingsEngine.ethernetAutoNeg
                            onToggled: SettingsEngine.ethernetAutoNeg = checked
                        }
                    }

                    // ==================== 3. PRIVACY & SECURITY PAGE ====================
                    ColumnLayout {
                        visible: activePage === "privacy"
                        width: parent.width
                        spacing: 20

                        Text { text: "Privacy & Security"; color: "white"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }

                        Text {
                            text: "Protect your data with VoltraOS security features."
                            color: "#a0a0a0"
                            font.pixelSize: 14
                            wrapMode: Text.WordWrap
                            Layout.fillWidth: true
                        }

                        SettingToggle {
                            title: "Xak Opal Global Indexing"
                            description: "Allows the local AI to read your screen and VFS files to provide contextual help."
                            checked: SettingsEngine.opalIndexingEnabled
                            onToggled: SettingsEngine.opalIndexingEnabled = checked
                        }

                        SettingToggle {
                            title: "Hardware Microphone Mute"
                            description: "Kill power to the ALSA microphone bridge at the kernel level."
                            checked: !SettingsEngine.micAccessEnabled
                            onToggled: SettingsEngine.micAccessEnabled = !checked
                        }

                        SettingToggle {
                            title: "Hardware Camera Block"
                            description: "Kill power to the V4L2 camera bridge at the kernel level."
                            checked: !SettingsEngine.cameraAccessEnabled
                            onToggled: SettingsEngine.cameraAccessEnabled = !checked
                        }

                        SettingToggle {
                            title: "Disk Encryption (AES-256)"
                            description: "Encrypt all stored data with AES-256 hardware encryption."
                            checked: SettingsEngine.diskEncryptionEnabled
                            onToggled: SettingsEngine.diskEncryptionEnabled = checked
                        }

                        SettingToggle {
                            title: "Secure Boot"
                            description: "Verify kernel integrity at every boot."
                            checked: SettingsEngine.secureBootEnabled
                            onToggled: SettingsEngine.secureBootEnabled = checked
                        }

                        SettingToggle {
                            title: "App Privacy Dashboard"
                            description: "Show which apps access which system resources."
                            checked: SettingsEngine.privacyDashboardEnabled
                            onToggled: SettingsEngine.privacyDashboardEnabled = checked
                        }

                        SettingDropdown {
                            title: "Privacy Level"
                            description: "Set the overall privacy enforcement level."
                            currentValue: SettingsEngine.privacyLevel
                            options: ["Minimal", "Standard", "Strict", "Maximum"]
                            onSelected: SettingsEngine.privacyLevel = value
                        }
                    }

                    // ==================== 4. XAK AI SETTINGS PAGE ====================
                    ColumnLayout {
                        visible: activePage === "xakai"
                        width: parent.width
                        spacing: 20

                        Text { text: "Xak Opal AI Configuration"; color: "#a855f7"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }
                        Text {
                            text: "Configure the Xak AI engine behavior and learning parameters."
                            color: "#a0a0a0"
                            font.pixelSize: 14
                            wrapMode: Text.WordWrap
                            Layout.fillWidth: true
                        }

                        SettingToggle {
                            title: "Enable Xak AI"
                            description: "Activate the Xak Opal AI engine on your device."
                            checked: SettingsEngine.xakAIEnabled
                            onToggled: SettingsEngine.xakAIEnabled = checked
                        }

                        SettingToggle {
                            title: "Voice Output"
                            description: "Enable Xak AI to speak responses through the audio system."
                            checked: SettingsEngine.xakVoiceOutput
                            onToggled: SettingsEngine.xakVoiceOutput = checked
                        }

                        SettingDropdown {
                            title: "Response Style"
                            description: "Choose how Xak AI formats its responses."
                            currentValue: SettingsEngine.xakResponseStyle
                            options: ["Professional", "Casual", "Technical", "Friendly"]
                            onSelected: SettingsEngine.xakResponseStyle = value
                        }

                        SettingDropdown {
                            title: "Max Response Length"
                            description: "Maximum character length for AI responses."
                            currentValue: SettingsEngine.xakMaxResponseLength + " chars"
                            options: ["200 chars", "500 chars", "1000 chars", "Unlimited"]
                            onSelected: SettingsEngine.xakMaxResponseLength = parseInt(value)
                        }

                        SettingToggle {
                            title: "Opal Indexing"
                            description: "Index files and screen content for contextual understanding."
                            checked: SettingsEngine.opalIndexingEnabled
                            onToggled: SettingsEngine.opalIndexingEnabled = checked
                        }

                        SettingToggle {
                            title: "Microphone Access"
                            description: "Allow Xak AI to use the microphone for voice commands."
                            checked: SettingsEngine.micAccessEnabled
                            onToggled: SettingsEngine.micAccessEnabled = checked
                        }

                        SettingToggle {
                            title: "Camera Access"
                            description: "Allow Xak AI to use the camera for visual processing."
                            checked: SettingsEngine.cameraAccessEnabled
                            onToggled: SettingsEngine.cameraAccessEnabled = checked
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 120
                            color: "#1A0A2E"
                            radius: 8
                            border.color: "#a855f7"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                Text { text: "Eco-Friendly AI Knowledge Base"; color: "#a855f7"; font.bold: true; font.pixelSize: 18 }
                                Text { text: "The eco-friendly AI learns from Wikipedia-like sources and user-submitted links."; color: "#a0a0a0"; font.pixelSize: 12; wrapMode: Text.WordWrap; Layout.fillWidth: true }
                                RowLayout {
                                    Text { text: "Source:"; color: "#888"; font.pixelSize: 12 }
                                    Text { text: SettingsEngine.ecoAISource; color: "#00FFCC"; font.pixelSize: 12 }
                                    Item { Layout.fillWidth: true }
                                    Text { text: "Sessions:"; color: "#888"; font.pixelSize: 12 }
                                    Text { text: SettingsEngine.ecoAISessions + ""; color: "#00FFCC"; font.pixelSize: 12 }
                                }
                            }
                        }

                        SettingToggle {
                            title: "Enable Eco-AI Learning"
                            description: "Allow the AI to learn from user-submitted links and sources."
                            checked: SettingsEngine.ecoAILearning
                            onToggled: SettingsEngine.ecoAILearning = checked
                        }

                        SettingToggle {
                            title: "Web Cache"
                            description: "Cache web pages for faster AI knowledge retrieval."
                            checked: SettingsEngine.ecoAIWebCache
                            onToggled: SettingsEngine.ecoAIWebCache = checked
                        }

                        SettingToggle {
                            title: "Share Knowledge Base"
                            description: "Share your AI learning data with the VoltraOS community."
                            checked: SettingsEngine.ecoAISharing
                            onToggled: SettingsEngine.ecoAISharing = checked
                        }

                        SettingDropdown {
                            title: "Learning Temperature"
                            description: "Control how creative or factual the AI responses are."
                            currentValue: SettingsEngine.ecoAITemperature
                            options: ["Low", "Medium", "High"]
                            onSelected: SettingsEngine.ecoAITemperature = value
                        }

                        SettingDropdown {
                            title: "Response Format"
                            description: "Format for AI-generated content."
                            currentValue: SettingsEngine.ecoAIResponseFormat
                            options: ["Text", "Bullet Points", "Summary"]
                            onSelected: SettingsEngine.ecoAIResponseFormat = value
                        }
                    }

                    // ==================== 5. ACCESSIBILITY PAGE ====================
                    ColumnLayout {
                        visible: activePage === "accessibility"
                        width: parent.width
                        spacing: 20

                        Text { text: "Accessibility Options"; color: "white"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }

                        SettingToggle {
                            title: "Large Font Size"
                            description: "Increase all text sizes by 20% for better readability."
                            checked: SettingsEngine.fontSizeLarge
                            onToggled: SettingsEngine.fontSizeLarge = checked
                        }

                        SettingToggle {
                            title: "High Contrast Mode"
                            description: "Increase contrast ratios for users with visual impairments."
                            checked: contrastMode === 1
                            onToggled: { if (checked) contrastMode = 1; else contrastMode = 0 }
                        }

                        SettingToggle {
                            title: "Low Contrast Mode"
                            description: "Reduce contrast for users with light sensitivity."
                            checked: contrastMode === 2
                            onToggled: { if (checked) contrastMode = 2; else contrastMode = 0 }
                        }

                        SettingToggle {
                            title: "Screen Reader"
                            description: "Enable text-to-speech narration of on-screen elements."
                            checked: SettingsEngine.screenReaderEnabled
                            onToggled: SettingsEngine.screenReaderEnabled = checked
                        }

                        SettingToggle {
                            title: "Keyboard Navigation Mode"
                            description: "Enable full keyboard navigation without mouse dependency."
                            checked: SettingsEngine.keyboardNavMode
                            onToggled: SettingsEngine.keyboardNavMode = checked
                        }

                        SettingSlider {
                            title: "Animation Speed"
                            description: "Control the speed of all UI animations."
                            value: SettingsEngine.animationSpeed
                            min: 0.0; max: 3.0
                            onChanged: SettingsEngine.animationSpeed = value
                        }

                        SettingToggle {
                            title: "Font Smoothing"
                            description: "Enable sub-pixel font rendering for clearer text."
                            checked: SettingsEngine.fontSmoothing
                            onToggled: SettingsEngine.fontSmoothing = checked
                        }

                        SettingToggle {
                            title: "DPI Scaling"
                            description: "Automatically scale UI elements for high-DPI displays."
                            checked: SettingsEngine.dpiScaling
                            onToggled: SettingsEngine.dpiScaling = checked
                        }

                        SettingSlider {
                            title: "DPI Scale Factor"
                            description: "Manual DPI scaling multiplier."
                            value: SettingsEngine.dpiScaleFactor
                            min: 0.5; max: 3.0
                            onChanged: SettingsEngine.dpiScaleFactor = value
                        }

                        SettingToggle {
                            title: "Color Blind Mode"
                            description: "Apply color filters to assist color vision deficiencies."
                            checked: SettingsEngine.colorBlindMode
                            onToggled: SettingsEngine.colorBlindMode = checked
                        }

                        SettingDropdown {
                            title: "Color Blind Type"
                            description: "Select the type of color vision deficiency to accommodate."
                            currentValue: colorBlindType === 0 ? "None" : (colorBlindType === 1 ? "Deuteranopia" : "Protanopia")
                            options: ["None", "Deuteranopia", "Protanopia", "Tritanopia"]
                            onSelected: {
                                var types = ["None", "Deuteranopia", "Protanopia", "Tritanopia"]
                                colorBlindType = types.indexOf(value)
                                SettingsEngine.colorBlindType = colorBlindType
                            }
                        }

                        SettingToggle {
                            title: "Touch Pressure Sensitivity"
                            description: "Enable pressure-sensitive input for stylus and touch devices."
                            checked: SettingsEngine.touchPressureSensitive
                            onToggled: SettingsEngine.touchPressureSensitive = checked
                        }

                        SettingToggle {
                            title: "Palm Rejection"
                            description: "Ignore palm touches when using a stylus."
                            checked: SettingsEngine.palmRejectionEnabled
                            onToggled: SettingsEngine.palmRejectionEnabled = checked
                        }
                    }

                    // ==================== 6. STORAGE & MEMORY PAGE ====================
                    ColumnLayout {
                        visible: activePage === "storage"
                        width: parent.width
                        spacing: 20

                        Text { text: "Storage & Memory Management"; color: "white"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }

                        // Storage Overview
                        Rectangle {
                            Layout.fillWidth: true
                            height: 150
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                spacing: 10

                                RowLayout {
                                    Text { text: "Storage Used:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: storageUsed + " GB"; color: "white"; font.pixelSize: 16; font.bold: true }
                                    Item { Layout.fillWidth: true }
                                    Text { text: storageTotal + " GB Total"; color: "#a0a0a0"; font.pixelSize: 16 }
                                }

                                Rectangle {
                                    Layout.fillWidth: true
                                    height: 10
                                    radius: 5
                                    color: "#222222"

                                    Rectangle {
                                        width: (storageUsed / storageTotal) * parent.width
                                        height: parent.height
                                        radius: 5
                                        gradient: Gradient {
                                            GradientStop { position: 0.0; color: "#00FFCC" }
                                            GradientStop { position: 1.0; color: "#00AA88" }
                                        }
                                        Behavior on width { NumberAnimation { duration: 500 } }
                                    }
                                }

                                Text { text: (storageUsed / storageTotal * 100).toFixed(1) + "% Used"; color: "#a0a0a0"; font.pixelSize: 14 }
                            }
                        }

                        // Memory Overview
                        Rectangle {
                            Layout.fillWidth: true
                            height: 150
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                spacing: 10

                                RowLayout {
                                    Text { text: "RAM Used:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: ramUsage + "%"; color: "white"; font.pixelSize: 16; font.bold: true }
                                    Item { Layout.fillWidth: true }
                                    Text { text: "CPU: " + cpuTemp; color: "#a0a0a0"; font.pixelSize: 16 }
                                }

                                Rectangle {
                                    Layout.fillWidth: true
                                    height: 10
                                    radius: 5
                                    color: "#222222"

                                    Rectangle {
                                        width: ramUsage / 100 * parent.width
                                        height: parent.height
                                        radius: 5
                                        gradient: Gradient {
                                            GradientStop { position: 0.0; color: "#3b82f6" }
                                            GradientStop { position: 1.0; color: "#1d4ed8" }
                                        }
                                        Behavior on width { NumberAnimation { duration: 500 } }
                                    }
                                }
                            }
                        }

                        // Uptime
                        Rectangle {
                            Layout.fillWidth: true
                            height: 80
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                Text { text: "⏱ System Uptime:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                Text { text: Math.floor(uptimeSeconds / 3600) + "h " + Math.floor((uptimeSeconds % 3600) / 60) + "m"; color: "white"; font.pixelSize: 16 }
                                Item { Layout.fillWidth: true }
                                Text { text: "Kernel: " + kernelVersion.split(" ")[0]; color: "#a0a0a0"; font.pixelSize: 12 }
                            }
                        }

                        SettingToggle {
                            title: "Clear Cache on Boot"
                            description: "Automatically clear temporary cache files on every system startup."
                            checked: SettingsEngine.clearCacheOnBoot
                            onToggled: SettingsEngine.clearCacheOnBoot = checked
                        }

                        SettingToggle {
                            title: "Compress Memory Pages"
                            description: "Compress inactive memory pages to free up RAM."
                            checked: SettingsEngine.compressMemory
                            onToggled: SettingsEngine.compressMemory = checked
                        }

                        SettingToggle {
                            title: "Swap File Optimization"
                            description: "Use optimized swap file management for better performance."
                            checked: SettingsEngine.swapOptimization
                            onToggled: SettingsEngine.swapOptimization = checked
                        }

                        SettingDropdown {
                            title: "I/O Scheduler"
                            description: "Select the block I/O scheduling algorithm."
                            currentValue: SettingsEngine.ioScheduler
                            options: ["cfq", "deadline", "noop", "mq-deadline", "bfq"]
                            onSelected: SettingsEngine.ioScheduler = value
                        }
                    }

                    // ==================== 7. SYSTEM INFO PAGE ====================
                    ColumnLayout {
                        visible: activePage === "systeminfo"
                        width: parent.width
                        spacing: 20

                        Text { text: "System Information"; color: "white"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }

                        // System Overview Card
                        Rectangle {
                            Layout.fillWidth: true
                            height: 180
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                spacing: 10

                                RowLayout {
                                    Text { text: "OS:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: "VoltraOS 1.0.0"; color: "white"; font.pixelSize: 16; font.bold: true }
                                    Item { Layout.fillWidth: true }
                                    Text { text: "Kernel:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: kernelVersion; color: "#00FFCC"; font.pixelSize: 12 }
                                }

                                RowLayout {
                                    Text { text: "Architecture:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: "x86_64"; color: "white"; font.pixelSize: 16 }
                                    Item { Layout.fillWidth: true }
                                    Text { text: "Build:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: "Release 1.0.0"; color: "#a0a0a0"; font.pixelSize: 12 }
                                }

                                RowLayout {
                                    Text { text: "Uptime:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: Math.floor(uptimeSeconds / 86400) + "d " + Math.floor((uptimeSeconds % 86400) / 3600) + "h"; color: "white"; font.pixelSize: 16 }
                                    Item { Layout.fillWidth: true }
                                    Text { text: "Users:"; color: "#a0a0a0"; font.pixelSize: 16 }
                                    Text { text: "2"; color: "white"; font.pixelSize: 16 }
                                }
                            }
                        }

                        // Hardware Details
                        Rectangle {
                            Layout.fillWidth: true
                            height: 150
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                spacing: 8

                                Text { text: "Hardware Specifications"; color: "#a0a0a0"; font.bold: true; font.pixelSize: 14 }
                                Text { text: "CPU: VoltraCore X1 @ 3.2GHz"; color: "#d0d0d0"; font.pixelSize: 14 }
                                Text { text: "GPU: VoltraGPU V1 Integrated"; color: "#d0d0d0"; font.pixelSize: 14 }
                                Text { text: "RAM: 16GB LPDDR5"; color: "#d0d0d0"; font.pixelSize: 14 }
                                Text { text: "Storage: 512GB NVMe SSD"; color: "#d0d0d0"; font.pixelSize: 14 }
                                Text { text: "Display: 1920x1080 AMOLED 120Hz"; color: "#d0d0d0"; font.pixelSize: 14 }
                                Text { text: "Battery: 8500mAh"; color: "#d0d0d0"; font.pixelSize: 14 }
                            }
                        }

                        // Kernel Modules
                        Rectangle {
                            Layout.fillWidth: true
                            height: 150
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                spacing: 8

                                Text { text: "Loaded Kernel Modules"; color: "#a0a0a0"; font.bold: true; font.pixelSize: 14 }
                                Text { text: "sound_init ✓"; color: "#00FFCC"; font.pixelSize: 14 }
                                Text { text: "file_manager_init ✓"; color: "#00FFCC"; font.pixelSize: 14 }
                                Text { text: "net_stack_init ✓"; color: "#00FFCC"; font.pixelSize: 14 }
                                Text { text: "vfs_mount ✓"; color: "#00FFCC"; font.pixelSize: 14 }
                                Text { text: "device_manager ✓"; color: "#00FFCC"; font.pixelSize: 14 }
                            }
                        }

                        // Linux Compatibility
                        Rectangle {
                            Layout.fillWidth: true
                            height: 120
                            color: "#0A1A0A"
                            radius: 8
                            border.color: "#00FF66"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                Text { text: "Linux Compatibility Mode"; color: "#00FF66"; font.bold: true; font.pixelSize: 18 }
                                Text { text: "Distro: " + SettingsEngine.linuxDistro; color: "#a0a0a0"; font.pixelSize: 14 }
                                Text { text: "Version: " + SettingsEngine.linuxVersion; color: "#a0a0a0"; font.pixelSize: 14 }
                                Text { text: "Package Manager: " + SettingsEngine.linuxPackageManager; color: "#a0a0a0"; font.pixelSize: 14 }
                            }
                        }
                    }

                    // ==================== 8. KERNEL TUNING (VAULT) ====================
                    ColumnLayout {
                        visible: activePage === "kernel"
                        width: parent.width
                        spacing: 20

                        Text { text: "⚠️ RING 0 KERNEL TUNING"; color: "#FFBD2E"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }
                        Text {
                            text: "WARNING: Modifying these parameters alters the fundamental behavior of the C Kernel. System instability may occur."
                            color: "white"
                            font.pixelSize: 14
                            wrapMode: Text.WordWrap
                            Layout.fillWidth: true
                        }

                        SettingDropdown {
                            title: "CFS CPU Scheduler Strategy"
                            description: "Determines how the kernel allocates thread time slices."
                            currentValue: SettingsEngine.cpuScheduler
                            options: ["power_save", "balanced", "voltra_performance", "realtime_raw"]
                            isDanger: true
                            onSelected: SettingsEngine.cpuScheduler = value
                        }

                        SettingToggle {
                            title: "SMT / HyperThreading"
                            description: "Toggle logical core execution. Disabling increases security but lowers parallel performance."
                            checked: SettingsEngine.hyperThreadingEnabled
                            isDanger: true
                            onToggled: SettingsEngine.hyperThreadingEnabled = checked
                        }

                        Item { Layout.preferredHeight: 30 }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 60
                            color: "#AAFF0000"
                            radius: 8
                            border.color: "#FF0000"

                            Text {
                                anchors.centerIn: parent
                                text: "INITIATE FACTORY SYSTEM WIPE"
                                color: "white"
                                font.pixelSize: 18
                                font.bold: true
                            }
                            MouseArea {
                                anchors.fill: parent
                                onClicked: SettingsEngine.factoryReset()
                            }
                        }

                        // Kernel Version Info
                        Rectangle {
                            Layout.fillWidth: true
                            height: 80
                            color: "#111111"
                            radius: 8
                            border.color: "#FFBD2E"

                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                Text { text: "Kernel Version:"; color: "#FFBD2E"; font.pixelSize: 16 }
                                Text { text: kernelVersion; color: "white"; font.pixelSize: 16 }
                                Item { Layout.fillWidth: true }
                                Text { text: "Build Date:"; color: "#FFBD2E"; font.pixelSize: 16 }
                                Text { text: "2026-09-28"; color: "white"; font.pixelSize: 16 }
                            }
                        }
                    }
                }
            }
        }
    }

    // --------------------------------------------------------------------
    // REUSABLE COMPONENTS
    // --------------------------------------------------------------------
    component SidebarButton: Rectangle {
        property string text: ""
        property bool isActive: false
        property bool isDanger: false
        signal clicked()

        Layout.fillWidth: true
        height: 50
        color: isActive ? (isDanger ? "#55FFBD2E" : "#33FFFFFF") : "transparent"

        Text {
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: parent.left
            anchors.leftMargin: 20
            text: parent.text
            color: parent.isDanger ? "#FFBD2E" : "white"
            font.pixelSize: 16
            font.bold: parent.isActive || parent.isDanger
        }

        MouseArea {
            anchors.fill: parent
            onClicked: parent.clicked()
        }
    }

    component SettingToggle: Rectangle {
        property string title: ""
        property string description: ""
        property bool checked: false
        property bool isDanger: false
        signal toggled(bool checked)

        Layout.fillWidth: true
        height: 80
        color: isDanger ? "#11FFBD2E" : "#11FFFFFF"
        radius: 8
        border.color: isDanger ? "#55FFBD2E" : "#33FFFFFF"

        RowLayout {
            anchors.fill: parent
            anchors.margins: 15

            ColumnLayout {
                Layout.fillWidth: true
                Text { text: parent.parent.title; color: parent.parent.isDanger ? "#FFBD2E" : "white"; font.pixelSize: 18; font.bold: true }
                Text { text: parent.parent.description; color: "#AAAAAA"; font.pixelSize: 12; wrapMode: Text.WordWrap; Layout.fillWidth: true }
            }

            Rectangle {
                width: 60; height: 30; radius: 15
                color: parent.parent.checked ? (parent.parent.isDanger ? "#FFBD2E" : "#00FFCC") : "#444"

                Rectangle {
                    width: 26; height: 26; radius: 13
                    anchors.verticalCenter: parent.verticalCenter
                    x: parent.parent.checked ? 32 : 2
                    color: "white"
                    Behavior on x { NumberAnimation { duration: 150 } }
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: parent.parent.toggled(!parent.parent.checked)
                }
            }
        }
    }

    component SettingDropdown: Rectangle {
        property string title: ""
        property string description: ""
        property string currentValue: ""
        property var options: []
        property bool isDanger: false
        signal selected(string value)

        Layout.fillWidth: true
        height: 80
        color: isDanger ? "#11FFBD2E" : "#11FFFFFF"
        radius: 8
        border.color: isDanger ? "#55FFBD2E" : "#33FFFFFF"

        RowLayout {
            anchors.fill: parent
            anchors.margins: 15

            ColumnLayout {
                Layout.fillWidth: true
                Text { text: parent.parent.title; color: parent.parent.isDanger ? "#FFBD2E" : "white"; font.pixelSize: 18; font.bold: true }
                Text { text: parent.parent.description; color: "#AAAAAA"; font.pixelSize: 12; wrapMode: Text.WordWrap; Layout.fillWidth: true }
            }

            Rectangle {
                Layout.preferredWidth: 200
                Layout.preferredHeight: 40
                color: "#222"
                radius: 4
                border.color: "#555"

                Text {
                    anchors.centerIn: parent
                    text: parent.parent.currentValue + "  ▼"
                    color: "white"
                    font.pixelSize: 14
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        var idx = parent.parent.options.indexOf(parent.parent.currentValue);
                        idx = (idx + 1) % parent.parent.options.length;
                        parent.parent.selected(parent.parent.options[idx]);
                    }
                }
            }
        }
    }

    component SettingSlider: Rectangle {
        property string title: ""
        property string description: ""
        property real value: 0.0
        property real min: 0.0
        property real max: 100.0
        signal changed(real value)

        Layout.fillWidth: true
        height: 80
        color: "#11FFFFFF"
        radius: 8
        border.color: "#33FFFFFF"

        RowLayout {
            anchors.fill: parent
            anchors.margins: 15

            ColumnLayout {
                Layout.fillWidth: true
                spacing: 5
                Text { text: parent.parent.title; color: "white"; font.pixelSize: 18; font.bold: true }
                Text { text: parent.parent.description; color: "#AAAAAA"; font.pixelSize: 12; wrapMode: Text.WordWrap; Layout.fillWidth: true }
            }

            ColumnLayout {
                spacing: 5
                Text { text: Math.round(parent.parent.value) + "%"; color: "#a855f7"; font.pixelSize: 16; font.bold: true }
                Slider {
                    from: parent.parent.min
                    to: parent.parent.max
                    value: parent.parent.value
                    onValueChanged: parent.parent.changed(value)
                }
            }
        }
    }

    component HardwareModeSelector: Rectangle {
        property string currentMode: "normal"
        signal modeSelected(string mode)

        Layout.fillWidth: true
        height: 120
        color: "#11FFFFFF"
        radius: 8
        border.color: "#33FFFFFF"

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 10

            Text { text: "Select Hardware Mode"; color: "white"; font.bold: true; font.pixelSize: 18 }

            RowLayout {
                spacing: 10
                Repeater {
                    model: ["Normal", "Stylus", "TV", "Tablet", "2-Tablet"]
                    delegate: Rectangle {
                        width: 100; height: 40; radius: 8
                        color: currentMode === modelData.toLowerCase() ? "#a855f7" : "#222"
                        Text {
                            text: modelData
                            anchors.centerIn: parent
                            color: "white"
                            font.pixelSize: 12
                            font.bold: currentMode === modelData.toLowerCase()
                        }
                        MouseArea {
                            anchors.fill: parent
                            onClicked: modeSelected(modelData.toLowerCase())
                        }
                    }
                }
            }

            Text { text: "Current: " + currentMode.toUpperCase(); color: "#a855f7"; font.pixelSize: 14 }
        }
    }
}
