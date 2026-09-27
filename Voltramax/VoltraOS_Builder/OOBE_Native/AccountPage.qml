import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: root
    width: 1920
    height: 1080

    Rectangle {
        width: 750
        height: 620
        anchors.centerIn: parent
        color: glassColor
        radius: 24
        border.color: glassBorder
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 20
            width: parent.width * 0.84

            Text {
                text: "Welcome Back"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: textColor
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Sign in to continue to VoltraOS"
                font.pixelSize: 16
                color: "#666666"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Profile Avatar with camera icon
            Rectangle {
                width: 90; height: 90
                radius: 45
                color: "#40FFFFFF"
                border.color: primaryColor
                border.width: 2
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    text: "👤"
                    font.pixelSize: 36
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        // Trigger avatar picker
                        avatarPicker.visible = true
                    }
                }

                // Hidden file picker overlay
                Rectangle {
                    id: avatarPicker
                    visible: false
                    anchors.fill: parent
                    color: "#80000000"
                    radius: 45
                    Text {
                        anchors.centerIn: parent
                        text: "📁"
                        font.pixelSize: 30
                    }
                }
            }

            // Sign in with Xakteir button
            Rectangle {
                width: parent.width
                height: 52
                radius: 12
                color: "#FF6B35"
                anchors.horizontalCenter: parent.horizontalCenter

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 12

                    Text {
                        text: "🔥"
                        font.pixelSize: 20
                        Layout.alignment: Qt.AlignVCenter
                    }
                    Text {
                        text: "Sign in with Xakteir"
                        color: "white"
                        font.pixelSize: 16
                        font.bold: true
                        Layout.alignment: Qt.AlignVCenter
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        OOBE.signInWithXakteir(emailInput.text)
                    }
                }
            }

            // Divider
            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 15
                Layout.fillWidth: true

                Rectangle { height: 1; width: parent.width * 0.3; color: "#CCCCCC" }
                Text { text: "or"; color: "#888888"; font.pixelSize: 14 }
                Rectangle { height: 1; width: parent.width * 0.3; color: "#CCCCCC" }
            }

            // Email input
            TextField {
                id: emailInput
                width: parent.width
                placeholderText: "Email or Xakteir ID"
                font.pixelSize: 16
                font.family: "Inter"
                background: Rectangle { color: "#40FFFFFF"; radius: 8 }
                padding: 14
            }

            // Password toggle
            TextField {
                id: passInput
                width: parent.width
                placeholderText: "Password"
                echoMode: passInput.echoMode === TextInput.Password ? TextInput.Password : TextInput.Normal
                font.pixelSize: 16
                font.family: "Inter"
                background: Rectangle { color: "#40FFFFFF"; radius: 8 }
                padding: 14
                visible: OOBE.passwordRequired || passInput.text !== ""

                onTextChanged: {
                    OOBE.evaluatePassword(text);
                }
            }

            // Toggle: Password required / PIN only
            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 8

                Text {
                    text: "Password required:"
                    font.pixelSize: 14
                    color: "#666666"
                }

                Switch {
                    checked: OOBE.passwordRequired
                    onCheckedChanged: {
                        OOBE.togglePasswordRequirement(checked);
                    }
                }
            }

            // PIN input (shown when password is optional)
            TextField {
                id: pinInput
                width: parent.width
                placeholderText: "4-8 digit PIN"
                echoMode: TextInput.Password
                font.pixelSize: 16
                font.family: "Inter"
                background: Rectangle { color: "#40FFFFFF"; radius: 8 }
                padding: 14
                visible: !OOBE.passwordRequired

                onTextChanged: {
                    if (pinInput.text.length >= 4) {
                        OOBE.signInWithPin(pinInput.text);
                    }
                }
            }

            // Auth Method selector
            RowLayout {
                width: parent.width
                spacing: 10

                Text {
                    text: "Sign-in method:"
                    font.pixelSize: 14
                    color: "#666666"
                    Layout.alignment: Qt.AlignVCenter
                }

                ComboBox {
                    Layout.fillWidth: true
                    model: ["Password", "PIN Only", "Fingerprint", "Face ID", "Draw Pattern"]
                    onCurrentIndexChanged: {
                        OOBE.setAuthMethod(index);
                    }
                }
            }

            // Password Strength Meter
            Item {
                width: parent.width
                height: 8
                visible: passInput.text !== "" && OOBE.passwordRequired

                Rectangle {
                    width: parent.width * (OOBE.passwordStrength / 100.0)
                    height: parent.height
                    radius: 4
                    color: {
                        if (OOBE.passwordStrength < 40) return "#FF3B30"
                        if (OOBE.passwordStrength < 80) return "#FF9500"
                        return "#34C759"
                    }
                    Behavior on width { NumberAnimation { duration: 300 } }
                }
            }

            // Sign In button
            Rectangle {
                id: signInBtn
                width: parent.width
                height: 52
                radius: 12
                color: (emailInput.text !== "" && (passInput.text !== "" || pinInput.text !== "" || !OOBE.passwordRequired)) ? primaryColor : "#999999"
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    text: OOBE.isXakteirSignedIn ? "✓ Signed In" : "Sign In"
                    color: "white"
                    font.pixelSize: 16
                    font.bold: true
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    enabled: (emailInput.text !== "" && (passInput.text !== "" || pinInput.text !== "" || !OOBE.passwordRequired))
                    onClicked: {
                        if (OOBE.passwordRequired) {
                            OOBE.createUserAccount(emailInput.text, passInput.text, !OOBE.passwordRequired, OOBE.authMethod);
                        } else {
                            OOBE.createUserAccount(emailInput.text, pinInput.text, true, OOBE.authMethod);
                        }
                        stackView.push("BiometricPage.qml");
                    }
                }
            }

            // Skip option
            Text {
                text: "Skip for now →"
                font.pixelSize: 14
                color: primaryColor
                anchors.horizontalCenter: parent.horizontalCenter
                cursorShape: Qt.PointingHandCursor
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        OOBE.skipBiometric();
                        stackView.push("BiometricPage.qml");
                    }
                }
            }
        }
    }

    // Connection status overlay
    Rectangle {
        visible: OOBE.isConnecting
        color: "#80000000"
        anchors.fill: parent
        radius: 24

        Text {
            text: "Connecting..."
            font.pixelSize: 24
            color: "white"
            anchors.centerIn: parent
        }
    }
}
