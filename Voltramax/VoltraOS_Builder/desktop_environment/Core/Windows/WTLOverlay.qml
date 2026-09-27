import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Item {
    id: wtlOverlay
    anchors.fill: parent
    visible: false // Only visible when WTL is executing

    Rectangle {
        anchors.fill: parent
        color: "#AA000000" // Transparent black glass
        
        Rectangle {
            width: 700
            height: 500
            anchors.centerIn: parent
            color: "#1A1A1A"
            radius: 8
            border.color: "#333333"
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 20
                spacing: 15
                
                Text {
                    text: "VOLTRA WINDOWS TRANSLATION LAYER (WTL)"
                    color: "#00FFCC"
                    font.pixelSize: 18
                    font.family: "Syne"
                    font.bold: true
                }
                
                Text {
                    text: "Target Executable: " + WTLManager.lastExecutedApp
                    color: "white"
                    font.pixelSize: 14
                }
                
                Rectangle {
                    Layout.fillWidth: true
                    height: 1
                    color: "#333333"
                }
                
                ScrollView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    
                    Column {
                        id: logContainer
                        spacing: 4
                        width: parent.width
                    }
                }
            }
        }
    }

    Connections {
        target: WTLManager
        function onAppExecuted() {
            wtlOverlay.visible = true;
            logContainer.children = []; // Clear logs
        }
        function onWtlLog(message) {
            var comp = Qt.createComponent("WTLLogLine.qml");
            if (comp.status === Component.Error) {
                // Inline component if file missing
                var obj = Qt.createQmlObject('import QtQuick 2.15; Text { color: "#00FFCC"; font.family: "Consolas"; font.pixelSize: 12; text: "> " + "' + message + '" }', logContainer);
            }
        }
        function onWtlShaderCompiled(hash) {
            var obj = Qt.createQmlObject('import QtQuick 2.15; Text { color: "#FFAA00"; font.family: "Consolas"; font.pixelSize: 12; text: "[D3D->VULKAN] Compiled Shader: " + "' + hash + '" }', logContainer);
        }
        function onWtlMemoryMapped(address) {
            var obj = Qt.createQmlObject('import QtQuick 2.15; Text { color: "#FF5555"; font.family: "Consolas"; font.pixelSize: 12; text: "[MEM_ALLOC] PE Mapped -> " + "' + address + '" }', logContainer);
        }
    }
}
