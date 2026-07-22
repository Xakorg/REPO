import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

Window {
    id: weatherWindow
    width: 1200
    height: 800
    visible: true
    title: "Voltra Weather"
    color: "#0B1D3A" // Deep atmospheric blue
    flags: Qt.Window | Qt.FramelessWindowHint

    // Close Button
    Rectangle {
        anchors.top: parent.top; anchors.left: parent.left; anchors.margins: 20; z: 100
        width: 16; height: 16; radius: 8; color: "#FF5F56"
        MouseArea { anchors.fill: parent; onClicked: weatherWindow.close() }
    }

    // Interactive Drag Area
    MouseArea {
        anchors.fill: parent
        property point startPos: Qt.point(0, 0)
        onPressed: startPos = Qt.point(mouse.x, mouse.y)
        onPositionChanged: {
            if (pressed) {
                weatherWindow.x += mouse.x - startPos.x
                weatherWindow.y += mouse.y - startPos.y
            }
        }
    }

    // ---------------------------------------------------------
    // 3D Environment Background (Simulated via Gradients)
    // ---------------------------------------------------------
    
    // Atmospheric Glow
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0B1D3A" }
            GradientStop { position: 0.5; color: "#1A365D" }
            GradientStop { position: 1.0; color: "#2B6CB0" }
        }
    }

    // Simulated 3D Globe Silhouette
    Rectangle {
        anchors.bottom: parent.bottom
        anchors.bottomMargin: -600
        anchors.horizontalCenter: parent.horizontalCenter
        width: 1400; height: 1400; radius: 700
        color: "transparent"
        border.color: "#22FFFFFF"
        border.width: 1
        
        // Globe Atmosphere Glow
        Rectangle {
            anchors.fill: parent; radius: 700
            gradient: RadialGradient {
                gradient: Gradient {
                    GradientStop { position: 0.8; color: "transparent" }
                    GradientStop { position: 1.0; color: "#8863B3ED" } // Cyan edge glow
                }
            }
        }
    }

    // ---------------------------------------------------------
    // Main UI Data
    // ---------------------------------------------------------

    ColumnLayout {
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.margins: 60
        spacing: 5
        
        Text { text: "San Francisco, CA"; color: "white"; font.family: "Inter"; font.pixelSize: 24; font.bold: true }
        Text { text: "14°"; color: "white"; font.family: "Inter"; font.pixelSize: 140; font.weight: Font.Thin }
        Text { text: "Cloudy with scattered showers."; color: "#A0AEC0"; font.family: "Inter"; font.pixelSize: 18 }
        
        Item { height: 40 } // Spacer
        
        // Metrics
        RowLayout {
            spacing: 40
            ColumnLayout { Text { text: "Humidity"; color: "#A0AEC0"; font.pixelSize: 12 }; Text { text: "82%"; color: "white"; font.pixelSize: 20; font.bold: true } }
            ColumnLayout { Text { text: "Wind"; color: "#A0AEC0"; font.pixelSize: 12 }; Text { text: "12 mph NW"; color: "white"; font.pixelSize: 20; font.bold: true } }
            ColumnLayout { Text { text: "Visibility"; color: "#A0AEC0"; font.pixelSize: 12 }; Text { text: "6 mi"; color: "white"; font.pixelSize: 20; font.bold: true } }
        }
    }

    // Right Sidebar (7-Day Forecast)
    Rectangle {
        anchors.right: parent.right
        anchors.top: parent.top
        anchors.bottom: parent.bottom
        width: 350
        color: Qt.rgba(0, 0, 0, 0.4) // Glassmorphic blur
        
        ColumnLayout {
            anchors.fill: parent; anchors.margins: 30; spacing: 25
            Text { text: "7-Day Forecast"; color: "white"; font.family: "Inter"; font.pixelSize: 18; font.bold: true }
            Rectangle { height: 1; Layout.fillWidth: true; color: "#22FFFFFF" }
            
            Repeater {
                model: [
                    { day: "Today", icon: "☁️", high: "15°", low: "9°" },
                    { day: "Tue", icon: "🌧️", high: "13°", low: "8°" },
                    { day: "Wed", icon: "☀️", high: "18°", low: "10°" },
                    { day: "Thu", icon: "⛅", high: "16°", low: "9°" },
                    { day: "Fri", icon: "☀️", high: "19°", low: "11°" },
                    { day: "Sat", icon: "☀️", high: "22°", low: "13°" },
                    { day: "Sun", icon: "☁️", high: "17°", low: "10°" }
                ]
                RowLayout {
                    Layout.fillWidth: true
                    Text { text: modelData.day; color: "white"; font.family: "Inter"; font.pixelSize: 16; Layout.preferredWidth: 60 }
                    Text { text: modelData.icon; font.pixelSize: 24; Layout.alignment: Qt.AlignHCenter }
                    Item { Layout.fillWidth: true }
                    Text { text: modelData.high; color: "white"; font.family: "Inter"; font.pixelSize: 16; font.bold: true }
                    Text { text: modelData.low; color: "#A0AEC0"; font.family: "Inter"; font.pixelSize: 16 }
                }
            }
            Item { Layout.fillHeight: true }
        }
    }
}
