import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: settingsRoot
    anchors.fill: parent

    // UI State
    property string activePage: "display" // 'display', 'network', 'privacy', 'kernel'
    property bool isKernelVaultMode: activePage === "kernel"

    // Background Layer (Dynamically shifts for Vault Aesthetic)
    Rectangle {
        id: bg
        anchors.fill: parent
        color: isKernelVaultMode ? "#0F0F0F" : "#0A0D14"
        
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
                    color: "#FFBD2E" // Industrial Yellow
                    rotation: -10
                    transformOrigin: Item.Center
                }
            }
        }
    }

    // Top Search Bar
    Rectangle {
        id: searchHeader
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 70
        color: isKernelVaultMode ? "#222222" : "#11FFFFFF"
        border.color: isKernelVaultMode ? "#FFBD2E" : "#22FFFFFF"
        border.width: 1

        Behavior on color { ColorAnimation { duration: 400 } }
        Behavior on border.color { ColorAnimation { duration: 400 } }

        RowLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 15

            Text { 
                text: "⚙️"
                font.pixelSize: 24 
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
            color: isKernelVaultMode ? "#111111" : "#05FFFFFF"
            border.color: isKernelVaultMode ? "#FFBD2E" : "#22FFFFFF"
            border.width: 1

            Behavior on color { ColorAnimation { duration: 400 } }

            ColumnLayout {
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.topMargin: 20
                spacing: 5

                SidebarButton { 
                    text: "🖥️ Display & DRM"; 
                    isActive: activePage === "display"; 
                    onClicked: activePage = "display" 
                }
                SidebarButton { 
                    text: "🌐 Network & Mesh"; 
                    isActive: activePage === "network"; 
                    onClicked: activePage = "network" 
                }
                SidebarButton { 
                    text: "🛡️ Privacy & Xak AI"; 
                    isActive: activePage === "privacy"; 
                    onClicked: activePage = "privacy" 
                }
                
                // Danger Zone Spacer
                Item { Layout.preferredHeight: 30 }
                
                Rectangle {
                    Layout.fillWidth: true
                    height: 1
                    color: "#55FFBD2E"
                }

                SidebarButton { 
                    text: "⚠️ KERNEL TUNING"; 
                    isActive: activePage === "kernel"; 
                    isDanger: true
                    onClicked: activePage = "kernel" 
                }
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

                    // 1. DISPLAY PAGE
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
                            options: ["60 Hz", "120 Hz", "144 Hz"]
                            onSelected: SettingsEngine.refreshRate = parseInt(value)
                        }
                    }

                    // 2. NETWORK PAGE
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

                        Rectangle {
                            Layout.fillWidth: true
                            height: 150
                            color: "#11FFFFFF"
                            radius: 8
                            border.color: "#33FFFFFF"

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 15
                                Text { text: "Available Networks"; color: "white"; font.bold: true }
                                // In a real app, this would use a Repeater bound to SettingsEngine.getAvailableNetworks()
                                Text { text: "✓ " + SettingsEngine.currentNetwork; color: "#00FFCC"; font.pixelSize: 16 }
                                Text { text: "   Volt_Corp_Guest_5G"; color: "#AAAAAA"; font.pixelSize: 16 }
                                Text { text: "   Home_WiFi_7"; color: "#AAAAAA"; font.pixelSize: 16 }
                            }
                        }
                    }

                    // 3. PRIVACY & AI PAGE
                    ColumnLayout {
                        visible: activePage === "privacy"
                        width: parent.width
                        spacing: 20

                        Text { text: "Privacy & Xak AI"; color: "white"; font.pixelSize: 28; font.family: "Syne"; font.bold: true }
                        
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
                    }

                    // 4. KERNEL TUNING (THE VAULT)
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
                            description: "Toggle logical core execution. Disabling increases security against speculative execution attacks but lowers massive parallel performance."
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
                        // Simulate simple cycle click for massive mock scale without needing heavy ComboBox code
                        var idx = parent.parent.options.indexOf(parent.parent.currentValue);
                        idx = (idx + 1) % parent.parent.options.length;
                        parent.parent.selected(parent.parent.options[idx]);
                    }
                }
            }
        }
    }
}
