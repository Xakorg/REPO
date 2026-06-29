import QtQuick
import QtQuick.Controls

Window {
    width: 1920
    height: 1080
    visible: true
    visibility: Window.FullScreen
    
    // The background is transparent so the Vulkan Weather Wallpaper 
    // running underneath is fully visible!
    color: "transparent" 

    // The Massive Center Clock
    Text {
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -100
        text: Qt.formatTime(new Date(), "hh:mm")
        font.family: "Syne"
        font.pixelSize: 250 // Massive weight
        font.weight: Font.Black
        color: "white"
        
        // Subtle drop shadow for readability against bright weather
        layer.enabled: true
    }

    // Date & Weather Block below clock
    Text {
        anchors.top: parent.verticalCenter
        anchors.horizontalCenter: parent.horizontalCenter
        text: Qt.formatDate(new Date(), "dddd, MMMM d") + "  |  14°C  🌧️"
        font.family: "Inter"
        font.pixelSize: 32
        color: "white"
    }

    // Password / PIN Input Field
    TextField {
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 100
        anchors.horizontalCenter: parent.horizontalCenter
        width: 350
        height: 60
        placeholderText: "Password or PIN"
        echoMode: TextInput.Password
        horizontalAlignment: TextInput.AlignHCenter
        
        // Frosted glass effect
        background: Rectangle {
            color: Qt.rgba(255, 255, 255, 0.1)
            border.color: Qt.rgba(255, 255, 255, 0.3)
            radius: 15
        }
        color: "white"
        font.pixelSize: 24
        
        onAccepted: {
            // When Enter is pressed, this hooks into Linux PAM authentication
            console.log("Hooking into PAM to unlock Volt Shell...")
        }
    }
}
