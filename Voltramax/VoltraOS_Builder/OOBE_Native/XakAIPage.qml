import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: root
    width: 1920
    height: 1080

    // Full Screen Glow Outline corresponding to AI state
    Rectangle {
        id: screenOutline
        anchors.fill: parent
        color: "transparent"
        border.color: "#3b82f6" // Default Blue (Listening)
        border.width: 0
        opacity: 0.8
        
        Behavior on border.color { ColorAnimation { duration: 500 } }
        Behavior on border.width { NumberAnimation { duration: 300; easing.type: Easing.OutBack } }
    }

    ColumnLayout {
        anchors.centerIn: parent
        spacing: 40

        Text {
            text: "Train Your Voice"
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            id: instructions
            text: "Say <font color='#3b82f6'>\"Hey Xak\"</font> to activate."
            font.family: "Inter"
            font.pixelSize: 32
            color: "#a0a0a0"
            textFormat: Text.RichText
            Layout.alignment: Qt.AlignHCenter
        }

        // Mock simulation of voice training states
        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 20
            Layout.topMargin: 40

            Rectangle {
                width: 200
                height: 60
                radius: 30
                color: "#3b82f6" // Blue
                Text { anchors.centerIn: parent; text: "Simulate 'Hey Xak'"; color: "white"; font.bold: true }
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        screenOutline.border.width = 15;
                        screenOutline.border.color = "#3b82f6"; // Blue
                        instructions.text = "Listening...";
                    }
                }
            }

            Rectangle {
                width: 200
                height: 60
                radius: 30
                color: "#a855f7" // Purple
                Text { anchors.centerIn: parent; text: "Simulate Thinking"; color: "white"; font.bold: true }
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        screenOutline.border.width = 15;
                        screenOutline.border.color = "#a855f7"; // Purple
                        instructions.text = "Processing...";
                    }
                }
            }

            Rectangle {
                width: 200
                height: 60
                radius: 30
                color: "#22c55e" // Green
                Text { anchors.centerIn: parent; text: "Simulate Talking"; color: "white"; font.bold: true }
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        screenOutline.border.width = 15;
                        screenOutline.border.color = "#22c55e"; // Green
                        instructions.text = "Calibration Complete.";
                        nextButton.opacity = 1;
                    }
                }
            }
        }

        Rectangle {
            id: nextButton
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 60
            width: 250
            height: 60
            radius: 30
            color: nextMouse.containsMouse ? "#a855f7" : "#9333ea"
            opacity: 0 // Hidden until setup is complete
            
            Behavior on color { ColorAnimation { duration: 200 } }
            Behavior on opacity { NumberAnimation { duration: 500 } }

            Text {
                anchors.centerIn: parent
                text: "Continue"
                font.family: "Inter"
                font.pixelSize: 20
                font.weight: Font.DemiBold
                color: "white"
            }

            MouseArea {
                id: nextMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: stackView.push("CustomizationPage.qml")
            }
        }
    }
}
