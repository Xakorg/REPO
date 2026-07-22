import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15
import QtWebEngine 1.10
import QtGraphicalEffects 1.15

Window {
    id: browserWindow
    width: 1200
    height: 800
    visible: true
    title: "VoltraBrowser"
    color: "transparent"
    
    // Frameless window for custom OS chrome
    flags: Qt.Window | Qt.FramelessWindowHint

    // Layout Modes: "horizontal", "vertical", "zen"
    property string tabMode: "vertical"
    property string currentUrl: "https://www.google.com"

    // Glassmorphism Background
    Rectangle {
        id: bgBlur
        anchors.fill: parent
        color: "#AA111111"
        radius: 12
        border.color: "#33FFFFFF"
        border.width: 1
        
        // Window Dragging Area (Title Bar)
        MouseArea {
            id: dragArea
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            height: 40
            cursorShape: Qt.OpenHandCursor
            property point startPos: Qt.point(0, 0)
            
            onPressed: {
                cursorShape = Qt.ClosedHandCursor
                startPos = Qt.point(mouse.x, mouse.y)
            }
            onPositionChanged: {
                if (pressed) {
                    browserWindow.x += mouse.x - startPos.x
                    browserWindow.y += mouse.y - startPos.y
                }
            }
            onReleased: {
                cursorShape = Qt.OpenHandCursor
            }
        }
        
        // Window Controls (Top Right)
        Row {
            anchors.right: parent.right
            anchors.top: parent.top
            anchors.rightMargin: 15
            anchors.topMargin: 10
            spacing: 10
            
            Rectangle { width: 14; height: 14; radius: 7; color: "#FF5F56"; MouseArea { anchors.fill: parent; onClicked: browserWindow.close() } } // Close
            Rectangle { width: 14; height: 14; radius: 7; color: "#FFBD2E"; MouseArea { anchors.fill: parent; onClicked: browserWindow.showMinimized() } } // Minimize
            Rectangle { width: 14; height: 14; radius: 7; color: "#27C93F"; MouseArea { anchors.fill: parent; onClicked: browserWindow.visibility = (browserWindow.visibility === Window.Maximized) ? Window.Windowed : Window.Maximized } } // Maximize
        }
        
        // Layout Toggle Buttons (Top Left)
        Row {
            anchors.left: parent.left
            anchors.top: parent.top
            anchors.leftMargin: 20
            anchors.topMargin: 10
            spacing: 8
            
            Repeater {
                model: ["horizontal", "vertical", "zen"]
                Rectangle {
                    width: 70; height: 24; radius: 12
                    color: browserWindow.tabMode === modelData ? "#33FFFFFF" : "transparent"
                    border.color: "#22FFFFFF"
                    Text {
                        anchors.centerIn: parent
                        text: modelData.charAt(0).toUpperCase() + modelData.slice(1)
                        color: "white"
                        font.pixelSize: 11
                    }
                    MouseArea {
                        anchors.fill: parent
                        onClicked: browserWindow.tabMode = modelData
                    }
                }
            }
        }

        // Main Application Layout
        RowLayout {
            anchors.fill: parent
            anchors.topMargin: 40 // Below titlebar
            spacing: 0

            // VERTICAL TAB SIDEBAR (Visible in "vertical" mode)
            Rectangle {
                id: verticalSidebar
                Layout.fillHeight: true
                Layout.preferredWidth: 250
                Layout.margins: 10
                visible: browserWindow.tabMode === "vertical"
                color: "#11FFFFFF"
                radius: 12
                border.color: "#22FFFFFF"

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 15

                    // Omnibox for Vertical
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 36
                        color: "#33000000"
                        radius: 8
                        border.color: "#33FFFFFF"
                        
                        TextInput {
                            id: verticalUrlBar
                            anchors.left: parent.left
                            anchors.right: xakBtn1.left
                            anchors.verticalCenter: parent.verticalCenter
                            anchors.margins: 10
                            text: browserWindow.currentUrl
                            color: "white"
                            font.pixelSize: 13
                            selectByMouse: true
                            onAccepted: webView.url = text
                        }
                        
                        // Xak AI Glowing Button
                        Rectangle {
                            id: xakBtn1
                            anchors.right: parent.right
                            anchors.verticalCenter: parent.verticalCenter
                            anchors.rightMargin: 4
                            width: 28; height: 28; radius: 14
                            color: "transparent"
                            
                            Rectangle {
                                anchors.centerIn: parent
                                width: 14; height: 14; radius: 7
                                color: "#FFD700" // Voltra Yellow
                                layer.enabled: true
                                layer.effect: DropShadow {
                                    color: "#FFD700"
                                    radius: 8
                                    samples: 16
                                    spread: 0.2
                                }
                            }
                            MouseArea {
                                anchors.fill: parent
                                onClicked: console.log("Xak AI: Summarizing page!")
                            }
                        }
                    }

                    // Dummy Tabs
                    Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 32; radius: 6; color: "#22FFFFFF"; Text { anchors.verticalCenter: parent.verticalCenter; anchors.left: parent.left; anchors.leftMargin: 10; text: "Google"; color: "white" } }
                    Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 32; radius: 6; color: "transparent"; Text { anchors.verticalCenter: parent.verticalCenter; anchors.left: parent.left; anchors.leftMargin: 10; text: "GitHub - Voltra"; color: "#AAAAAA" } }
                    
                    Item { Layout.fillHeight: true } // Spacer
                }
            }

            // MAIN CONTENT AREA
            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 0

                // HORIZONTAL TOOLBAR (Visible in "horizontal" mode)
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 60
                    visible: browserWindow.tabMode === "horizontal"
                    color: "transparent"
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 15
                        spacing: 15
                        
                        // Back/Forward/Reload
                        Row {
                            spacing: 10
                            Rectangle { width: 30; height: 30; radius: 15; color: "#11FFFFFF"; Text { anchors.centerIn: parent; text: "◀"; color: "white" } MouseArea { anchors.fill: parent; onClicked: webView.goBack() } }
                            Rectangle { width: 30; height: 30; radius: 15; color: "#11FFFFFF"; Text { anchors.centerIn: parent; text: "▶"; color: "white" } MouseArea { anchors.fill: parent; onClicked: webView.goForward() } }
                            Rectangle { width: 30; height: 30; radius: 15; color: "#11FFFFFF"; Text { anchors.centerIn: parent; text: "↻"; color: "white" } MouseArea { anchors.fill: parent; onClicked: webView.reload() } }
                        }
                        
                        // Omnibox
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 36
                            color: "#33000000"
                            radius: 18
                            border.color: "#33FFFFFF"
                            
                            TextInput {
                                id: horizontalUrlBar
                                anchors.left: parent.left
                                anchors.right: xakBtn2.left
                                anchors.verticalCenter: parent.verticalCenter
                                anchors.margins: 15
                                text: browserWindow.currentUrl
                                color: "white"
                                font.pixelSize: 13
                                selectByMouse: true
                                onAccepted: webView.url = text
                            }
                            
                            // Xak AI
                            Rectangle {
                                id: xakBtn2
                                anchors.right: parent.right
                                anchors.verticalCenter: parent.verticalCenter
                                anchors.rightMargin: 4
                                width: 28; height: 28; radius: 14
                                color: "transparent"
                                Rectangle {
                                    anchors.centerIn: parent
                                    width: 14; height: 14; radius: 7
                                    color: "#FFD700"
                                    layer.enabled: true
                                    layer.effect: DropShadow { color: "#FFD700"; radius: 8; samples: 16; spread: 0.2 }
                                }
                            }
                        }
                    }
                }

                // ZEN MODE FLOATING OMNIBOX (Auto-hides)
                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.preferredWidth: 500
                    Layout.preferredHeight: 40
                    Layout.topMargin: 10
                    visible: browserWindow.tabMode === "zen"
                    color: "#AA000000"
                    radius: 20
                    border.color: "#44FFFFFF"
                    z: 100
                    
                    TextInput {
                        id: zenUrlBar
                        anchors.fill: parent
                        anchors.margins: 15
                        text: browserWindow.currentUrl
                        color: "white"
                        font.pixelSize: 14
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                        onAccepted: webView.url = text
                    }
                    
                    // Xak AI Glowing Button (Absolute right)
                    Rectangle {
                        anchors.right: parent.right
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.rightMargin: 8
                        width: 24; height: 24; radius: 12
                        color: "#FFD700"
                        layer.enabled: true
                        layer.effect: DropShadow { color: "#FFD700"; radius: 6; samples: 12; spread: 0.2 }
                    }
                }

                // CHROMIUM WEB ENGINE VIEW
                Rectangle {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    Layout.margins: browserWindow.tabMode === "zen" ? 0 : 10
                    Layout.topMargin: 0
                    radius: browserWindow.tabMode === "zen" ? 0 : 12
                    color: "white"
                    clip: true
                    
                    WebEngineView {
                        id: webView
                        anchors.fill: parent
                        url: browserWindow.currentUrl
                        
                        onUrlChanged: {
                            browserWindow.currentUrl = url
                            verticalUrlBar.text = url
                            horizontalUrlBar.text = url
                            zenUrlBar.text = url
                        }
                    }
                }
            }
        }
    }
}
