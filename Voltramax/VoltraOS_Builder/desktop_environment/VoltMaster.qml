import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: voltMasterRoot
    anchors.fill: parent

    // Deep immersive background
    Rectangle {
        id: bg
        anchors.fill: parent
        color: "#08080A" // Near black
        
        RadialGradient {
            anchors.fill: parent
            gradient: Gradient {
                GradientStop { position: 0.0; color: "#1A0033" } // Deep purple center
                GradientStop { position: 1.0; color: "#000000" }
            }
        }
    }

    // Top Stats Bar
    RowLayout {
        id: headerStats
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: 20
        height: 100
        spacing: 20

        // CPU Widget
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "#11FFFFFF"
            radius: 8
            border.color: "#33FFFFFF"

            ColumnLayout {
                anchors.centerIn: parent
                Text { text: "GLOBAL CPU"; color: "#AAAAAA"; font.pixelSize: 12; font.letterSpacing: 2 }
                Text { 
                    text: VoltMasterEngine.globalCpuUsage.toFixed(1) + "%" 
                    color: "#00FFCC"
                    font.pixelSize: 36
                    font.bold: true
                    font.family: "Syne"
                }
            }
        }

        // RAM Widget
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "#11FFFFFF"
            radius: 8
            border.color: "#33FFFFFF"

            ColumnLayout {
                anchors.centerIn: parent
                Text { text: "ALLOCATED RAM"; color: "#AAAAAA"; font.pixelSize: 12; font.letterSpacing: 2 }
                Text { 
                    text: (VoltMasterEngine.globalRamUsage / 1024).toFixed(2) + " GB" 
                    color: "#FF5F56"
                    font.pixelSize: 36
                    font.bold: true
                    font.family: "Syne"
                }
            }
        }
    }

    // Process Table Header
    RowLayout {
        id: tableHeader
        anchors.top: headerStats.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.topMargin: 20
        anchors.leftMargin: 20
        anchors.rightMargin: 20
        height: 30

        Text { text: "PID"; color: "#888"; font.pixelSize: 14; Layout.preferredWidth: 60 }
        Text { text: "PROCESS NAME"; color: "#888"; font.pixelSize: 14; Layout.fillWidth: true }
        Text { text: "CPU %"; color: "#888"; font.pixelSize: 14; Layout.preferredWidth: 80; horizontalAlignment: Text.AlignRight }
        Text { text: "RAM (MB)"; color: "#888"; font.pixelSize: 14; Layout.preferredWidth: 100; horizontalAlignment: Text.AlignRight }
        Text { text: "ACTION"; color: "#888"; font.pixelSize: 14; Layout.preferredWidth: 120; horizontalAlignment: Text.AlignRight }
    }
    
    Rectangle {
        anchors.top: tableHeader.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 1
        color: "#33FFFFFF"
        anchors.leftMargin: 20
        anchors.rightMargin: 20
    }

    // Process List
    ListView {
        id: processList
        anchors.top: tableHeader.bottom
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: 20
        anchors.topMargin: 10
        spacing: 4
        clip: true

        model: ListModel { id: pModel }

        Connections {
            target: VoltMasterEngine
            function onProcessListUpdated() {
                // Update the QML model with the massive JSON array from C++
                var data = VoltMasterEngine.getProcessList();
                pModel.clear();
                for (var i = 0; i < data.length; ++i) {
                    pModel.append(data[i]);
                }
            }
        }

        delegate: Rectangle {
            width: processList.width
            height: 40
            color: index % 2 === 0 ? "#05FFFFFF" : "#00FFFFFF"
            radius: 4

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 10
                anchors.rightMargin: 10

                Text { text: model.pid; color: "#00FFCC"; font.pixelSize: 14; Layout.preferredWidth: 50; font.family: "Courier New" }
                
                RowLayout {
                    Layout.fillWidth: true
                    Text { 
                        text: model.isKernelThread ? "⚙️" : "📦"
                        font.pixelSize: 14 
                    }
                    Text { 
                        text: model.name
                        color: model.isKernelThread ? "#FFD700" : "white" 
                        font.pixelSize: 16 
                        font.bold: model.isKernelThread
                    }
                }

                Text { text: model.cpuPercent; color: "white"; font.pixelSize: 14; Layout.preferredWidth: 80; horizontalAlignment: Text.AlignRight; font.family: "Courier New" }
                Text { text: model.ramMegabytes; color: "white"; font.pixelSize: 14; Layout.preferredWidth: 100; horizontalAlignment: Text.AlignRight; font.family: "Courier New" }
                
                // The Xak Override SIGKILL Button
                Rectangle {
                    Layout.preferredWidth: 100
                    Layout.preferredHeight: 30
                    Layout.alignment: Qt.AlignRight
                    radius: 4
                    color: model.isKernelThread ? "#333333" : "#AAFF0000"
                    border.color: model.isKernelThread ? "#555" : "#FF0000"
                    
                    Text {
                        anchors.centerIn: parent
                        text: "SIGKILL"
                        color: model.isKernelThread ? "#666" : "white"
                        font.pixelSize: 12
                        font.bold: true
                    }

                    // Option B: The Xak Override Implementation
                    Rectangle {
                        id: killProgress
                        anchors.left: parent.left
                        anchors.top: parent.top
                        anchors.bottom: parent.bottom
                        width: 0
                        color: "#FF0000"
                        radius: 4
                        opacity: 0.5
                    }

                    MouseArea {
                        anchors.fill: parent
                        enabled: !model.isKernelThread // Cannot kill Ring 0 threads from User Space!
                        
                        onPressed: {
                            // Start the 2-second intense warning charge-up
                            chargeAnim.start();
                            warningOverlay.opacity = 1.0;
                        }
                        onReleased: {
                            chargeAnim.stop();
                            killProgress.width = 0;
                            warningOverlay.opacity = 0.0;
                        }
                        
                        NumberAnimation {
                            id: chargeAnim
                            target: killProgress
                            property: "width"
                            to: 100 // Full width
                            duration: 2000 // 2 seconds
                            onFinished: {
                                warningOverlay.opacity = 0.0;
                                VoltMasterEngine.killProcess(model.pid);
                            }
                        }
                    }
                }
            }
        }
    }

    // Option B: Intense Red Warning Overlay
    Rectangle {
        id: warningOverlay
        anchors.fill: parent
        color: "#55FF0000"
        opacity: 0.0
        z: 999

        Behavior on opacity { NumberAnimation { duration: 200 } }

        Text {
            anchors.centerIn: parent
            text: "⚠️ XAK OVERRIDE INITIATED\nHOLD TO FORCE TERMINATE PROCESS"
            color: "white"
            font.pixelSize: 32
            font.bold: true
            font.family: "Syne"
            horizontalAlignment: Text.AlignHCenter
        }
    }
}
