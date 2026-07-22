import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Item {
    id: root
    width: 1920
    height: 1080

    ColumnLayout {
        anchors.centerIn: parent
        spacing: 40

        Text {
            text: "Parental Controls."
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            width: 700
            height: 400
            color: Qt.rgba(255/255, 255/255, 255/255, 0.03)
            border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
            radius: 20
            Layout.alignment: Qt.AlignHCenter

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 40
                spacing: 20

                // Screen Time
                RowLayout {
                    Layout.fillWidth: true
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        Text { text: "Screen Time Limits"; color: "white"; font.pixelSize: 20; font.bold: true; font.family: "Inter" }
                        Text { text: "Automatically lock the device after a set amount of daily usage."; color: "#a0a0a0"; font.pixelSize: 14; font.family: "Inter" }
                    }
                    Switch { checked: true }
                }

                Rectangle { height: 1; Layout.fillWidth: true; color: Qt.rgba(255/255, 255/255, 255/255, 0.1) }

                // Content Filtering
                RowLayout {
                    Layout.fillWidth: true
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        Text { text: "VoltraBrowser Filter"; color: "white"; font.pixelSize: 20; font.bold: true; font.family: "Inter" }
                        Text { text: "Block mature websites, adult content, and unapproved domains in VoltraBrowser."; color: "#a0a0a0"; font.pixelSize: 14; font.family: "Inter" }
                    }
                    Switch { checked: true }
                }

                Rectangle { height: 1; Layout.fillWidth: true; color: Qt.rgba(255/255, 255/255, 255/255, 0.1) }

                // Game Hub Restrictions
                RowLayout {
                    Layout.fillWidth: true
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        Text { text: "Game Hub Restrictions"; color: "white"; font.pixelSize: 20; font.bold: true; font.family: "Inter" }
                        Text { text: "Only allow games rated E for Everyone or manually approved titles in the Game Hub."; color: "#a0a0a0"; font.pixelSize: 14; font.family: "Inter" }
                    }
                    Switch { checked: true }
                }
            }
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 20
            width: 250
            height: 60
            radius: 30
            color: nextMouse.containsMouse ? "#a855f7" : "#9333ea"
            
            Behavior on color { ColorAnimation { duration: 200 } }

            Text {
                anchors.centerIn: parent
                text: "Save & Continue"
                font.family: "Inter"
                font.pixelSize: 20
                font.weight: Font.DemiBold
                color: "white"
            }

            MouseArea {
                id: nextMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: stackView.push("ThemePage.qml")
            }
        }
    }
}
