import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * SETTING ROW
 *
 * One boolean preference: title, description, switch. Repeated enough times
 * across the settings panes that a component pays for itself, and it keeps
 * the label-to-control pairing - including the implicit accessibility
 * association - in exactly one place.
 *
 * WHY A COMPONENT AND NOT A REPEATER
 * ----------------------------------
 * The rows differ in more than their text: some write straight to the engine,
 * some write to QSettings, and one is permanently on. A model-plus-delegate
 * would need a callback per row anyway, at which point it is a component with
 * worse locality.
 */
Rectangle {
    id: settingRow

    property string title: ""
    property string description: ""
    property bool checked: false
    /** True when the control is shown but not wired to anything yet -
        rendered dimmed so the user can see it exists without being lied to
        about its effect. */
    property bool inert: false

    signal toggled(bool value)

    Layout.fillWidth: true
    implicitHeight: content.implicitHeight
    color: "transparent"
    opacity: settingRow.inert ? 0.55 : 1.0

    Behavior on opacity { NumberAnimation { duration: 120 } }

    RowLayout {
        id: content
        anchors.fill: parent
        spacing: 16

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 3

            Text {
                Layout.fillWidth: true
                text: settingRow.title
                color: "#e8eaf2"
                font.pixelSize: 13
                wrapMode: Text.WordWrap
            }

            Text {
                Layout.fillWidth: true
                text: settingRow.description
                color: "#5b6178"
                font.pixelSize: 11
                wrapMode: Text.WordWrap
            }
        }

        Switch {
            id: sw
            checked: settingRow.checked
            enabled: !settingRow.inert
            onToggled: settingRow.toggled(checked)

            /* The indicator is drawn rather than taken from the style: the
               platform style's switch is a different size on every desktop
               environment, and a settings page whose controls change size
               between machines reads as unfinished. */
            indicator: Rectangle {
                implicitWidth: 40
                implicitHeight: 22
                radius: 11
                color: sw.checked ? "#0052cc" : "#202636"
                border.color: sw.checked ? "#0066ff" : "#2a3040"

                Rectangle {
                    x: sw.checked ? parent.width - width - 2 : 2
                    y: 2
                    width: 18
                    height: 18
                    radius: 9
                    color: "white"
                    Behavior on x { NumberAnimation { duration: 120 } }
                }
            }

            background: Rectangle { color: "transparent" }
        }
    }
}
