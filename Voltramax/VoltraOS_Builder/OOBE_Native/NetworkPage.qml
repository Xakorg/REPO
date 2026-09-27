import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: root
    width: 1920
    height: 1080

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0a0a1a" }
            GradientStop { position: 1.0; color: "#1a1a3e" }
        }
    }

    // Network status indicator
    Rectangle {
        id: netStatus
        width: 200
        height: 60
        radius: 12
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        border.color: OOBE.isConnecting ? "#FF9500" : (OOBE.currentNetwork !== "" ? "#34C759" : "#666666")
        border.width: 2
        anchors {
            top: parent.top
            horizontalCenter: parent.horizontalCenter
            topMargin: 20
        }

        RowLayout {
            anchors.centerIn: parent
            spacing: 8

            Text {
                text: OOBE.isConnecting ? "⏳" : (OOBE.currentNetwork !== "" ? "✅" : "📡")
                font.pixelSize: 20
                Layout.alignment: Qt.AlignVCenter
            }
            Text {
                text: OOBE.isConnecting ? "Connecting..." : (OOBE.currentNetwork !== "" ? OOBE.currentNetwork : "No Network")
                font.pixelSize: 14
                color: "white"
                Layout.alignment: Qt.AlignVCenter
            }
        }
    }

    Rectangle {
        id: glassPanel
        width: 650
        height: 540
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 22
            width: parent.width * 0.78

            Text {
                text: "Network Configuration"
                font.pixelSize: 32
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Connect to a secure Wi-Fi network to sync your data with the Xakteir Cloud."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
                horizontalAlignment: Text.AlignHCenter
            }

            // Network search bar
            TextField {
                id: searchBar
                width: parent.width
                placeholderText: "Search networks..."
                font.pixelSize: 16
                background: Rectangle { color: "#20FFFFFF"; radius: 10 }
                padding: 14
                onTextChanged: {
                    // Filter network list
                }
            }

            // Wi-Fi list
            Rectangle {
                width: parent.width
                height: 220
                color: "#151530"
                radius: 14
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ListView {
                    anchors.fill: parent
                    anchors.margins: 8
                    clip: true
                    model: [
                        {"ssid": "VoltraNet-5G", "signal": 95, "security": "WPA3", "encrypted": true},
                        {"ssid": "Xakteir-Enterprise", "signal": 82, "security": "WPA3", "encrypted": true},
                        {"ssid": "HomeNetwork", "signal": 65, "security": "WPA2", "encrypted": true},
                        {"ssid": "Cafe_WiFi_Free", "signal": 40, "security": "Open", "encrypted": false},
                        {"ssid": "VoltraOS_Admin", "signal": 98, "security": "WPA3", "encrypted": true}
                    ]

                    delegate: Rectangle {
                        width: ListView.view.width
                        height: 56
                        radius: 10
                        color: itemMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.08) : "transparent"
                        border.color: itemMouse.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.2) : "transparent"
                        border.width: 1

                        RowLayout {
                            anchors.verticalCenter: parent.verticalCenter
                            anchors.left: parent.left
                            anchors.leftMargin: 16
                            spacing: 12

                            // Signal icon
                            Text {
                                text: signal > 80 ? "📶" : (signal > 50 ? "📶" : (signal > 30 ? "📶" : "📶"))
                                font.pixelSize: 20
                                Layout.alignment: Qt.AlignVCenter
                            }

                            ColumnLayout {
                                spacing: 2
                                Text {
                                    text: ssid
                                    font.pixelSize: 16
                                    color: "white"
                                    font.bold: true
                                }
                                Text {
                                    text: security + " • " + signal + "%"
                                    font.pixelSize: 12
                                    color: "#8888aa"
                                }
                            }

                            // Security badge
                            Text {
                                text: encrypted ? "🔒" : "🔓"
                                font.pixelSize: 16
                                Layout.alignment: Qt.AlignRight
                            }
                        }

                        MouseArea {
                            id: itemMouse
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                OOBE.connectToNetwork(ssid, "");
                            }
                        }
                    }
                }
            }

            // Password input (shown when network selected)
            TextField {
                id: networkPassword
                width: parent.width
                placeholderText: "Enter network password..."
                echoMode: TextInput.Password
                font.pixelSize: 16
                visible: OOBE.currentNetwork !== ""
                background: Rectangle { color: "#20FFFFFF"; radius: 10 }
                padding: 14
            }

            // Connect button
            Rectangle {
                width: parent.width
                height: 54
                radius: 14
                color: OOBE.currentNetwork !== "" ? primaryColor : "#999999"
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    text: OOBE.isConnecting ? "Connecting..." : "Connect & Continue →"
                    color: "white"
                    font.pixelSize: 18
                    font.bold: true
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    enabled: OOBE.currentNetwork !== "" && !OOBE.isConnecting
                    onClicked: {
                        OOBE.connectToNetwork(OOBE.currentNetwork, networkPassword.text);
                        stackView.push("AccountPage.qml");
                    }
                }
            }

            // Skip option
            Text {
                text: "Skip network setup"
                font.pixelSize: 15
                color: "#666688"
                anchors.horizontalCenter: parent.horizontalCenter
                cursorShape: Qt.PointingHandCursor
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        stackView.push("AccountPage.qml");
                    }
                }
            }
        }
    }

    // Loading overlay
    Rectangle {
        visible: OOBE.isConnecting
        color: "#60000000"
        anchors.fill: parent

        ProgressBar {
            anchors.centerIn: parent
            width: 300
            from: 0
            to: 100
            value: OOBE.isConnecting ? 50 : 0
        }
    }
}
