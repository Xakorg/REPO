import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    width: 1920
    height: 1080

    Rectangle {
        width: 600
        height: 550
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
                text: "Create Local Account"
                font.pixelSize: 32
                font.weight: Font.Light
                color: textColor
                anchors.horizontalCenter: parent.horizontalCenter
            }
            
            Text {
                text: "Your data is encrypted by the Kernel."
                font.pixelSize: 16
                color: "#666666"
                anchors.horizontalCenter: parent.horizontalCenter
            }
            
            // Profile Image Placeholder
            Rectangle {
                width: 100; height: 100
                radius: 50
                color: "#40FFFFFF"
                anchors.horizontalCenter: parent.horizontalCenter
                Text { text: "📷"; font.pixelSize: 40; anchors.centerIn: parent }
            }

            TextField {
                id: userInput
                width: parent.width
                placeholderText: "Username"
                font.pixelSize: 16
                background: Rectangle { color: "#40FFFFFF"; radius: 8 }
            }

            TextField {
                id: passInput
                width: parent.width
                placeholderText: "Password"
                echoMode: TextInput.Password
                font.pixelSize: 16
                background: Rectangle { color: "#40FFFFFF"; radius: 8 }
                
                onTextChanged: {
                    OOBE.evaluatePassword(text);
                }
            }

            // Password Strength Meter
            Item {
                width: parent.width
                height: 10
                
                Rectangle {
                    width: parent.width * (OOBE.passwordStrength / 100.0)
                    height: parent.height
                    radius: 5
                    color: {
                        if (OOBE.passwordStrength < 40) return "#FF3B30"; // Weak (Red)
                        if (OOBE.passwordStrength < 80) return "#FF9500"; // Medium (Orange)
                        return "#34C759"; // Strong (Green)
                    }
                    
                    Behavior on width { NumberAnimation { duration: 300; easing.type: Easing.OutQuint } }
                    Behavior on color { ColorAnimation { duration: 300 } }
                }
            }

            Rectangle {
                width: parent.width
                height: 50
                radius: 8
                color: (userInput.text !== "" && passInput.text !== "") ? primaryColor : "#999999"
                
                Text {
                    text: "Next"
                    color: "white"
                    font.pixelSize: 16
                    anchors.centerIn: parent
                }

                MouseArea {
                    anchors.fill: parent
                    enabled: userInput.text !== "" && passInput.text !== ""
                    onClicked: {
                        OOBE.createUserAccount(userInput.text, passInput.text);
                        stackView.push("BiometricPage.qml");
                    }
                }
            }
        }
    }
}
