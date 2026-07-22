import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15
import QtGraphicalEffects 1.15

Window {
    id: fileManagerWindow
    width: 1400
    height: 900
    visible: true
    title: "VoltraFiles"
    color: "transparent"
    
    flags: Qt.Window | Qt.FramelessWindowHint

    // Glassmorphism Window Background
    Rectangle {
        id: bgBlur
        anchors.fill: parent
        color: Qt.rgba(20/255, 20/255, 25/255, 0.85)
        radius: 12
        border.color: "#33FFFFFF"
        border.width: 1

        // Drag Area (Title Bar)
        MouseArea {
            id: dragArea
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            height: 40
            cursorShape: Qt.OpenHandCursor
            property point startPos: Qt.point(0, 0)
            
            onPressed: { cursorShape = Qt.ClosedHandCursor; startPos = Qt.point(mouse.x, mouse.y) }
            onPositionChanged: {
                if (pressed) {
                    fileManagerWindow.x += mouse.x - startPos.x
                    fileManagerWindow.y += mouse.y - startPos.y
                }
            }
            onReleased: { cursorShape = Qt.OpenHandCursor }
        }

        // Window Controls (Top Left)
        Row {
            anchors.left: parent.left
            anchors.top: parent.top
            anchors.leftMargin: 20
            anchors.topMargin: 15
            spacing: 10
            
            Rectangle { width: 14; height: 14; radius: 7; color: "#FF5F56"; MouseArea { anchors.fill: parent; onClicked: fileManagerWindow.close() } } // Close
            Rectangle { width: 14; height: 14; radius: 7; color: "#FFBD2E"; MouseArea { anchors.fill: parent; onClicked: fileManagerWindow.showMinimized() } } // Minimize
            Rectangle { width: 14; height: 14; radius: 7; color: "#27C93F"; MouseArea { anchors.fill: parent; onClicked: fileManagerWindow.visibility = (fileManagerWindow.visibility === Window.Maximized) ? Window.Windowed : Window.Maximized } } // Maximize
        }
        
        // Navigation Bar
        RowLayout {
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            anchors.leftMargin: 100
            anchors.topMargin: 10
            anchors.rightMargin: 20
            height: 40
            spacing: 15
            
            // Back Button
            Rectangle {
                width: 30; height: 30; radius: 15; color: "#22FFFFFF"
                Text { anchors.centerIn: parent; text: "◀"; color: "white" }
                MouseArea { anchors.fill: parent; onClicked: VoltraDaemon.fileSystem.navigateUp() }
            }
            
            // Path Breadcrumbs
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 30
                radius: 15
                color: "#11FFFFFF"
                border.color: "#22FFFFFF"
                
                Text {
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.left: parent.left
                    anchors.leftMargin: 15
                    text: VoltraDaemon.fileSystem.currentPath
                    color: "white"
                    font.family: "Inter"
                    font.pixelSize: 13
                }
            }
            
            // Xak AI Organize Button
            Rectangle {
                id: xakOrganizeBtn
                width: 140; height: 30; radius: 15
                color: "#11FFFFFF"
                border.color: "#FFD700" // Glowing yellow border
                
                RowLayout {
                    anchors.centerIn: parent
                    spacing: 5
                    Text { text: "✨"; font.pixelSize: 14 }
                    Text { text: "AI Organize"; color: "#FFD700"; font.family: "Inter"; font.bold: true; font.pixelSize: 12 }
                }
                
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        xakOrganizeBtn.opacity = 0.5
                        VoltraDaemon.fileSystem.xakAutoOrganize()
                    }
                }
                
                Connections {
                    target: VoltraDaemon.fileSystem
                    function onAiOrganizationComplete(summary) {
                        xakOrganizeBtn.opacity = 1.0
                        console.log(summary)
                    }
                }
            }
        }

        // Main Layout (Sidebar + Grid View + Preview Pane)
        RowLayout {
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            anchors.bottom: parent.bottom
            anchors.topMargin: 60
            spacing: 0
            
            // 1. Sidebar
            Rectangle {
                Layout.preferredWidth: 220
                Layout.fillHeight: true
                color: "transparent"
                border.color: "#11FFFFFF"
                
                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 10
                    
                    Text { text: "FAVORITES"; color: "#66FFFFFF"; font.family: "Inter"; font.pixelSize: 11; font.bold: true }
                    
                    ListModel {
                        id: sidebarModel
                        ListElement { name: "Home"; icon: "🏠" }
                        ListElement { name: "Documents"; icon: "📄" }
                        ListElement { name: "Downloads"; icon: "⬇️" }
                        ListElement { name: "Pictures"; icon: "🖼️" }
                    }
                    
                    Repeater {
                        model: sidebarModel
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 36
                            radius: 8
                            color: sbMouse.containsMouse ? "#22FFFFFF" : "transparent"
                            RowLayout {
                                anchors.fill: parent
                                anchors.leftMargin: 10
                                spacing: 10
                                Text { text: model.icon; font.pixelSize: 16 }
                                Text { text: model.name; color: "white"; font.family: "Inter"; font.pixelSize: 14 }
                            }
                            MouseArea { id: sbMouse; anchors.fill: parent; hoverEnabled: true }
                        }
                    }
                    
                    Item { Layout.fillHeight: true } // Spacer
                    
                    // Storage Indicator
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 80
                        radius: 12
                        color: "#11FFFFFF"
                        
                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 15
                            spacing: 5
                            Text { text: "NVMe 2TB Drive"; color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 13 }
                            Rectangle {
                                Layout.fillWidth: true
                                height: 6; radius: 3; color: "#33FFFFFF"
                                Rectangle { width: parent.width * 0.45; height: parent.height; radius: 3; color: "#a855f7" }
                            }
                            Text { text: "1.1 TB free"; color: "#99FFFFFF"; font.family: "Inter"; font.pixelSize: 11 }
                        }
                    }
                }
            }
            
            // Divider
            Rectangle { Layout.preferredWidth: 1; Layout.fillHeight: true; color: "#11FFFFFF" }
            
            // 2. Main Grid View
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: "transparent"
                
                GridView {
                    id: fileGrid
                    anchors.fill: parent
                    anchors.margins: 20
                    cellWidth: 140
                    cellHeight: 140
                    
                    // Connect directly to the C++ VoltraFileSystemModel
                    model: VoltraDaemon.fileSystem
                    
                    property int selectedIndex: -1
                    
                    delegate: Rectangle {
                        width: 120
                        height: 120
                        radius: 12
                        color: fileGrid.selectedIndex === index ? "#33a855f7" : (fileMouse.containsMouse ? "#11FFFFFF" : "transparent")
                        border.color: fileGrid.selectedIndex === index ? "#a855f7" : "transparent"
                        
                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 10
                            spacing: 10
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                text: model.fileIcon
                                font.pixelSize: 48
                            }
                            
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                text: model.fileName
                                color: "white"
                                font.family: "Inter"
                                font.pixelSize: 12
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.Wrap
                                elide: Text.ElideRight
                                maximumLineCount: 2
                            }
                        }
                        
                        MouseArea {
                            id: fileMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: fileGrid.selectedIndex = index
                            onDoubleClicked: {
                                if (model.fileType === "directory") {
                                    VoltraDaemon.fileSystem.openFolder(index)
                                } else if (model.fileType === "executable") {
                                    VoltraDaemon.fileSystem.executeFile(index)
                                }
                            }
                        }
                    }
                }
            }
            
            // Divider
            Rectangle { Layout.preferredWidth: 1; Layout.fillHeight: true; color: "#11FFFFFF" }
            
            // 3. Right Details Pane
            Rectangle {
                Layout.preferredWidth: 280
                Layout.fillHeight: true
                color: "transparent"
                visible: fileGrid.selectedIndex !== -1
                
                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 20
                    spacing: 20
                    
                    // Huge Preview Icon
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 200
                        radius: 12
                        color: "#11FFFFFF"
                        Text {
                            anchors.centerIn: parent
                            text: fileGrid.selectedIndex !== -1 ? VoltraDaemon.fileSystem.data(VoltraDaemon.fileSystem.index(fileGrid.selectedIndex, 0), 260) : "" // IconRole
                            font.pixelSize: 96
                        }
                    }
                    
                    // Metadata
                    ColumnLayout {
                        spacing: 8
                        Text { 
                            text: fileGrid.selectedIndex !== -1 ? VoltraDaemon.fileSystem.data(VoltraDaemon.fileSystem.index(fileGrid.selectedIndex, 0), 257) : "" // NameRole
                            color: "white"; font.family: "Inter"; font.bold: true; font.pixelSize: 18; wrapMode: Text.Wrap; Layout.fillWidth: true
                        }
                        Text { 
                            text: fileGrid.selectedIndex !== -1 ? VoltraDaemon.fileSystem.data(VoltraDaemon.fileSystem.index(fileGrid.selectedIndex, 0), 258) : "" // TypeRole
                            color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 12
                        }
                        
                        Rectangle { Layout.fillWidth: true; height: 1; color: "#22FFFFFF"; Layout.topMargin: 10; Layout.bottomMargin: 10 }
                        
                        RowLayout {
                            Text { text: "Size:"; color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 12; Layout.preferredWidth: 80 }
                            Text { text: fileGrid.selectedIndex !== -1 ? VoltraDaemon.fileSystem.data(VoltraDaemon.fileSystem.index(fileGrid.selectedIndex, 0), 259) : ""; color: "white"; font.family: "Inter"; font.pixelSize: 12 }
                        }
                        RowLayout {
                            Text { text: "Modified:"; color: "#88FFFFFF"; font.family: "Inter"; font.pixelSize: 12; Layout.preferredWidth: 80 }
                            Text { text: fileGrid.selectedIndex !== -1 ? VoltraDaemon.fileSystem.data(VoltraDaemon.fileSystem.index(fileGrid.selectedIndex, 0), 260) : ""; color: "white"; font.family: "Inter"; font.pixelSize: 12 }
                        }
                    }
                    
                    Item { Layout.fillHeight: true } // Push down
                    
                    // Open Action
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 40
                        radius: 8
                        color: "#a855f7"
                        Text { anchors.centerIn: parent; text: "Open"; color: "white"; font.family: "Inter"; font.bold: true }
                        MouseArea {
                            anchors.fill: parent
                            onClicked: {
                                if (fileGrid.selectedIndex !== -1) {
                                    var type = VoltraDaemon.fileSystem.data(VoltraDaemon.fileSystem.index(fileGrid.selectedIndex, 0), 258)
                                    if (type === "directory") VoltraDaemon.fileSystem.openFolder(fileGrid.selectedIndex)
                                    else if (type === "executable") VoltraDaemon.fileSystem.executeFile(fileGrid.selectedIndex)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
