import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

Window {
    id: studioWindow
    width: 1600
    height: 1000
    visible: true
    title: "Voltra Studio"
    color: "#1e1e1e" // Standard dark gray editor background
    flags: Qt.Window | Qt.FramelessWindowHint

    // Window Controls
    Rectangle {
        anchors.top: parent.top; anchors.left: parent.left; anchors.margins: 10; z: 100
        width: 12; height: 12; radius: 6; color: "#FF5F56"
        MouseArea { anchors.fill: parent; onClicked: studioWindow.close() }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 2

        // Top Menu Bar
        Rectangle {
            Layout.fillWidth: true; Layout.preferredHeight: 40; color: "#252526"
            RowLayout {
                anchors.fill: parent; anchors.leftMargin: 40; spacing: 20
                Text { text: "File"; color: "#cccccc"; font.pixelSize: 13 }
                Text { text: "Edit"; color: "#cccccc"; font.pixelSize: 13 }
                Text { text: "Playback"; color: "#cccccc"; font.pixelSize: 13 }
                Text { text: "View"; color: "#cccccc"; font.pixelSize: 13 }
                Text { text: "Xak AI Sync"; color: "#a855f7"; font.pixelSize: 13; font.bold: true } // AI hook
            }
        }

        // Main Work Area
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 2

            // Project Media Bin
            Rectangle {
                Layout.preferredWidth: 350; Layout.fillHeight: true; color: "#252526"
                ColumnLayout {
                    anchors.fill: parent; anchors.margins: 10; spacing: 10
                    Text { text: "Project Assets"; color: "#cccccc"; font.bold: true; font.pixelSize: 12 }
                    Rectangle { height: 1; Layout.fillWidth: true; color: "#3e3e42" }
                    GridView {
                        Layout.fillWidth: true; Layout.fillHeight: true
                        cellWidth: 100; cellHeight: 100
                        model: ["Vlog_01.mp4", "B_Roll_Nature.mov", "Audio_Track_1.wav", "Title_Sequence.aep"]
                        delegate: Rectangle {
                            width: 90; height: 90; color: "#333333"; border.color: "#3e3e42"
                            Text { anchors.centerIn: parent; text: modelData; color: "#aaaaaa"; font.pixelSize: 10; width: 80; wrapMode: Text.Wrap; horizontalAlignment: Text.AlignHCenter }
                        }
                    }
                }
            }

            // Preview Monitor
            Rectangle {
                Layout.fillWidth: true; Layout.fillHeight: true; color: "black"
                
                // Simulated Video Feed
                Rectangle {
                    anchors.centerIn: parent
                    width: 800; height: 450
                    color: "#111111"; border.color: "#333333"
                    
                    Text { anchors.centerIn: parent; text: "Vlog_01.mp4\n[Playing: 00:01:23:14]"; color: "#555555"; font.family: "Consolas"; font.pixelSize: 24; horizontalAlignment: Text.AlignHCenter }
                    
                    // Transport Controls Overlaid
                    RowLayout {
                        anchors.bottom: parent.bottom; anchors.horizontalCenter: parent.horizontalCenter; anchors.bottomMargin: -40
                        spacing: 20
                        Text { text: "⏮"; color: "white"; font.pixelSize: 24 }
                        Text { text: "▶"; color: "white"; font.pixelSize: 32 }
                        Text { text: "⏭"; color: "white"; font.pixelSize: 24 }
                    }
                }
            }

            // Effects / Inspector
            Rectangle {
                Layout.preferredWidth: 300; Layout.fillHeight: true; color: "#252526"
                ColumnLayout {
                    anchors.fill: parent; anchors.margins: 10; spacing: 15
                    Text { text: "Inspector"; color: "#cccccc"; font.bold: true; font.pixelSize: 12 }
                    Rectangle { height: 1; Layout.fillWidth: true; color: "#3e3e42" }
                    
                    Text { text: "Color Grading"; color: "#cccccc"; font.pixelSize: 11 }
                    Slider { Layout.fillWidth: true; value: 0.5 }
                    Text { text: "Contrast"; color: "#cccccc"; font.pixelSize: 11 }
                    Slider { Layout.fillWidth: true; value: 0.7 }
                    Text { text: "Saturation"; color: "#cccccc"; font.pixelSize: 11 }
                    Slider { Layout.fillWidth: true; value: 1.0 }
                }
            }
        }

        // Timeline Area (Bottom)
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 350
            color: "#1e1e1e"
            border.color: "#3e3e42"
            
            ColumnLayout {
                anchors.fill: parent; spacing: 2
                
                // Timeline Toolbar
                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 30; color: "#2d2d30"
                    RowLayout {
                        anchors.fill: parent; anchors.margins: 5; spacing: 15
                        Text { text: "✄"; color: "#cccccc"; font.pixelSize: 18 }
                        Text { text: "✋"; color: "#cccccc"; font.pixelSize: 18 }
                        Text { text: "✒"; color: "#cccccc"; font.pixelSize: 18 }
                        Item { Layout.fillWidth: true }
                        Text { text: "00:01:23:14"; color: "#ff8c00"; font.family: "Consolas"; font.pixelSize: 16 }
                    }
                }
                
                // Track 1 (Video)
                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 80; color: "#252526"
                    Rectangle { x: 50; width: 400; height: 76; y: 2; color: "#00539C"; border.color: "#007ACC"; radius: 4; Text { text: "Vlog_01.mp4"; color: "white"; x: 10; y: 5; font.pixelSize: 11 } }
                    Rectangle { x: 450; width: 600; height: 76; y: 2; color: "#00539C"; border.color: "#007ACC"; radius: 4; Text { text: "B_Roll_Nature.mov"; color: "white"; x: 10; y: 5; font.pixelSize: 11 } }
                }
                // Track 2 (Audio)
                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 80; color: "#252526"
                    Rectangle { x: 50; width: 1000; height: 76; y: 2; color: "#2E7D32"; border.color: "#4CAF50"; radius: 4; Text { text: "Audio_Track_1.wav"; color: "white"; x: 10; y: 5; font.pixelSize: 11 } }
                }
                // Track 3 (Titles)
                Rectangle {
                    Layout.fillWidth: true; Layout.preferredHeight: 80; color: "#252526"
                    Rectangle { x: 100; width: 200; height: 76; y: 2; color: "#a855f7"; border.color: "#d946ef"; radius: 4; Text { text: "Xak AI Generated Title"; color: "white"; x: 10; y: 5; font.pixelSize: 11 } }
                }
                
                Item { Layout.fillHeight: true }
            }
            
            // Playhead Cursor
            Rectangle {
                x: 400; y: 30; width: 2; height: parent.height - 30; color: "#ff8c00"
                Rectangle { x: -4; y: 0; width: 10; height: 10; color: "#ff8c00"; radius: 5 }
            }
        }
    }
}
