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
            text: "Where are you located?"
            font.family: "Syne"
            font.pixelSize: 64
            font.weight: Font.Bold
            color: "white"
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            width: 500
            height: 400
            color: Qt.rgba(255/255, 255/255, 255/255, 0.03)
            border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
            radius: 20
            Layout.alignment: Qt.AlignHCenter
            
            ListView {
                anchors.fill: parent
                anchors.margins: 10
                clip: true
                model: ["English (United States)", "English (United Kingdom)", "Spanish (Spain)", "French (France)", "German (Germany)", "Japanese (Japan)", "Korean (South Korea)"]
                delegate: Rectangle {
                    width: ListView.view.width
                    height: 60
                    color: itemMouseArea.containsMouse ? Qt.rgba(255/255, 255/255, 255/255, 0.1) : "transparent"
                    radius: 10

                    Text {
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.left: parent.left
                        anchors.leftMargin: 20
                        text: modelData
                        font.family: "Inter"
                        font.pixelSize: 22
                        color: "white"
                    }

                    MouseArea {
                        id: itemMouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        onClicked: stackView.push("NetworkPage.qml")
                    }
                }
            }
        }
    }
}
