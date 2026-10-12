import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * MAIL SIDEBAR
 *
 * Folder tree, category tabs, label list, and the compose button. The sidebar
 * is the app's map: wherever the user is, the sidebar says where.
 *
 * COLLAPSED MODE
 * --------------
 * When collapsed it becomes a 64px icon rail. Every row keeps its icon in that
 * mode, because an icon rail with blank rows is a guessing game. The counts
 * are dropped instead - "99+" does not fit in 64px and a truncated number
 * reads as a bug.
 *
 * NO DATA FETCHING
 * ----------------
 * Counts come from `MailEngine` properties, which the cache invalidates. The
 * sidebar never asks for anything itself, so a slow count never blocks a
 * paint.
 */
Rectangle {
    id: sidebar
    color: "transparent"

    /** True when collapsed to the icon rail. */
    property bool collapsed: false
    /** Current inbox category tab. */
    property string category: "primary"

    signal categorySelected(string cat)
    signal folderSelected(string folder)
    signal composeRequested()
    signal accountsRequested()

    /* ------------------------------------------------------------------ */
    /* Folder model. Mirrors MailFolder in MailTypes.h and the web's       */
    /* MailFolder in src/lib/mail/types.ts so the three stay in step.      */
    /* ------------------------------------------------------------------ */
    readonly property var folders: [
        { key: "inbox",   name: "Inbox",     icon: "\u25C6", unread: MailEngine.unreadCount },
        { key: "starred", name: "Starred",   icon: "\u2605", unread: 0 },
        { key: "snoozed", name: "Snoozed",   icon: "\u23F0", unread: 0 },
        { key: "sent",    name: "Sent",      icon: "\u2709", unread: 0 },
        { key: "drafts",  name: "Drafts",    icon: "\u270E", unread: 0 },
        { key: "outbox",  name: "Outbox",    icon: "\u2B07", unread: 0 },
        { key: "archive", name: "Archive",   icon: "\u2B1B", unread: 0 },
        { key: "spam",    name: "Spam",      icon: "\u26A0", unread: 0 },
        { key: "trash",   name: "Trash",     icon: "\u2715", unread: 0 }
    ]

    readonly property var categories: [
        { key: "primary",    name: "Primary" },
        { key: "social",     name: "Social" },
        { key: "promotions", name: "Promotions" },
        { key: "updates",    name: "Updates" },
        { key: "forums",     name: "Forums" }
    ]

    /** The currently-selected folder, read back from the engine so the
        highlight survives a reload. */
    property string currentFolder: MailEngine.folder

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 8
        spacing: 6

        /* ---- compose ---- */
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 46
            radius: 12
            color: composeMouse.containsMouse ? "#0066ff" : "#0052cc"

            Behavior on color { ColorAnimation { duration: 120 } }

            RowLayout {
                anchors.centerIn: parent
                spacing: 8

                Text {
                    text: "\u270E"
                    color: "white"
                    font.pixelSize: 16
                    visible: !sidebar.collapsed
                }
                Text {
                    text: sidebar.collapsed ? "\u270E" : "Compose"
                    color: "white"
                    font.pixelSize: 14
                    font.bold: true
                    visible: true
                }
            }

            MouseArea {
                id: composeMouse
                anchors.fill: parent
                hoverEnabled: true
                onClicked: sidebar.composeRequested()
            }
        }

        Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 2; color: "#1a1e2b" }

        /* ---- category tabs (inbox only) ---- */
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 2
            visible: sidebar.currentFolder === "inbox" && !sidebar.collapsed

            Text {
                text: "CATEGORIES"
                color: "#5b6178"
                font.pixelSize: 10
                font.letterSpacing: 2
                leftPadding: 10
                bottomPadding: 4
            }

            Repeater {
                model: sidebar.categories

                delegate: Rectangle {
                    required property var modelData
                    Layout.fillWidth: true
                    Layout.preferredHeight: 30
                    radius: 8
                    color: catMouse.containsMouse ? "#151925" : "transparent"
                    border.color: sidebar.category === modelData.key ? "#0066ff" : "transparent"

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 12
                        anchors.rightMargin: 10
                        spacing: 8

                        Rectangle {
                            visible: sidebar.category === modelData.key
                            width: 6; height: 6; radius: 3
                            color: "#0066ff"
                        }
                        Item { visible: sidebar.category !== modelData.key; width: 6; height: 6 }

                        Text {
                            Layout.fillWidth: true
                            text: modelData.name
                            color: sidebar.category === modelData.key ? "#ffffff" : "#a9aec1"
                            font.pixelSize: 13
                            elide: Text.ElideRight
                        }
                    }

                    MouseArea {
                        id: catMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: sidebar.categorySelected(modelData.key)
                    }
                }
            }

            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 2; color: "#1a1e2b"; Layout.topMargin: 6; Layout.bottomMargin: 4 }
        }

        /* ---- folders ---- */
        Text {
            visible: !sidebar.collapsed
            text: "FOLDERS"
            color: "#5b6178"
            font.pixelSize: 10
            font.letterSpacing: 2
            leftPadding: 10
            bottomPadding: 2
        }

        ListView {
            id: folderList
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            spacing: 2
            boundsBehavior: Flickable.StopAtBounds
            model: sidebar.folders

            ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

            delegate: Rectangle {
                required property var modelData
                width: folderList.width
                height: 34
                radius: 8
                color: folderMouse.containsMouse ? "#151925" : "transparent"
                border.color: sidebar.currentFolder === modelData.key ? "#2a3040" : "transparent"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 10
                    anchors.rightMargin: 10
                    spacing: 10

                    Text {
                        text: modelData.icon
                        color: sidebar.currentFolder === modelData.key ? "#ffffff" : "#7d849c"
                        font.pixelSize: 13
                        Layout.preferredWidth: 18
                        horizontalAlignment: Text.AlignHCenter
                    }

                    Text {
                        Layout.fillWidth: true
                        visible: !sidebar.collapsed
                        text: modelData.name
                        color: sidebar.currentFolder === modelData.key ? "#ffffff" : "#a9aec1"
                        font.pixelSize: 13
                        font.weight: sidebar.currentFolder === modelData.key ? Font.DemiBold : Font.Normal
                        elide: Text.ElideRight
                    }

                    /* The inbox count is live; the others are placeholders
                       until a per-folder count query is added to MailCache.
                       Showing a real zero is better than showing a stale
                       number the user will learn to ignore. */
                    Rectangle {
                        visible: !sidebar.collapsed && modelData.unread > 0
                        Layout.preferredWidth: countLabel.implicitWidth + 14
                        Layout.preferredHeight: 18
                        radius: 9
                        color: sidebar.currentFolder === modelData.key ? "#0066ff" : "#202636"

                        Text {
                            id: countLabel
                            anchors.centerIn: parent
                            text: modelData.unread > 99 ? "99+" : String(modelData.unread)
                            color: "white"
                            font.pixelSize: 10
                            font.bold: true
                        }
                    }
                }

                MouseArea {
                    id: folderMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: sidebar.folderSelected(modelData.key)
                }
            }
        }

        Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#1a1e2b" }

        /* ---- footer: accounts + diagnostics ---- */
        RowLayout {
            Layout.fillWidth: true
            Layout.preferredHeight: 36
            spacing: 6

            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                radius: 8
                color: acctMouse.containsMouse ? "#151925" : "transparent"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 10
                    anchors.rightMargin: 6
                    spacing: 8

                    Text {
                        text: "\u25C8"
                        color: "#7d849c"
                        font.pixelSize: 13
                        Layout.preferredWidth: 18
                        horizontalAlignment: Text.AlignHCenter
                    }
                    Text {
                        Layout.fillWidth: true
                        visible: !sidebar.collapsed
                        text: "Accounts"
                        color: "#a9aec1"
                        font.pixelSize: 13
                        elide: Text.ElideRight
                    }
                }

                MouseArea {
                    id: acctMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: sidebar.accountsRequested()
                }
            }
        }

        /* ---- pending-sync footnote ---- */
        Text {
            Layout.fillWidth: true
            visible: !sidebar.collapsed && MailEngine.pendingCount > 0
            text: MailEngine.pendingCount + " change(s) waiting to sync"
            color: "#5b6178"
            font.pixelSize: 10
            leftPadding: 10
            rightPadding: 10
            elide: Text.ElideRight
        }
    }
}
