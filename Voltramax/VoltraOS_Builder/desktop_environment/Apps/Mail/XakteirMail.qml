import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

/**
 * XAKTEIR MAIL - APPLICATION SHELL
 *
 * The root window. It owns the three-pane layout and the top-level keyboard
 * handling, and delegates everything else to the focused components:
 *
 *   +------------------------------------------------------------------+
 *   |  toolbar: account switcher | search | sync state | compose       |
 *   +------------------------------------------------------------------+
 *   | sidebar | message list        | reader / composer               |
 *   | folders |                     |                                 |
 *   | labels  |                     |                                 |
 *   +------------------------------------------------------------------+
 *
 * It deliberately contains no data fetching. Every read goes through
 * `MailEngine`, every list is a model the engine owns, and this file is
 * purely composition. Keeping the shell free of state means a layout change
 * cannot break the sync logic, and a sync change cannot break the layout.
 */
Window {
    id: mailWindow
    width: 1440
    height: 900
    minimumWidth: 1040
    minimumHeight: 640
    visible: true
    title: "Xakteir Mail"
    color: "#090b11"

    /* ---- window-level state ---- */

    /** Which right-hand pane is showing. "reader" | "composer" | "none". */
    property string rightPane: "none"
    /** True when the settings overlay covers the whole window. */
    property bool settingsOpen: false
    /** True when the account manager overlay is showing. */
    property bool accountsOpen: false
    /** True when the shortcut sheet overlay is showing. */
    property bool shortcutsOpen: false
    /** True when the sidebar is collapsed to icons only. */
    property bool sidebarCollapsed: false
    /** The inbox category tab: primary/social/promotions/etc. */
    property string category: "primary"

    /* ---- helpers ---- */

    function openComposer(request) {
        rightPane = "composer"
        composer.load(request || {})
    }

    function openReader(threadId, messageId) {
        MailEngine.selectThread(threadId || "")
        if (messageId)
            MailEngine.selectMessage(messageId)
        rightPane = "reader"
    }

    function closeRightPane() {
        rightPane = "none"
        MailEngine.clearSelection()
    }

    /** Formats an unread count for the sidebar and the window title. */
    function unreadLabel(count) {
        if (count <= 0) return ""
        if (count > 99) return "99+"
        return String(count)
    }

    /** Sync state shown in the toolbar, spelled out for the user. */
    function syncLabel() {
        if (!MailEngine.signedIn) return "Signed out"
        if (MailEngine.busy) return "Syncing..."
        if (!MailEngine.online) return "Offline"
        if (MailEngine.pendingCount > 0)
            return MailEngine.pendingCount + " change(s) waiting"
        return "Up to date"
    }

    onActiveChanged: {
        // Returning to the window is a natural moment to catch up. The engine
        // coalesces this with any in-flight request, so it never queues a
        // second pull behind the first.
        if (active && MailEngine.signedIn && MailEngine.online)
            MailEngine.refresh()
    }

    /* ==================================================================== */
    /* Global shortcuts                                                      */
    /* ==================================================================== */

    Shortcut {
        sequence: "Ctrl+N"
        onActivated: mailWindow.openComposer({})
    }
    Shortcut {
        sequence: "Ctrl+Shift+F"
        onActivated: searchPanel.forceActiveFocus()
    }
    Shortcut {
        sequence: "Ctrl+/"
        onActivated: mailWindow.shortcutsOpen = !mailWindow.shortcutsOpen
    }
    Shortcut {
        sequence: "Ctrl+,"
        onActivated: mailWindow.settingsOpen = !mailWindow.settingsOpen
    }
    Shortcut {
        sequence: "Escape"
        onActivated: {
            if (mailWindow.shortcutsOpen) mailWindow.shortcutsOpen = false
            else if (mailWindow.settingsOpen) mailWindow.settingsOpen = false
            else if (mailWindow.accountsOpen) mailWindow.accountsOpen = false
            else if (mailWindow.rightPane === "composer") mailWindow.closeRightPane()
        }
    }
    Shortcut {
        sequence: "Ctrl+R"
        onActivated: MailEngine.refresh()
    }
    Shortcut {
        sequence: "Ctrl+Shift+A"
        onActivated: MailEngine.markAllRead()
    }
    /** J/K move through the list, as in every other mail client. */
    Shortcut {
        sequence: "J"
        onActivated: messageList.moveSelection(1)
    }
    Shortcut {
        sequence: "K"
        onActivated: messageList.moveSelection(-1)
    }
    /** E archives the selected message. */
    Shortcut {
        sequence: "E"
        onActivated: messageList.archiveSelection()
    }
    /** # moves it to trash. */
    Shortcut {
        sequence: "Shift+3"
        onActivated: messageList.trashSelection()
    }
    /** S toggles the star. */
    Shortcut {
        sequence: "S"
        onActivated: messageList.toggleStarSelection()
    }
    /** Enter opens the selected thread. */
    Shortcut {
        sequence: "Return"
        onActivated: messageList.openSelection()
    }

    /* ==================================================================== */
    /* Layout                                                                */
    /* ==================================================================== */

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#101322" }
            GradientStop { position: 0.5; color: "#090b11" }
            GradientStop { position: 1.0; color: "#0c1019" }
        }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        /* ---- toolbar ---- */
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 64
            color: "#bb0c0f17"
            border.color: "#20ffffff"

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 20
                anchors.rightMargin: 20
                spacing: 16

                Button {
                    text: mailWindow.sidebarCollapsed ? "\u2630" : "\u2261"
                    flat: true
                    onClicked: mailWindow.sidebarCollapsed = !mailWindow.sidebarCollapsed
                    background: Rectangle {
                        radius: 8
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#a9aec1"
                        font.pixelSize: 18
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }

                Text {
                    text: "MAIL"
                    color: "white"
                    font.pixelSize: 18
                    font.bold: true
                    font.letterSpacing: 3
                }

                Rectangle { width: 1; height: 26; color: "#33ffffff" }

                MailSearchPanel {
                    id: searchPanel
                    Layout.fillWidth: true
                    Layout.preferredHeight: 40
                }

                Item { Layout.preferredWidth: 8 }

                /** Sync state. Colour is the state; text explains it. */
                Rectangle {
                    Layout.preferredHeight: 30
                    Layout.preferredWidth: syncStatus.implicitWidth + 28
                    radius: 15
                    color: "#151925"
                    border.color: {
                        if (!MailEngine.signedIn) return "#ff6b6b"
                        if (MailEngine.busy) return "#ffd166"
                        if (!MailEngine.online) return "#ff9f43"
                        return "#2ecc71"
                    }

                    Text {
                        id: syncStatus
                        anchors.centerIn: parent
                        text: mailWindow.syncLabel()
                        color: "#a9aec1"
                        font.pixelSize: 12
                    }

                    MouseArea {
                        anchors.fill: parent
                        onClicked: MailEngine.refresh()
                        ToolTip.visible: hovered
                        ToolTip.text: "Click to sync now"
                    }
                }

                Button {
                    text: "\u270E  Compose"
                    onClicked: mailWindow.openComposer({})
                    background: Rectangle {
                        radius: 10
                        color: parent.down ? "#0052cc" : (parent.hovered ? "#0066ff" : "#0052cc")
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "white"
                        font.pixelSize: 13
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }

                Button {
                    text: "\u2699"
                    flat: true
                    onClicked: mailWindow.settingsOpen = !mailWindow.settingsOpen
                    background: Rectangle {
                        radius: 8
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#a9aec1"
                        font.pixelSize: 16
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }
        }

        /* ---- main body ---- */
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            Rectangle {
                Layout.fillWidth: false
                Layout.fillHeight: true
                Layout.preferredWidth: mailWindow.sidebarCollapsed ? 64 : 236
                color: "#0d1018"
                border.color: "#181c28"

                Behavior on Layout.preferredWidth {
                    NumberAnimation { duration: 140; easing.type: Easing.OutCubic }
                }

                MailSidebar {
                    id: sidebar
                    anchors.fill: parent
                    collapsed: mailWindow.sidebarCollapsed
                    category: mailWindow.category
                    onCategorySelected: function(cat) {
                        mailWindow.category = cat
                        MailEngine.setCategory(cat)
                    }
                    onFolderSelected: function(folder) {
                        MailEngine.openFolder(folder)
                        if (mailWindow.rightPane === "composer")
                            mailWindow.closeRightPane()
                    }
                    onComposeRequested: mailWindow.openComposer({})
                    onAccountsRequested: mailWindow.accountsOpen = true
                }
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                Layout.preferredWidth: 440
                Layout.maximumWidth: 620
                color: "#0b0e15"
                border.color: "#181c28"

                MailMessageList {
                    id: messageList
                    anchors.fill: parent
                    onThreadOpened: function(threadId, messageId) {
                        mailWindow.openReader(threadId, messageId)
                    }
                    onComposeRequested: mailWindow.openComposer({})
                }
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: "#090b11"
                border.color: "#181c28"
                visible: mailWindow.rightPane !== "none"

                /** The reader and the composer occupy the same slot, so
                    switching between them does not rebuild the sidebar. */
                MailThreadReader {
                    id: reader
                    anchors.fill: parent
                    visible: mailWindow.rightPane === "reader"
                    onCloseRequested: mailWindow.closeRightPane()
                    onReplyRequested: function(request) {
                        mailWindow.openComposer(request)
                    }
                }

                MailComposer {
                    id: composer
                    anchors.fill: parent
                    visible: mailWindow.rightPane === "composer"
                    onCloseRequested: mailWindow.closeRightPane()
                    onSent: function(result) {
                        mailWindow.closeRightPane()
                        MailEngine.refresh()
                    }
                }
            }
        }
    }

    /* ==================================================================== */
    /* Overlays                                                              */
    /* ==================================================================== */

    /** A dimmed backdrop so the overlay reads as modal without a Dialog. */
    Rectangle {
        anchors.fill: parent
        color: "#cc000000"
        visible: mailWindow.settingsOpen || mailWindow.accountsOpen || mailWindow.shortcutsOpen
        z: 90

        MouseArea {
            anchors.fill: parent
            onClicked: {
                mailWindow.settingsOpen = false
                mailWindow.accountsOpen = false
                mailWindow.shortcutsOpen = false
            }
        }
    }

    MailSettingsPane {
        id: settingsPane
        anchors.fill: parent
        z: 100
        visible: mailWindow.settingsOpen
        onCloseRequested: mailWindow.settingsOpen = false
        onManageAccounts: {
            mailWindow.settingsOpen = false
            mailWindow.accountsOpen = true
        }
    }

    MailAccountManager {
        id: accountManager
        anchors.fill: parent
        z: 100
        visible: mailWindow.accountsOpen
        onCloseRequested: mailWindow.accountsOpen = false
    }

    MailShortcutSheet {
        id: shortcutSheet
        anchors.fill: parent
        z: 100
        visible: mailWindow.shortcutsOpen
        onCloseRequested: mailWindow.shortcutsOpen = false
    }

    /* ==================================================================== */
    /* Empty state                                                           */
    /* ==================================================================== */

    /** Shown before the cache has any data, so the first launch is not a
        blank pane with no explanation of what is happening. */
    Rectangle {
        anchors.fill: parent
        z: 50
        visible: MailEngine.state === "booting" || MailEngine.state === "signed-out"
        color: "#f2090b11"

        ColumnLayout {
            anchors.centerIn: parent
            spacing: 14

            Text {
                Layout.alignment: Qt.AlignHCenter
                text: MailEngine.state === "booting" ? "Opening your mailbox..." : "Sign in to Xakteir"
                color: "white"
                font.pixelSize: 24
                font.bold: true
            }

            Text {
                Layout.alignment: Qt.AlignHCenter
                Layout.maximumWidth: 460
                Layout.preferredWidth: 460
                wrapMode: Text.WordWrap
                horizontalAlignment: Text.AlignHCenter
                text: MailEngine.state === "booting"
                    ? "Reading the local cache and checking for new mail."
                    : "Xakteir Mail needs your Xakteir account before it can "
                      + "sync. Nothing is stored on this device until you do."
                color: "#a9aec1"
                font.pixelSize: 14
            }

            Button {
                Layout.alignment: Qt.AlignHCenter
                Layout.preferredHeight: 44
                Layout.preferredWidth: 200
                visible: MailEngine.state === "signed-out"
                text: "Sign in"
                onClicked: MailEngine.refresh()
                background: Rectangle {
                    radius: 10
                    color: parent.down ? "#0052cc" : "#0066ff"
                }
                contentItem: Text {
                    text: parent.text
                    color: "white"
                    font.pixelSize: 14
                    font.bold: true
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
            }

            /** An error is shown here rather than swallowed. A mail client
                that fails silently is one the user gives up on. */
            Text {
                Layout.alignment: Qt.AlignHCenter
                Layout.maximumWidth: 520
                Layout.preferredWidth: 520
                visible: MailEngine.lastError.length > 0
                wrapMode: Text.WordWrap
                horizontalAlignment: Text.AlignHCenter
                text: MailEngine.lastError
                color: "#ff6b6b"
                font.pixelSize: 13
            }
        }
    }

    /** The error line persists past the empty state, because a failure can
        happen at any time, not just at boot. */
    Rectangle {
        Layout.fillWidth: true
        visible: MailEngine.lastError.length > 0
        color: "#33ff6b6b"
        height: errorLabel.implicitHeight + 14
        anchors.bottom: parent.bottom
        z: 80

        Text {
            id: errorLabel
            anchors.centerIn: parent
            width: parent.width - 24
            wrapMode: Text.WordWrap
            text: MailEngine.lastError
            color: "#ffd6d6d6"
            font.pixelSize: 12
        }

        MouseArea {
            anchors.fill: parent
            onClicked: MailEngine.refresh()
            ToolTip.visible: hovered
            ToolTip.text: "Click to retry"
        }
    }

    Component.onCompleted: {
        MailEngine.start()
        if (MailEngine.signedIn)
            rightPane = "reader"
    }
}
