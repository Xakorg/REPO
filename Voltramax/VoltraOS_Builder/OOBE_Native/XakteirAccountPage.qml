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
            GradientStop { position: 1.0; color: "#1a0a3e" }
        }
    }

    // Xakteir branding bar
    Rectangle {
        width: parent.width
        height: 6
        color: "#FF6B35"
        anchors.top: parent.top
        opacity: 0.8
    }

    Rectangle {
        id: glassPanel
        width: 700
        height: 580
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.9)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 28
            width: parent.width * 0.8

            // Xakteir logo
            RowLayout {
                Layout.alignment: Qt.AlignHCenter
                spacing: 15

                Rectangle {
                    width: 50; height: 50
                    radius: 12
                    color: "#FF6B35"
                    Text { text: "X"; font.pixelSize: 28; font.bold: true; color: "white"; anchors.centerIn: parent }
                }

                ColumnLayout {
                    Text { text: "Sign in to Xakteir"; font.pixelSize: 28; color: "white"; font.bold: true }
                    Text { text: "Sync files, games, settings, and more"; font.pixelSize: 14; color: "#8888aa" }
                }
            }

            Text {
                text: "Access your Xakteir account to sync across all your VoltraOS devices."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Email input
            TextField {
                id: emailInput
                width: parent.width
                placeholderText: "you@xakteir.com"
                font.pixelSize: 18
                font.family: "Inter"
                background: Rectangle { color: "#20FFFFFF"; radius: 10 }
                padding: 16
            }

            // Remember me + Forgot password row
            RowLayout {
                width: parent.width
                spacing: 20

                RowLayout {
                    Layout.weight: 1
                    spacing: 8
                    CheckBox { text: "Remember me"; color: "#a0a0a0"; font.pixelSize: 14 }
                }

                Text {
                    text: "Forgot password?"
                    color: primaryColor
                    font.pixelSize: 14
                    cursorShape: Qt.PointingHandCursor
                    MouseArea {
                        anchors.fill: parent
                        onClicked: { /* Show forgot password */ }
                    }
                }
            }

            // Sign in button
            Rectangle {
                width: parent.width
                height: 54
                radius: 14
                color: "#FF6B35"

                RowLayout {
                    anchors.centerIn: parent
                    spacing: 12

                    Text { text: "🔥"; font.pixelSize: 22 }
                    Text {
                        text: OOBE.isXakteirSignedIn ? "✓ Signed In" : "Sign In with Xakteir"
                        color: "white"
                        font.pixelSize: 18
                        font.bold: true
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        OOBE.signInWithXakteir(emailInput.text);
                        stackView.push("XakAIOptInPage.qml");
                    }
                }
            }

            // Divider
            Row {
                Layout.fillWidth: true
                spacing: 15
                Alignment { horizontal: Qt.AlignHCenter }
                Rectangle { height: 1; width: parent.Layout.fillWidth ? (parent.width * 0.3) : 100; color: "#333333" }
                Text { text: "or"; color: "#666666"; font.pixelSize: 14 }
                Rectangle { height: 1; width: parent.Layout.fillWidth ? (parent.width * 0.3) : 100; color: "#333333" }
            }

            // Alternative sign-in methods
            ColumnLayout {
                width: parent.width
                spacing: 12

                Text { text: "Other sign-in methods"; font.pixelSize: 14; color: "#8888aa" }

                RowLayout {
                    width: parent.width
                    spacing: 12

                    // Google sign-in
                    Rectangle {
                        width: parent.Layout.fillWidth ? (parent.width * 0.33) : 100
                        height: 48
                        radius: 10
                        color: "#4285F4"
                        Text {
                            text: "G"
                            color: "white"
                            font.pixelSize: 20
                            font.bold: true
                            anchors.centerIn: parent
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { /* Google sign-in */ }
                        }
                    }

                    // Apple sign-in
                    Rectangle {
                        width: parent.Layout.fillWidth ? (parent.width * 0.33) : 100
                        height: 48
                        radius: 10
                        color: "#000000"
                        border.color: "#666666"
                        border.width: 1
                        Text {
                            text: "A"
                            color: "white"
                            font.pixelSize: 20
                            font.bold: true
                            anchors.centerIn: parent
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { /* Apple sign-in */ }
                        }
                    }

                    // Email/password
                    Rectangle {
                        width: parent.Layout.fillWidth ? (parent.width * 0.33) : 100
                        height: 48
                        radius: 10
                        color: "#2a2a4a"
                        Text {
                            text: "⋯"
                            color: "#a0a0a0"
                            font.pixelSize: 20
                            anchors.centerIn: parent
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { /* Traditional sign-in */ }
                        }
                    }
                }
            }

            // No account link
            Text {
                text: "Don't have an Xakteir account? Sign up at xakteir.com"
                font.pixelSize: 14
                color: primaryColor
                anchors.horizontalCenter: parent.horizontalCenter
                cursorShape: Qt.PointingHandCursor
                MouseArea {
                    anchors.fill: parent
                    onClicked: { /* Open sign-up page */ }
                }
            }

            // Skip option
            Text {
                text: "Skip →"
                font.pixelSize: 15
                color: "#666688"
                anchors.horizontalCenter: parent.horizontalCenter
                cursorShape: Qt.PointingHandCursor
                MouseArea {
                    anchors.fill: parent
                    onClicked: { stackView.push("XakAIOptInPage.qml"); }
                }
            }
        }
    }

    // Auth status indicator
    Rectangle {
        visible: OOBE.isXakteirSignedIn
        color: "#2034C759"
        border.color: "#34C759"
        border.width: 2
        radius: 10
        anchors {
            bottom: parent.bottom
            horizontalCenter: parent.horizontalCenter
            bottomMargin: 20
        }

        Text {
            text: "✓ Xakteir account verified"
            font.pixelSize: 14
            color: "#34C759"
            anchors.centerIn: parent
        }
    }
}
