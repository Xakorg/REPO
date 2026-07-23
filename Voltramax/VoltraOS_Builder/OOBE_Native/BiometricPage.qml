import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    width: 1920
    height: 1080

    Rectangle {
        width: 800
        height: 600
        anchors.centerIn: parent
        color: glassColor
        radius: 24
        border.color: glassBorder
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 30
            width: parent.width * 0.7

            Text {
                text: "Secure Your Device"
                font.pixelSize: 36
                font.weight: Font.Light
                color: textColor
                anchors.horizontalCenter: parent.horizontalCenter
            }
            
            Text {
                text: OOBE.biometricStatus
                font.pixelSize: 18
                color: primaryColor
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Biometric Scanner Simulation
            Item {
                width: 200
                height: 200
                anchors.horizontalCenter: parent.horizontalCenter
                
                Rectangle {
                    anchors.fill: parent
                    radius: 100
                    color: "transparent"
                    border.color: "#E0E0E0"
                    border.width: 4
                }
                
                // Scanning Ring
                Rectangle {
                    anchors.centerIn: parent
                    width: 200 * (OOBE.biometricProgress / 100.0)
                    height: 200 * (OOBE.biometricProgress / 100.0)
                    radius: width / 2
                    color: primaryColor
                    opacity: 0.3
                    
                    Behavior on width { NumberAnimation { duration: 200; easing.type: Easing.OutCubic } }
                    Behavior on height { NumberAnimation { duration: 200; easing.type: Easing.OutCubic } }
                }
                
                Text {
                    text: OOBE.biometricProgress + "%"
                    font.pixelSize: 24
                    color: textColor
                    anchors.centerIn: parent
                    visible: OOBE.biometricProgress > 0 && OOBE.biometricProgress < 100
                }
            }

            Rectangle {
                id: scanBtn
                width: 250
                height: 50
                radius: 25
                color: OOBE.biometricProgress == 100 ? "#34C759" : primaryColor
                anchors.horizontalCenter: parent.horizontalCenter
                
                Text {
                    text: OOBE.biometricProgress == 100 ? "Continue" : (OOBE.biometricProgress > 0 ? "Scanning..." : "Start Face Scan")
                    color: "white"
                    font.pixelSize: 16
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        if (OOBE.biometricProgress == 0) {
                            OOBE.startBiometricScan();
                        } else if (OOBE.biometricProgress == 100) {
                            stackView.push("CompletePage.qml");
                        }
                    }
                }
            }
        }
    }
}
