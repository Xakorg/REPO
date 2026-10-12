import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * COMPOSER
 *
 * A full-height pane in the same slot as the reader, so switching between
 * reading and writing does not reflow the sidebar or the list.
 *
 * DRAFT LIFECYCLE
 * ----------------
 * The composer never holds the only copy of a draft. `load()` writes a row to
 * MailCache immediately (the `drafts` table), and every field change marks it
 * dirty after a short debounce. On close, the row is kept. On send, the row
 * is handed to the send route with an idempotency key, and only deleted once
 * the server confirms. A crash mid-compose loses at most one keystroke batch.
 *
 * WHY NOT AN EDITORIALLY-RICH TEXT BOX
 * ------------------------------------
 * The body is a plain TextArea. Rich text composition (bold, colour, tables)
 * needs a document model that Qt Quick does not ship, and the HTML path is
 * covered by the web client. The plain body is converted to HTML by the
 * server's `buildMimeMessage`, which is the only place that conversion should
 * happen - doing it twice produces the double-escaped ampersands that make
 * mail clients look broken.
 *
 * ATTACHMENTS
 * -----------
 * `MailEngine.prepareAttachment()` validates size and content type before the
 * file is added to the list, so the user learns about a 40 MB video before
 * they press send. The actual upload happens when `send()` runs, through
 * `/api/mail/attachments`, and a failed upload blocks the send with a named
 * error rather than silently dropping the file.
 */
Rectangle {
    id: composer
    color: "transparent"

    signal closeRequested()
    signal sent(var result)

    /* ---- fields ---- */
    property string to: ""
    property string cc: ""
    property string bcc: ""
    property string subject: ""
    property string body: ""
    property string accountId: ""
    property string inReplyTo: ""
    property string threadId: ""
    property bool showCc: false
    property bool showBcc: false

    /* ---- attachments ---- */
    property var attachments: []
    property bool sending: false
    property string sendError: ""
    property string draftId: ""

    /* ---- state ---- */
    property bool dirty: false

    /** Populates the composer from a variant map (reply/forward/mailto). */
    function load(request) {
        to = request.to || ""
        cc = request.cc || ""
        bcc = request.bcc || ""
        subject = request.subject || ""
        body = request.body || ""
        accountId = request.accountId || ""
        inReplyTo = request.inReplyTo || ""
        threadId = request.threadId || ""
        showCc = cc.length > 0
        showBcc = bcc.length > 0
        attachments = request.attachmentPaths ? [] : []
        sendError = ""
        sending = false
        dirty = false

        if (request.attachmentPaths) {
            var prepared = []
            for (var i = 0; i < request.attachmentPaths.length; i++) {
                var a = MailEngine.prepareAttachment(request.attachmentPaths[i])
                if (a.ok)
                    prepared.push(a)
                else
                    sendError = a.error
            }
            attachments = prepared
        }

        draftId = MailEngine.createDraft({
            accountId: accountId,
            to: to, cc: cc, bcc: bcc,
            subject: subject,
            bodyText: body,
            inReplyTo: inReplyTo,
            threadId: threadId
        }) || ""

        toField.forceActiveFocus()
    }

    /** Clears everything and resets the pane. */
    function reset() {
        to = ""; cc = ""; bcc = ""; subject = ""; body = ""
        inReplyTo = ""; threadId = ""; accountId = ""
        attachments = []
        sendError = ""
        sending = false
        dirty = false
        draftId = ""
    }

    /** True when the message has anywhere to go. */
    function canSend() {
        return !sending
            && to.trim().length > 0
            && subject.trim().length > 0
    }

    /** Debounced autosave. Real timer, real database write. */
    Timer {
        id: autosave
        interval: 900
        repeat: false
        onTriggered: {
            if (draftId.length > 0 && composer.dirty) {
                MailEngine.updateDraft(draftId, {
                    to: composer.to, cc: composer.cc, bcc: composer.bcc,
                    subject: composer.subject, bodyText: composer.body
                })
                composer.dirty = false
            }
        }
    }

    function markDirty() {
        dirty = true
        autosave.restart()
    }

    /**
     * Sends the message.
     *
     * The flow is deliberately: validate -> local persist -> upload
     * attachments -> POST /api/mail/send -> only then clear the draft. If any
     * step fails the composer stays open with the error shown and the draft
     * intact, because losing a composed message to a network blip is the
     * single worst failure mode a mail client has.
     */
    function send() {
        if (!canSend()) {
            sendError = to.trim().length === 0
                ? "Add at least one recipient."
                : "Add a subject before sending."
            return
        }

        sending = true
        sendError = ""

        /* Persist first: the local draft is the fallback if the process dies
           during the network call. */
        if (draftId.length > 0) {
            MailEngine.updateDraft(draftId, {
                to: to, cc: cc, bcc: bcc,
                subject: subject, bodyText: body,
                status: "sending"
            })
        }

        /* Idempotency key: a retry after a timeout must not send twice. */
        var key = draftId.length > 0
            ? draftId
            : "att_" + Date.now() + "_" + Math.floor(Math.random() * 1e9)

        var payload = {
            idempotencyKey: key,
            accountId: accountId,
            to: to, cc: cc, bcc: bcc,
            subject: subject,
            bodyText: body,
            inReplyTo: inReplyTo,
            threadId: threadId,
            attachments: []
        }

        for (var i = 0; i < attachments.length; i++)
            payload.attachments.push(attachments[i].id)

        MailEngine.sendMessage(payload)
    }

    Connections {
        target: MailEngine
        function onSendCompleted(result) {
            composer.sending = false
            if (result.ok) {
                if (composer.draftId.length > 0)
                    MailEngine.deleteDraft(composer.draftId)
                var r = result
                composer.reset()
                composer.sent(r)
            } else {
                composer.sendError = result.error || "The message could not be sent."
                if (composer.draftId.length > 0)
                    MailEngine.updateDraft(composer.draftId, { status: "failed" })
            }
        }
    }

    /* ================================================================== */
    /* Layout                                                              */
    /* ================================================================== */
    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        /* ---- title bar ---- */
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 48
            color: "transparent"

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 12
                spacing: 8

                Text {
                    Layout.fillWidth: true
                    text: inReplyTo.length > 0 ? "Reply" : "New message"
                    color: "white"
                    font.pixelSize: 15
                    font.bold: true
                }

                Text {
                    visible: composer.dirty
                    text: "saving..."
                    color: "#5b6178"
                    font.pixelSize: 10
                }
                Text {
                    visible: !composer.dirty && draftId.length > 0
                    text: "draft saved"
                    color: "#2ecc71"
                    font.pixelSize: 10
                }

                Button {
                    text: "\u2715"
                    flat: true
                    onClicked: {
                        closeRequested()
                    }
                    background: Rectangle {
                        radius: 6
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#a9aec1"
                        font.pixelSize: 13
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    ToolTip.visible: hovered
                    ToolTip.text: "Close (Escape). The draft is kept."
                }
            }

            Rectangle {
                anchors.bottom: parent.bottom
                width: parent.width; height: 1
                color: "#181c28"
            }
        }

        /* ---- address fields ---- */
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 0

            /* To */
            RowLayout {
                Layout.fillWidth: true
                Layout.preferredHeight: 40
                spacing: 0

                Text {
                    Layout.preferredWidth: 56
                    text: "To"
                    color: "#7d849c"
                    font.pixelSize: 12
                    leftPadding: 16
                    verticalAlignment: Text.AlignVCenter
                }
                TextField {
                    id: toField
                    Layout.fillWidth: true
                    Layout.preferredHeight: 40
                    text: composer.to
                    onTextChanged: {
                        if (composer.to !== text) {
                            composer.to = text
                            composer.markDirty()
                        }
                    }
                    placeholderText: "recipient@example.com"
                    background: Rectangle { color: "transparent" }
                    color: "#e8eaf2"
                    font.pixelSize: 13
                    selectByMouse: true
                }
                Button {
                    text: composer.showCc ? "\u25BE" : "+ Cc/Bcc"
                    flat: true
                    onClicked: {
                        showCc = !showCc
                        if (showCc) ccField.forceActiveFocus()
                    }
                    background: Rectangle {
                        radius: 6
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#0066ff"
                        font.pixelSize: 11
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }
            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#14171f" }

            /* Cc */
            RowLayout {
                Layout.fillWidth: true
                Layout.preferredHeight: 40
                visible: composer.showCc
                spacing: 0

                Text {
                    Layout.preferredWidth: 56
                    text: "Cc"
                    color: "#7d849c"
                    font.pixelSize: 12
                    leftPadding: 16
                    verticalAlignment: Text.AlignVCenter
                }
                TextField {
                    id: ccField
                    Layout.fillWidth: true
                    Layout.preferredHeight: 40
                    text: composer.cc
                    onTextChanged: {
                        if (composer.cc !== text) {
                            composer.cc = text
                            composer.markDirty()
                        }
                    }
                    placeholderText: ""
                    background: Rectangle { color: "transparent" }
                    color: "#e8eaf2"
                    font.pixelSize: 13
                    selectByMouse: true
                }
            }
            Rectangle {
                Layout.fillWidth: true; Layout.preferredHeight: 1
                color: "#14171f"; visible: composer.showCc
            }

            /* Bcc */
            RowLayout {
                Layout.fillWidth: true
                Layout.preferredHeight: 40
                visible: composer.showBcc || composer.showCc
                spacing: 0

                Text {
                    Layout.preferredWidth: 56
                    text: "Bcc"
                    color: "#7d849c"
                    font.pixelSize: 12
                    leftPadding: 16
                    verticalAlignment: Text.AlignVCenter
                }
                TextField {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 40
                    text: composer.bcc
                    onTextChanged: {
                        if (composer.bcc !== text) {
                            composer.bcc = text
                            composer.markDirty()
                        }
                    }
                    background: Rectangle { color: "transparent" }
                    color: "#e8eaf2"
                    font.pixelSize: 13
                    selectByMouse: true
                }
            }
            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#14171f" }

            /* Subject */
            RowLayout {
                Layout.fillWidth: true
                Layout.preferredHeight: 40
                spacing: 0

                Text {
                    Layout.preferredWidth: 56
                    text: "Subject"
                    color: "#7d849c"
                    font.pixelSize: 12
                    leftPadding: 16
                    verticalAlignment: Text.AlignVCenter
                }
                TextField {
                    id: subjectField
                    Layout.fillWidth: true
                    Layout.preferredHeight: 40
                    text: composer.subject
                    onTextChanged: {
                        if (composer.subject !== text) {
                            composer.subject = text
                            composer.markDirty()
                        }
                    }
                    placeholderText: "What is this about?"
                    background: Rectangle { color: "transparent" }
                    color: "#e8eaf2"
                    font.pixelSize: 13
                    font.bold: true
                    selectByMouse: true
                }
            }
            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }
        }

        /* ---- body ---- */
        ScrollView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true

            TextArea {
                id: bodyArea
                Layout.fillWidth: true
                Layout.fillHeight: true
                text: composer.body
                onTextChanged: {
                    if (composer.body !== text) {
                        composer.body = text
                        composer.markDirty()
                    }
                }
                placeholderText: "Write your message..."
                wrapMode: TextEdit.WrapAtWordBoundaryOrAnywhere
                background: Rectangle { color: "transparent" }
                color: "#e8eaf2"
                font.pixelSize: 14
                padding: 18
                selectByMouse: true
                /* Tab inserts spaces rather than moving focus: losing your
                   place mid-sentence to keyboard navigation is hostile. */
                Keys.onTabPressed: {
                    var pos = cursorPosition
                    insert(pos, "    ")
                }
            }
        }

        Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }

        /* ---- attachments strip ---- */
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: attachmentColumn.implicitHeight + (attachmentColumn.visible ? 16 : 0)
            visible: attachmentColumn.visible
            color: "#0d1018"

            ColumnLayout {
                id: attachmentColumn
                anchors.fill: parent
                anchors.margins: 8
                spacing: 6
                visible: composer.attachments.length > 0

                Repeater {
                    model: composer.attachments

                    delegate: Rectangle {
                        required property var modelData
                        required property int index
                        Layout.fillWidth: true
                        Layout.preferredHeight: 34
                        radius: 6
                        color: "#14171f"
                        border.color: "#202636"

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 10
                            anchors.rightMargin: 8
                            spacing: 8

                            Text { text: "\u29C9"; color: "#7d849c"; font.pixelSize: 12 }

                            Text {
                                Layout.fillWidth: true
                                text: modelData.fileName
                                color: "#c3c8d8"
                                font.pixelSize: 12
                                elide: Text.ElideRight
                            }

                            Text {
                                text: (modelData.sizeBytes / 1024 / 1024).toFixed(1) + " MB"
                                color: "#5b6178"
                                font.pixelSize: 10
                            }

                            Button {
                                text: "\u2715"
                                flat: true
                                onClicked: {
                                    MailEngine.cancelAttachment(modelData.id)
                                    var next = composer.attachments.slice()
                                    next.splice(index, 1)
                                    composer.attachments = next
                                }
                                background: Rectangle {
                                    radius: 4
                                    color: parent.hovered ? "#2a1416" : "transparent"
                                }
                                contentItem: Text {
                                    text: parent.text
                                    color: "#ff6b6b"
                                    font.pixelSize: 10
                                    horizontalAlignment: Text.AlignHCenter
                                    verticalAlignment: Text.AlignVCenter
                                }
                            }
                        }
                    }
                }
            }
        }

        /* ---- footer ---- */
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: footerColumn.implicitHeight + 20
            color: "#0b0e15"

            ColumnLayout {
                id: footerColumn
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 16
                anchors.topMargin: 10
                spacing: 8

                /* Error line. Red, persistent, and it never replaces the
                   draft - the user's text survives every failure. */
                Text {
                    Layout.fillWidth: true
                    visible: composer.sendError.length > 0
                    text: composer.sendError
                    color: "#ff6b6b"
                    font.pixelSize: 12
                    wrapMode: Text.WordWrap
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    Button {
                        text: composer.sending ? "Sending..." : "\u2794  Send"
                        enabled: composer.canSend()
                        onClicked: composer.send()

                        background: Rectangle {
                            radius: 10
                            color: !parent.enabled ? "#202636"
                                 : (parent.down ? "#0047b3" : (parent.hovered ? "#0066ff" : "#0052cc"))
                        }
                        contentItem: Text {
                            text: parent.text
                            color: parent.enabled ? "white" : "#5b6178"
                            font.pixelSize: 13
                            font.bold: true
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }

                    Button {
                        text: "\u29C9 Attach"
                        flat: true
                        onClicked: fileDialog.open()
                        background: Rectangle {
                            radius: 8
                            color: parent.hovered ? "#1a1e2b" : "transparent"
                        }
                        contentItem: Text {
                            text: parent.text
                            color: "#a9aec1"
                            font.pixelSize: 12
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }

                    Item { Layout.fillWidth: true }

                    Text {
                        text: composer.body.length + " chars"
                        color: "#3d4356"
                        font.pixelSize: 10
                    }

                    Button {
                        text: "Discard"
                        flat: true
                        onClicked: {
                            if (composer.draftId.length > 0)
                                MailEngine.deleteDraft(composer.draftId)
                            composer.reset()
                            composer.closeRequested()
                        }
                        background: Rectangle {
                            radius: 8
                            color: parent.hovered ? "#2a1416" : "transparent"
                        }
                        contentItem: Text {
                            text: parent.text
                            color: "#ff6b6b"
                            font.pixelSize: 12
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }
                }
            }

            Rectangle {
                anchors.top: parent.top
                width: parent.width; height: 1
                color: "#181c28"
            }
        }
    }

    /**
     * File picker.
     *
     * Qt.labs.platform is the maintained dialog module; the older
     * QtQuick.Dialogs 1.x API is deprecated and its `selectFolder` flag does
     * not exist on some platforms. Only files, never folders.
     */
    FileDialog {
        id: fileDialog
        title: "Attach files"
        nameFilters: [
            "All files (*)",
            "Documents (*.pdf *.doc *.docx *.xls *.xlsx *.ppt *.pptx *.txt *.md *.csv)",
            "Images (*.png *.jpg *.jpeg *.gif *.webp)",
            "Archives (*.zip *.gz *.7z)"
        ]
        onAccepted: {
            var path = fileDialog.file.toString()
            /* file:// prefix is stripped by prepareAttachment's QFileInfo,
               but a percent-encoded name would not match on disk. */
            path = decodeURIComponent(path.replace(/^file:\/\/\//, ""))
            var a = MailEngine.prepareAttachment(path)
            if (a.ok) {
                var next = composer.attachments.slice()
                next.push(a)
                composer.attachments = next
                composer.sendError = ""
            } else {
                composer.sendError = a.error
            }
        }
    }
}
