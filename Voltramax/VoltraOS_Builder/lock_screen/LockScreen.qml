import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Window {
    id: lockScreen
    width: 1920
    height: 1080
    visible: true
    visibility: Window.FullScreen
    
    // Transparent background exposes the Vulkan Weather Wallpaper underneath
    color: "transparent" 

    // --- XAK AI EDGE GLOW (Hidden by default, Restricted Mode) ---
    Rectangle {
        id: xakAIGlow
        anchors.fill: parent
        color: "transparent"
        border.color: "#3b82f6" // Default Blue for listening
        border.width: 0
        opacity: 0.8
        
        Behavior on border.color { ColorAnimation { duration: 500 } }
        Behavior on border.width { NumberAnimation { duration: 300; easing.type: Easing.OutBack } }
    }
    
    // Hidden status text for Xak AI
    Text {
        id: xakAIStatus
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: 20
        text: "Xak AI: Restricted Lock Screen Mode"
        font.family: "Inter"
        font.pixelSize: 18
        color: "#3b82f6"
        opacity: 0
        Behavior on opacity { NumberAnimation { duration: 300 } }
    }

    // --- CENTER CLOCK & WEATHER ---
    ColumnLayout {
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -100
        spacing: -20
        
        Text {
            text: Qt.formatTime(new Date(), "hh:mm")
            font.family: "Syne"
            font.pixelSize: 250 
            font.weight: Font.Black
            color: "white"
            Layout.alignment: Qt.AlignHCenter
            layer.enabled: true // Drop shadow for readability
        }

        Text {
            text: Qt.formatDate(new Date(), "dddd, MMMM d") + "  |  14°C  🌧️"
            font.family: "Inter"
            font.pixelSize: 32
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }
    }

    // --- NON-WINDOWS USER SWITCHER (Bottom Left) ---
    RowLayout {
        anchors.left: parent.left
        anchors.bottom: parent.bottom
        anchors.margins: 50
        spacing: 20

        // Main User
        Rectangle {
            width: 70; height: 70; radius: 35
            color: Qt.rgba(138/255, 43/255, 226/255, 0.8) // Xakteir Purple
            border.color: "white"; border.width: 3
            Text { anchors.centerIn: parent; text: "👤"; font.pixelSize: 32 }
        }
        
        // Child User
        Rectangle {
            width: 50; height: 50; radius: 25
            color: Qt.rgba(255/255, 255/255, 255/255, 0.2)
            border.color: "transparent"; border.width: 2
            Text { anchors.centerIn: parent; text: "🧸"; font.pixelSize: 24 }
            
            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                onEntered: parent.border.color = "white"
                onExited: parent.border.color = "transparent"
            }
        }
    }

    // --- BIOMETRICS & AUTHENTICATION (Bottom Center) ---
    ColumnLayout {
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 80
        spacing: 15

        // Face Unlock Scanning Indicator
        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 10
            
            Text { text: "👁️"; font.pixelSize: 24 }
            Text { 
                text: "Scanning Face..."
                font.family: "Inter"
                font.pixelSize: 18
                color: "white"
                opacity: 0.8
            }
        }

        // Password / PIN Field
        TextField {
            width: 350; height: 60
            Layout.preferredWidth: 350
            Layout.preferredHeight: 60
            placeholderText: "Password or PIN"
            echoMode: TextInput.Password
            horizontalAlignment: TextInput.AlignHCenter
            color: "white"
            font.pixelSize: 24
            font.family: "Inter"
            
            background: Rectangle {
                color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.color: parent.activeFocus ? "#a855f7" : Qt.rgba(255/255, 255/255, 255/255, 0.3)
                radius: 15
            }
        }
        
        // Fingerprint Indicator
        Text { 
            text: "👆 Or use Fingerprint"
            font.family: "Inter"
            font.pixelSize: 16
            color: "#a0a0a0"
            Layout.alignment: Qt.AlignHCenter
        }
    }

    // --- MINI MEDIA PLAYER (Bottom Right) ---
    Rectangle {
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.margins: 50
        width: 300
        height: 100
        radius: 20
        color: Qt.rgba(0, 0, 0, 0.5)
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
        
        RowLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 15
            
            // Album Art
            Rectangle {
                width: 70; height: 70; radius: 10
                color: "#a855f7"
                Text { anchors.centerIn: parent; text: "🎵"; font.pixelSize: 32 }
            }
            
            ColumnLayout {
                spacing: 5
                Text { text: "Voltra Soundtrack"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 16 }
                Text { text: "Xakteir Studios"; color: "#a0a0a0"; font.family: "Inter"; font.pixelSize: 12 }
            }
        }
    }

    // --- DEBUG: Simulate Xak AI Wake Word ---
    MouseArea {
        anchors.top: parent.top
        anchors.right: parent.right
        width: 200; height: 50
        onClicked: {
            // Simulates someone saying "Hey Xak" while locked
            xakAIGlow.border.width = 15
            xakAIGlow.border.color = "#3b82f6" // Blue
            xakAIStatus.opacity = 1
        }
        Text { anchors.centerIn: parent; text: "[SIMULATE 'HEY XAK']"; color: "white" }
    }
}
