import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

Window {
    id: playgroundWindow
    width: 1400
    height: 900
    visible: true
    title: "Xak AI Playground"
    color: "#0a0a0f"
    flags: Qt.Window | Qt.FramelessWindowHint

    // Drag Area
    MouseArea {
        anchors.fill: parent
        property point startPos: Qt.point(0, 0)
        onPressed: startPos = Qt.point(mouse.x, mouse.y)
        onPositionChanged: {
            if (pressed) {
                playgroundWindow.x += mouse.x - startPos.x
                playgroundWindow.y += mouse.y - startPos.y
            }
        }
    }

    // Close Button
    Rectangle {
        anchors.top: parent.top; anchors.left: parent.left; anchors.margins: 20
        width: 16; height: 16; radius: 8; color: "#FF5F56"; z: 10
        MouseArea { anchors.fill: parent; onClicked: playgroundWindow.close() }
    }

    // Grid Background Pattern
    Canvas {
        anchors.fill: parent
        onPaint: {
            var ctx = getContext("2d");
            ctx.strokeStyle = "#11FFFFFF";
            ctx.lineWidth = 1;
            for (var i = 0; i < width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
            for (var j = 0; j < height; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke(); }
        }
    }

    // ---------------------------------------------------------
    // Node System UI
    // ---------------------------------------------------------
    
    // Central AI Core Node
    Rectangle {
        id: coreNode
        x: 600; y: 400
        width: 200; height: 80; radius: 40
        color: Qt.rgba(168/255, 85/255, 247/255, 0.2)
        border.color: "#a855f7"; border.width: 2
        
        RowLayout {
            anchors.centerIn: parent
            spacing: 10
            Text { text: "✨"; font.pixelSize: 24 }
            Text { text: "Xak Core v4.0"; color: "white"; font.family: "Syne"; font.pixelSize: 16; font.bold: true }
        }
    }

    // Input Node (User Text)
    Rectangle {
        id: inputNode
        x: 200; y: 200
        width: 300; height: 150; radius: 12
        color: "#11FFFFFF"; border.color: "#33FFFFFF"
        
        ColumnLayout {
            anchors.fill: parent; anchors.margins: 15; spacing: 10
            Text { text: "Text Input"; color: "#a0a0a0"; font.family: "Inter"; font.pixelSize: 12; font.bold: true }
            Rectangle { height: 1; Layout.fillWidth: true; color: "#22FFFFFF" }
            Text { 
                text: "\"Write a C++ class for a multi-threaded web server.\""
                color: "white"; font.family: "Inter"; font.pixelSize: 14; wrapMode: Text.Wrap; Layout.fillWidth: true
            }
        }
    }

    // Output Node (Code Result)
    Rectangle {
        id: outputNode
        x: 900; y: 550
        width: 400; height: 250; radius: 12
        color: "#11FFFFFF"; border.color: "#33FFFFFF"
        
        ColumnLayout {
            anchors.fill: parent; anchors.margins: 15; spacing: 10
            Text { text: "Code Generation Output"; color: "#22c55e"; font.family: "Inter"; font.pixelSize: 12; font.bold: true }
            Rectangle { height: 1; Layout.fillWidth: true; color: "#22FFFFFF" }
            Text { 
                text: "class WebServer {\npublic:\n    void start();\n    void stop();\nprivate:\n    std::vector<std::thread> workers;\n};"
                color: "#e2e8f0"; font.family: "Consolas"; font.pixelSize: 12; Layout.fillWidth: true; Layout.fillHeight: true
            }
        }
    }

    // Simulated Bezier Connections
    Canvas {
        anchors.fill: parent
        z: -1
        onPaint: {
            var ctx = getContext("2d");
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 3;
            
            // Draw curve from Input to Core
            ctx.beginPath();
            ctx.moveTo(inputNode.x + inputNode.width, inputNode.y + inputNode.height/2);
            ctx.bezierCurveTo(inputNode.x + inputNode.width + 100, inputNode.y + inputNode.height/2,
                              coreNode.x - 100, coreNode.y + coreNode.height/2,
                              coreNode.x, coreNode.y + coreNode.height/2);
            ctx.stroke();

            // Draw curve from Core to Output
            ctx.beginPath();
            ctx.moveTo(coreNode.x + coreNode.width, coreNode.y + coreNode.height/2);
            ctx.bezierCurveTo(coreNode.x + coreNode.width + 100, coreNode.y + coreNode.height/2,
                              outputNode.x - 100, outputNode.y + outputNode.height/2,
                              outputNode.x, outputNode.y + outputNode.height/2);
            ctx.stroke();
        }
    }
}
