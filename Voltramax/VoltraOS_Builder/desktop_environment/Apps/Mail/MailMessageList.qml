import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * MESSAGE LIST
 *
 * The centre column: one row per thread, newest first, with the selection
 * that drives the reader pane.
 *
 * WHY THREADS AND NOT MESSAGES
 * ----------------------------
 * The list shows `MailEngine.threads`, not `MailEngine.messages`. A list that
 * shows every message individually buries older replies three screens down,
 * and every mail client that tried it (Outlook 2003's default view, early
 * Gmail) reverted to threads. `MailThreadModel` derives a thread from the
 * messages the cache already holds, so no extra query is needed.
 *
 * OPTIMISTIC ROWS
 * ---------------
 * Tapping archive/star calls straight through to the model, which applies the
 * change locally and queues a mutation. The row disappears immediately and
 * the queue drains in the background. If the server rejects it, the model
 * reverts and emits `patchRejected`, which the engine turns into the error
 * line at the bottom of the window. The user never sees a row move twice.
 *
 * VIRTUALISATION
 * --------------
 * The ListView reuses delegates and pages in more rows through
 * `MailEngine.threads.loadMore()`. A mailbox with 40 000 cached messages
 * renders the first screen in one frame.
 */
Rectangle {
    id: messageList
    color: "transparent"

    signal threadOpened(string threadId, string messageId)
    signal composeRequested()

    /** Index of the highlighted row; -1 for none. */
    property int currentIndex: -1
    /** True while the first page is still loading. */
    property bool loading: threadsModel && threadsModel.loading ? threadsModel.loading : false

    /* The model is the engine's thread model, pulled in as a context
       property so delegates can bind to its roles directly. */
    property var threadsModel: MailEngine.threads

    /* ------------------------------------------------------------------ */
    /* Header: folder title + refresh                                      */
    /* ------------------------------------------------------------------ */
    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 46
            color: "transparent"

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 12
                spacing: 10

                Text {
                    Layout.fillWidth: true
                    text: MailEngine.folder.charAt(0).toUpperCase() + MailEngine.folder.slice(1)
                    color: "white"
                    font.pixelSize: 15
                    font.bold: true
                    elide: Text.ElideRight
                }

                Text {
                    visible: MailEngine.searchTerms.length > 0
                    text: "\"" + MailEngine.searchTerms + "\""
                    color: "#7d849c"
                    font.pixelSize: 11
                    elide: Text.ElideRight
                    Layout.maximumWidth: 160
                }

                /* Spinner: a rotating arc, not a fake progress bar. A bar
                   that lies about how far along it is erodes trust faster
                   than no indicator at all. */
                Canvas {
                    id: spinner
                    Layout.preferredWidth: 16
                    Layout.preferredHeight: 16
                    visible: messageList.loading
                    onPaint: {
                        var ctx = getContext("2d")
                        ctx.reset()
                        ctx.strokeStyle = "#0066ff"
                        ctx.lineWidth = 2
                        ctx.lineCap = "round"
                        ctx.beginPath()
                        ctx.arc(width / 2, height / 2, 6, 0.4, 4.6, false)
                        ctx.stroke()
                    }
                    RotationAnimation on rotation {
                        running: messageList.loading
                        loops: Animation.Infinite
                        from: 0; to: 360
                        duration: 900
                    }
                }

                Button {
                    text: "\u21BB"
                    flat: true
                    onClicked: MailEngine.refresh()
                    background: Rectangle {
                        radius: 6
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#a9aec1"
                        font.pixelSize: 14
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    ToolTip.visible: hovered
                    ToolTip.text: "Sync now (Ctrl+R)"
                }
            }

            Rectangle {
                anchors.bottom: parent.bottom
                width: parent.width; height: 1
                color: "#181c28"
            }
        }

        /* ------------------------------------------------------------------ */
        /* The list                                                            */
        /* ------------------------------------------------------------------ */
        ListView {
            id: threadList
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            model: messageList.threadsModel
            boundsBehavior: Flickable.StopAtBounds
            highlightMoveDuration: 120
            spacing: 0

            ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

            /* Page in more rows when the user nears the bottom. */
            onAtYEndChanged: {
                if (atYEnd && count > 0)
                    messageList.threadsModel.loadMore()
            }

            delegate: Rectangle {
                id: row
                required property int index
                required property string threadId
                required property string subject
                required property string snippet
                required property string senderName
                required property string senderAddress
                required property string preview
                required property string sentAt
                required property bool isRead
                required property bool isStarred
                required property bool isPinned
                required property bool hasAttachments
                required property int messageCount
                required property int unreadCount
                required property var labels

                width: threadList.width
                height: rowContent.implicitHeight + 18
                color: rowMouse.containsMouse ? "#12151f"
                     : (messageList.currentIndex === index ? "#151a26" : "transparent")

                /* A pinned row is separated by a hairline, the one cue that
                   survives grayscale printing and colour-blindness. */
                Rectangle {
                    visible: row.isPinned
                    anchors.top: parent.top
                    width: parent.width; height: 1
                    color: "#2a3040"
                }

                RowLayout {
                    id: rowContent
                    anchors.fill: parent
                    anchors.leftMargin: 14
                    anchors.rightMargin: 14
                    anchors.topMargin: 9
                    anchors.bottomMargin: 9
                    spacing: 12

                    /* Star toggle. The star is a verb, so it is clickable. */
                    Text {
                        Layout.preferredWidth: 18
                        Layout.alignment: Qt.AlignTop
                        topPadding: 2
                        text: row.isStarred ? "\u2605" : "\u2606"
                        color: row.isStarred ? "#ffd166" : "#5b6178"
                        font.pixelSize: 15
                        MouseArea {
                            anchors.fill: parent
                            anchors.margins: -6
                            cursorShape: Qt.PointingHandCursor
                            onClicked: messageList.threadsModel.toggleStar(row.threadId)
                        }
                    }

                    /* Unread dot. Unread is a dot, not bold-only, because
                       weight alone is invisible at 12px. */
                    Rectangle {
                        Layout.preferredWidth: 8
                        Layout.alignment: Qt.AlignTop
                        topPadding: 7
                        width: 8; height: 8; radius: 4
                        color: row.isRead ? "transparent" : "#0066ff"
                        border.color: row.isRead ? "#2a3040" : "transparent"
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 3

                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 8

                            Text {
                                Layout.fillWidth: true
                                text: row.senderName.length > 0 ? row.senderName : row.senderAddress
                                color: row.isRead ? "#c3c8d8" : "#ffffff"
                                font.pixelSize: 13
                                font.weight: row.isRead ? Font.Normal : Font.DemiBold
                                elide: Text.ElideRight
                            }

                            Text {
                                visible: row.messageCount > 1
                                text: "(" + row.messageCount + ")"
                                color: "#5b6178"
                                font.pixelSize: 10
                            }

                            Text {
                                text: row.sentAt
                                color: row.isRead ? "#5b6178" : "#a9aec1"
                                font.pixelSize: 11
                            }
                        }

                        Text {
                            Layout.fillWidth: true
                            text: row.subject.length > 0 ? row.subject : "(no subject)"
                            color: row.isRead ? "#8f96ab" : "#e8eaf2"
                            font.pixelSize: 13
                            font.weight: row.isRead ? Font.Normal : Font.Bold
                            elide: Text.ElideRight
                        }

                        Text {
                            Layout.fillWidth: true
                            text: row.snippet.length > 0 ? row.snippet : row.preview
                            color: "#5b6178"
                            font.pixelSize: 12
                            elide: Text.ElideRight
                            maximumLineCount: 1
                        }

                        /* Labels / attachment chips. Only rendered when
                           there is something to render; an empty RowLayout
                           costs a layout pass on every row otherwise. */
                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 6
                            visible: (row.labels && row.labels.length > 0) || row.hasAttachments

                            Repeater {
                                model: row.labels ? row.labels : []

                                delegate: Rectangle {
                                    required property var modelData
                                    Layout.preferredHeight: 16
                                    Layout.preferredWidth: labelText.implicitWidth + 12
                                    radius: 3
                                    color: "#202636"

                                    Text {
                                        id: labelText
                                        anchors.centerIn: parent
                                        text: String(modelData)
                                        color: "#a9aec1"
                                        font.pixelSize: 9
                                    }
                                }
                            }

                            Rectangle {
                                visible: row.hasAttachments
                                Layout.preferredHeight: 16
                                Layout.preferredWidth: attachLabel.implicitWidth + 12
                                radius: 3
                                color: "#202636"

                                Text {
                                    id: attachLabel
                                    anchors.centerIn: parent
                                    text: "\u29C9"
                                    color: "#a9aec1"
                                    font.pixelSize: 9
                                }
                            }

                            Item { Layout.fillWidth: true }

                            Text {
                                visible: row.unreadCount > 0
                                text: row.unreadCount + " unread"
                                color: "#0066ff"
                                font.pixelSize: 10
                                font.bold: true
                            }
                        }
                    }
                }

                Rectangle {
                    anchors.bottom: parent.bottom
                    x: 14
                    width: parent.width - 28
                    height: 1
                    color: "#14171f"
                }

                MouseArea {
                    id: rowMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    acceptedButtons: Qt.LeftButton | Qt.MiddleButton

                    onClicked: function(mouse) {
                        messageList.currentIndex = row.index
                        if (mouse.button === Qt.MiddleButton) {
                            /* Middle-click archives, as in Gmail and every
                               Linux mail client since thunderbird 1.0. */
                            messageList.threadsModel.archive(row.threadId)
                        } else {
                            messageList.threadOpened(row.threadId, "")
                        }
                    }
                }

                /* Right-click actions. Kept in the delegate rather than a
                   Menu instance per list so the actions can see the row's
                   ids without a lookup. */
                MouseArea {
                    anchors.fill: parent
                    acceptedButtons: Qt.RightButton
                    z: 1
                    onClicked: {
                        messageList.currentIndex = row.index
                        contextMenu.threadId = row.threadId
                        contextMenu.popup()
                    }
                }
            }

            /* ---- empty state ---- */
            Rectangle {
                anchors.centerIn: parent
                visible: threadList.count === 0 && !messageList.loading
                width: emptyColumn.width
                height: emptyColumn.height

                ColumnLayout {
                    id: emptyColumn
                    spacing: 8

                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: "\u2709"
                        color: "#2a3040"
                        font.pixelSize: 44
                    }
                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        text: MailEngine.searchTerms.length > 0
                              ? "No messages match your search"
                              : (MailEngine.folder === "inbox" ? "You're all caught up" : "This folder is empty")
                        color: "#a9aec1"
                        font.pixelSize: 15
                        font.bold: true
                    }
                    Text {
                        Layout.alignment: Qt.AlignHCenter
                        Layout.maximumWidth: 300
                        wrapMode: Text.WordWrap
                        horizontalAlignment: Text.AlignHCenter
                        text: MailEngine.searchTerms.length > 0
                              ? "Try fewer words, or search every folder with Ctrl+Shift+F."
                              : "New mail will appear here as soon as it syncs."
                        color: "#5b6178"
                        font.pixelSize: 12
                    }
                    Button {
                        Layout.alignment: Qt.AlignHCenter
                        visible: MailEngine.searchTerms.length === 0
                        text: "Compose a message"
                        onClicked: messageList.composeRequested()
                        background: Rectangle {
                            radius: 8
                            color: parent.hovered ? "#0066ff" : "#0052cc"
                        }
                        contentItem: Text {
                            text: parent.text
                            color: "white"
                            font.pixelSize: 12
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }
                }
            }

            /* ---- end-of-list footnote ---- */
            footer: Item {
                width: threadList.width
                height: 40
                visible: threadList.count > 0

                Text {
                    anchors.centerIn: parent
                    text: messageList.threadsModel.hasMore
                          ? "Scroll for more..."
                          : "End of " + MailEngine.folder
                    color: "#3d4356"
                    font.pixelSize: 11
                }
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /* Context menu                                                        */
    /* ------------------------------------------------------------------ */
    Menu {
        id: contextMenu
        property string threadId: ""

        MenuItem {
            text: "Mark as read"
            onTriggered: messageList.threadsModel.setRead(contextMenu.threadId, true)
        }
        MenuItem {
            text: "Mark as unread"
            onTriggered: messageList.threadsModel.setRead(contextMenu.threadId, false)
        }
        MenuItem {
            text: "Star / unstar"
            onTriggered: messageList.threadsModel.toggleStar(contextMenu.threadId)
        }
        MenuSeparator {}
        MenuItem {
            text: "Archive (E)"
            onTriggered: messageList.threadsModel.archive(contextMenu.threadId)
        }
        MenuItem {
            text: "Move to spam"
            onTriggered: messageList.threadsModel.markSpam(contextMenu.threadId)
        }
        MenuItem {
            text: "Move to trash (Shift+3)"
            onTriggered: messageList.threadsModel.markTrash(contextMenu.threadId)
        }
        MenuSeparator {}
        MenuItem {
            text: "Select all"
            onTriggered: messageList.threadsModel.selectAll && messageList.threadsModel.selectAll()
        }
    }

    /* ------------------------------------------------------------------ */
    /* Keyboard-driving helpers, called by the shell's Shortcut items.     */
    /* ------------------------------------------------------------------ */

    function moveSelection(delta) {
        if (threadsModel.count === 0)
            return
        var next = currentIndex + delta
        if (next < 0) next = 0
        if (next >= threadsModel.count) next = threadsModel.count - 1
        currentIndex = next
        threadList.positionViewAtIndex(next, ListView.Contain)
        var id = threadsModel.dataAt(next, "threadId")
        if (id)
            threadOpened(id, "")
    }

    function openSelection() {
        if (currentIndex < 0) return
        var id = threadsModel.dataAt(currentIndex, "threadId")
        if (id) threadOpened(id, "")
    }

    function archiveSelection() {
        if (currentIndex < 0) return
        var id = threadsModel.dataAt(currentIndex, "threadId")
        if (!id) return
        threadsModel.archive(id)
        if (currentIndex >= threadsModel.count)
            currentIndex = threadsModel.count - 1
    }

    function trashSelection() {
        if (currentIndex < 0) return
        var id = threadsModel.dataAt(currentIndex, "threadId")
        if (!id) return
        threadsModel.markTrash(id)
        if (currentIndex >= threadsModel.count)
            currentIndex = threadsModel.count - 1
    }

    function toggleStarSelection() {
        if (currentIndex < 0) return
        var id = threadsModel.dataAt(currentIndex, "threadId")
        if (id) threadsModel.toggleStar(id)
    }

    /* Clear the highlight when the folder changes; a highlighted row in the
       wrong folder is a lie about where the selection is. */
    Connections {
        target: MailEngine
        function onQueryChanged() {
            messageList.currentIndex = -1
            threadList.positionViewAtBeginning()
        }
        function onSelectionChanged() {
            if (MailEngine.selectedThreadId.length > 0) {
                for (var i = 0; i < messageList.threadsModel.count; i++) {
                    if (messageList.threadsModel.dataAt(i, "threadId") === MailEngine.selectedThreadId) {
                        messageList.currentIndex = i
                        break
                    }
                }
            }
        }
    }
}
