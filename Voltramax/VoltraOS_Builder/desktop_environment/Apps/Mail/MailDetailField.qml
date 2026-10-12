import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/** Small labelled read-only field used by the detail column. */
Rectangle {
    id: detailField
    property string label: ""
    property string value: ""
    implicitHeight: detailCol.implicitHeight
    color: "transparent"

    ColumnLayout {
        id: detailCol
        anchors.left: parent.left
        anchors.right: parent.right
        spacing: 2

        Text { text: detailField.label; color: "#5b6178"; font.pixelSize: 10 }
        Text {
            Layout.fillWidth: true
            text: detailField.value
            color: "#e8eaf2"
            font.pixelSize: 13
            elide: Text.ElideRight
        }
    }
}