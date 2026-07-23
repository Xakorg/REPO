import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    width: 1920
    height: 1080

    // Connect to C++ Signals for state changes
    Connections {
        target: OOBE
        function onNetworkConnectionSuccess() {
            stackView.push("AccountPage.qml");
        }
        function onNetworkConnectionFailed() {
            statusText.text = "Connection failed. Please try again.";
            statusText.color = "#FF3B30"; // Red
        }
    }

    Rectangle {
        width: 600
        height: 500
        anchors.centerIn: parent
        color: glassColor
        radius: 24
        border.color: glassBorder
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 20
            width: parent.width * 0.8

            Text {
                text: "Network Configuration"
                font.pixelSize: 32
                font.weight: Font.Light
                color: textColor
                anchors.horizontalCenter: parent.horizontalCenter
            }
            
            Text {
                id: statusText
                text: "Select a secure Wi-Fi network."
                font.pixelSize: 16
                color: "#666666"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Fake Wi-Fi List
            Rectangle {
                width: parent.width
                height: 200
                color: "#20FFFFFF"
                radius: 12
                border.color: glassBorder
                border.width: 1
                
                ListView {
                    anchors.fill: parent
                    anchors.margins: 10
                    model: ["Voltra_HQ_5G", "Xakteir_Guest", "Enterprise_Secure", "Hidden Network..."]
                    delegate: Rectangle {
                        width: parent.width
                        height: 50
                        color: "transparent"
                        radius: 8
                        
                        Text {
                            text: modelData
                            anchors.verticalCenter: parent.verticalCenter
                            anchors.left: parent.left
                            anchors.leftMargin: 20
                            color: textColor
                            font.pixelSize: 18
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onEntered: parent.color = "#10000000"
                            onExited: parent.color = "transparent"
                            onClicked: {
                                ssidInput.text = modelData;
                                passInput.forceActiveFocus();
                            }
                        }
                    }
                }
            }

            TextField {
                id: ssidInput
                width: parent.width
                placeholderText: "SSID"
                font.pixelSize: 16
                background: Rectangle {
                    color: "#40FFFFFF"
                    radius: 8
                }
            }

            TextField {
                id: passInput
                width: parent.width
                placeholderText: "WPA3 Password"
                echoMode: TextInput.Password
                font.pixelSize: 16
                background: Rectangle {
                    color: "#40FFFFFF"
                    radius: 8
                }
            }

            Rectangle {
                id: connectBtn
                width: parent.width
                height: 50
                radius: 8
                color: OOBE.isConnecting ? "#999999" : primaryColor
                
                Text {
                    text: OOBE.isConnecting ? "Authenticating..." : "Connect"
                    color: "white"
                    font.pixelSize: 16
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    enabled: !OOBE.isConnecting
                    onClicked: {
                        if (ssidInput.text !== "") {
                            statusText.text = "Securing connection...";
                            statusText.color = primaryColor;
                            OOBE.connectToNetwork(ssidInput.text, passInput.text);
                        }
                    }
                }
            }
        }
    }
}
