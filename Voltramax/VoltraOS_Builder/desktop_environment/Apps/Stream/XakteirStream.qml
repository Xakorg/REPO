import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: streamRoot
    anchors.fill: parent

    // Deep immersive background
    Rectangle {
        id: bg
        anchors.fill: parent
        color: "#05050A" // Absolute deep space black/purple
        
        // Liquid Aura Background Glow
        RadialGradient {
            anchors.fill: parent
            gradient: Gradient {
                GradientStop { position: 0.0; color: "#1A0033" }
                GradientStop { position: 1.0; color: "#000000" }
            }
        }
    }

    // Simulated 4K Video Surface
    Rectangle {
        id: videoSurface
        anchors.centerIn: parent
        width: parent.width * 0.8
        height: parent.height * 0.6
        color: "black"
        border.color: "#33FFFFFF"
        border.width: 1
        radius: 12
        clip: true
        visible: XakteirStreamEngine.isPlaying

        Text {
            anchors.centerIn: parent
            text: "DRM Hardware Decode Surface\n(Kernel Direct Memory Access)"
            color: "#66FFFFFF"
            font.pixelSize: 20
            horizontalAlignment: Text.AlignHCenter
        }
    }

    // Liquid Aura Audio Visualizer (Option B)
    Row {
        id: visualizerRow
        anchors.bottom: bottomBar.top
        anchors.bottomMargin: 20
        anchors.horizontalCenter: parent.horizontalCenter
        height: 100
        spacing: 4

        Repeater {
            id: fftRepeater
            model: 32 // 32 frequency bands

            Rectangle {
                width: 12
                // Height is driven dynamically by the C++ Engine FFT Signal!
                height: 5
                radius: 6
                color: {
                    // Gradient from Purple to Blue to Cyan
                    var ratio = index / 32.0;
                    return Qt.rgba(0.5 + ratio * 0.5, 0.2 + ratio * 0.8, 1.0, 0.8);
                }
                
                Behavior on height {
                    NumberAnimation { duration: 50; easing.type: Easing.OutQuad } // ultra-smooth 60fps interpolation
                }
            }
        }
    }

    // Connections to the C++ Backend
    Connections {
        target: XakteirStreamEngine
        function onAudioFftDataReady(bands) {
            // Update the height of every single bar in the visualizer based on the C++ math
            for (var i = 0; i < 32; i++) {
                var val = bands[i];
                var newHeight = Math.max(5, val * 80); // scale up
                if (fftRepeater.itemAt(i)) {
                    fftRepeater.itemAt(i).height = newHeight;
                }
            }
        }
    }

    // Bottom Control Bar
    Rectangle {
        id: bottomBar
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 90
        color: "#AA0A0A10" // Glassmorphic translucent
        
        layer.enabled: true
        layer.effect: GaussianBlur { radius: 16; samples: 32; source: bottomBar }

        RowLayout {
            anchors.fill: parent
            anchors.margins: 20
            spacing: 20

            Text {
                text: XakteirStreamEngine.currentTrack
                color: "white"
                font.family: "Syne"
                font.pixelSize: 18
                font.bold: true
                Layout.preferredWidth: 300
                elide: Text.ElideRight
            }

            Item { Layout.fillWidth: true } // Spacer

            // Controls
            RowLayout {
                spacing: 30
                
                Text { text: "⏮"; font.pixelSize: 24; color: "white" }
                
                Rectangle {
                    width: 50; height: 50; radius: 25; color: "white"
                    Text { 
                        anchors.centerIn: parent
                        text: XakteirStreamEngine.isPlaying ? "⏸" : "▶"
                        font.pixelSize: 24
                        color: "black"
                    }
                    MouseArea {
                        anchors.fill: parent
                        onClicked: {
                            if (XakteirStreamEngine.isPlaying) {
                                XakteirStreamEngine.pause();
                            } else {
                                XakteirStreamEngine.play("/vfs/media/Xakteir_Trailer_4K.mkv");
                            }
                        }
                    }
                }
                
                Text { text: "⏭"; font.pixelSize: 24; color: "white" }
            }

            Item { Layout.fillWidth: true } // Spacer
            
            Text {
                text: "✨ Xak Audio Enhance"
                color: "#FFD700"
                font.family: "Inter"
                font.pixelSize: 14
            }
        }
    }
}
