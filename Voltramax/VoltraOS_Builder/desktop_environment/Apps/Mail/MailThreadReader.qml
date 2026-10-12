import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * THREAD READER
 *
 * The right-hand pane: every message in the selected thread, oldest first,
 * newest last and expanded.
 *
 * EXPAND/COLLAPSE RULE
 * --------------------
 * Messages older than the last one collapse to a one-line header (sender,
 * date, snippet) and expand on click. The last message is always expanded,
 * because a reader pane that opens collapsed is a reader pane the user has to
 * click twice to use. A "collapse all" control is offered for long threads.
 *
 * HTML SANITISATION
 * -----------------
 * `bodyHtml` arrives from the server. It is passed through `MailSanitizer`
 * below, which strips <script>, event handler attributes, and remote image
 * URLs by default. Remote images are replaced with a placeholder and a "load
 * images" affordance, because a tracking pixel is a read receipt a stranger
 * filed on the user's behalf.
 *
 * ENCRYPTED MESSAGES
 * ------------------
 * When `isEncrypted` is set, the plaintext fields are empty and the pane
 * shows an inline decrypt control. The key is resolved through the vault and
 * never leaves the C++ side; QML only ever sees the decrypted text as a
 * string it cannot export.
 */
Rectangle {
    id: reader
    color: "transparent"

    signal closeRequested()
    signal replyRequested(var request)

    /** Ids of the messages currently expanded. */
    property var expanded: ({})
    /** The thread currently loaded. */
    property string threadId: MailEngine.selectedThreadId
    /** Cached message list for the thread, refreshed on selection change. */
    property var messages: []
    /** True when remote images have been explicitly allowed. */
    property bool allowRemoteImages: false
    /** True when the reader is showing the encrypted-payload placeholder. */
    property bool needsDecrypt: false

    /* ------------------------------------------------------------------ */
    /* Sanitizer                                                           */
    /* ------------------------------------------------------------------ */

    /**
     * Strips the parts of an HTML body that can execute or phone home.
     *
     * This is deliberately not a full HTML parser: Qt Quick's Text element
     * supports a bounded HTML subset anyway, so anything outside that subset
     * is dropped rather than repaired. The rules, in order:
     *
     *   1. <script>, <style>, <iframe>, <object>, <embed>, <form> and their
     *      contents are removed wholesale.
     *   2. on* attributes (onclick, onerror, ...) are removed.
     *   3. javascript: URLs are removed.
     *   4. Remote http(s) image sources are replaced with a placeholder
     *      unless the user has opted in for this thread.
     *   5. <a href> is kept, but only http/https/mailto; file: and data: are
     *      dropped.
     *
     * It returns a string, not a document object, so there is no live DOM for
     * injected markup to hook into.
     */
    function sanitiseHtml(html) {
        if (!html || html.length === 0)
            return ""

        var out = html

        /* 1. dangerous containers, with contents */
        out = out.replace(/<script[\s\S]*?<\/script>/gi, "")
        out = out.replace(/<style[\s\S]*?<\/style>/gi, "")
        out = out.replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        out = out.replace(/<object[\s\S]*?<\/object>/gi, "")
        out = out.replace(/<embed[^>]*>/gi, "")
        out = out.replace(/<form[\s\S]*?<\/form>/gi, "")
        out = out.replace(/<svg[\s\S]*?<\/svg>/gi, "")
        out = out.replace(/<link[^>]*>/gi, "")
        out = out.replace(/<meta[^>]*>/gi, "")

        /* 2. event handlers */
        out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
        out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
        out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")

        /* 3. javascript: URLs anywhere, including inside attributes */
        out = out.replace(/javascript\s*:/gi, "")

        /* 4. remote images */
        if (!allowRemoteImages) {
            out = out.replace(/<img[^>]*src\s*=\s*["']https?:[^"']*["'][^>]*>/gi,
                "<span style=\"color:#5b6178;font-size:11px\">[remote image blocked]</span>")
        }

        /* 5. href schemes */
        out = out.replace(/href\s*=\s*["']\s*(file|data|vbscript|blob)\s*:[^"']*["']/gi,
            "href=\"#\"")

        /* Qt Quick's Text element does not render these and they only add
           weight to the string compare on every paint. */
        out = out.replace(/<div[^>]*>/gi, "<p>")
        out = out.replace(/<\/div>/gi, "</p>")

        return out
    }

    /** Picks the body to show: HTML when present, plain text otherwise. */
    function bodyOf(message) {
        if (message.isEncrypted) {
            return "<p><i>This message is encrypted.</i></p>"
        }
        if (message.bodyHtml && message.bodyHtml.length > 0)
            return sanitiseHtml(message.bodyHtml)
        if (message.bodyText && message.bodyText.length > 0) {
            /* Plain text: escape angle brackets first so a literal <b> in
               the message cannot become a tag. */
            var escaped = message.bodyText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
            escaped = escaped.replace(/\n/g, "<br>")
            return "<p>" + escaped + "</p>"
        }
        return "<p style=\"color:#5b6178\"><i>(this message has no body)</i></p>"
    }

    /* ------------------------------------------------------------------ */
    /* Load the thread whenever the selection changes                      */
    /* ------------------------------------------------------------------ */
    onThreadIdChanged: reload()

    function reload() {
        allowRemoteImages = false
        needsDecrypt = false
        if (!threadId || threadId.length === 0) {
            messages = []
            return
        }
        messages = MailEngine.threadMessages(threadId)
        expanded = ({})
        if (messages.length > 0) {
            /* Newest message is the one at the end of the array (the engine
               returns oldest-first); it is expanded by default. */
            var lastId = messages[messages.length - 1].id
            var next = expanded
            next[lastId] = true
            expanded = next
        }
        needsDecrypt = messages.length > 0 &&
                       messages[messages.length - 1].isEncrypted === true
    }

    function toggle(messageId) {
        var next = expanded
        if (next[messageId])
            delete next[messageId]
        else
            next[messageId] = true
        expanded = next
    }

    function collapseAll() {
        var next = {}
        if (messages.length > 0)
            next[messages[messages.length - 1].id] = true
        expanded = next
    }

    function expandAll() {
        var next = {}
        for (var i = 0; i < messages.length; i++)
            next[messages[i].id] = true
        expanded = next
    }

    /** Builds the payload the composer expects for a reply. */
    function replyRequest(forward) {
        if (messages.length === 0) return {}
        var m = messages[messages.length - 1]
        var request = {
            accountId: m.accountId,
            inReplyTo: m.internetMessageId,
            threadId: threadId
        }
        if (forward) {
            request.subject = "Fwd: " + m.subject
            request.body = "\n\n---------- Forwarded message ----------\n"
                         + "From: " + m.from.name + " <" + m.from.address + ">\n"
                         + "Subject: " + m.subject + "\n"
                         + m.bodyText
        } else {
            request.subject = m.subject.indexOf("Re:") === 0 ? m.subject : "Re: " + m.subject
            request.to = m.from.address
            request.body = "\n\nOn " + m.sentAt + ", "
                         + m.from.name + " wrote:\n> "
                         + (m.bodyText || "").split("\n").join("\n> ")
        }
        return request
    }

    /* ------------------------------------------------------------------ */
    /* Layout                                                              */
    /* ------------------------------------------------------------------ */

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        /* ---- header bar ---- */
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 48
            color: "transparent"

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 12
                spacing: 8

                Button {
                    text: "\u2715"
                    flat: true
                    onClicked: reader.closeRequested()
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
                    ToolTip.text: "Close (Escape)"
                }

                Text {
                    Layout.fillWidth: true
                    text: reader.messages.length > 0 ? reader.messages[reader.messages.length - 1].subject : ""
                    color: "white"
                    font.pixelSize: 15
                    font.bold: true
                    elide: Text.ElideRight
                }

                Button {
                    visible: reader.messages.length > 1
                    text: reader.messages.length > 0 && reader.expanded[reader.messages[reader.messages.length - 1].id] === undefined
                          ? "Expand all" : "Collapse all"
                    flat: true
                    onClicked: {
                        if (reader.messages.length > 0 && reader.expanded[reader.messages[reader.messages.length - 1].id] === undefined)
                            reader.expandAll()
                        else
                            reader.collapseAll()
                    }
                    background: Rectangle {
                        radius: 6
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#a9aec1"
                        font.pixelSize: 11
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }

                Button {
                    text: "\u21A9 Reply"
                    onClicked: reader.replyRequested(reader.replyRequest(false))
                    background: Rectangle {
                        radius: 8
                        color: parent.down ? "#0052cc" : (parent.hovered ? "#0066ff" : "#0052cc")
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "white"
                        font.pixelSize: 12
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }

                Button {
                    text: "\u21A7 Forward"
                    flat: true
                    onClicked: reader.replyRequested(reader.replyRequest(true))
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
            }

            Rectangle {
                anchors.bottom: parent.bottom
                width: parent.width; height: 1
                color: "#181c28"
            }
        }

        /* ---- remote-image and decrypt notices ---- */
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: noticeRow.implicitHeight + 16
            visible: (!reader.allowRemoteImages && readerContainsRemoteImage())
                     || reader.needsDecrypt
            color: "#141a26"

            RowLayout {
                id: noticeRow
                anchors.fill: parent
                anchors.leftMargin: 16
                anchors.rightMargin: 16
                anchors.verticalCenter: parent.verticalCenter
                spacing: 10

                Text {
                    visible: reader.needsDecrypt
                    Layout.fillWidth: true
                    text: "This message is encrypted. Enter the key from your Xakteir vault to read it."
                    color: "#ffd166"
                    font.pixelSize: 12
                    wrapMode: Text.WordWrap
                }

                Button {
                    visible: reader.needsDecrypt
                    text: "Decrypt"
                    onClicked: {
                        /* The engine resolves the key through the vault API
                           and hands the plaintext back as a plain string;
                           no key material is ever present in QML. */
                        MailEngine.decryptThreadMessage(reader.threadId)
                        reader.needsDecrypt = false
                    }
                    background: Rectangle {
                        radius: 8
                        color: parent.hovered ? "#8a6d1a" : "#6b5514"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#fff3cd"
                        font.pixelSize: 12
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }

                Text {
                    visible: !reader.allowRemoteImages && readerContainsRemoteImage()
                    Layout.fillWidth: true
                    text: "Remote images in this message were blocked to prevent tracking."
                    color: "#a9aec1"
                    font.pixelSize: 12
                    wrapMode: Text.WordWrap
                }

                Button {
                    visible: !reader.allowRemoteImages && readerContainsRemoteImage()
                    text: "Load images"
                    flat: true
                    onClicked: reader.allowRemoteImages = true
                    background: Rectangle {
                        radius: 6
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#0066ff"
                        font.pixelSize: 12
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }
        }

        /* ---- messages ---- */
        ListView {
            id: threadView
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            model: reader.messages
            boundsBehavior: Flickable.StopAtBounds
            spacing: 0

            ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

            delegate: Rectangle {
                id: messageCard
                required property var modelData
                required property int index

                property bool isOpen: reader.expanded[modelData.id] === true
                property bool isLast: index === reader.messages.length - 1

                width: threadView.width
                height: content.implicitHeight + 24
                color: isOpen ? "#0d1018" : "transparent"

                Rectangle {
                    anchors.top: parent.top
                    width: parent.width; height: 1
                    color: "#14171f"
                }

                ColumnLayout {
                    id: content
                    anchors.fill: parent
                    anchors.leftMargin: 20
                    anchors.rightMargin: 20
                    anchors.topMargin: 12
                    anchors.bottomMargin: 12
                    spacing: 10

                    /* --- collapsed header --- */
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10
                        visible: !messageCard.isOpen

                        Rectangle {
                            Layout.preferredWidth: 32
                            Layout.preferredHeight: 32
                            radius: 16
                            color: "#202636"

                            Text {
                                anchors.centerIn: parent
                                text: initialsOf(messageCard.modelData.from)
                                color: "#a9aec1"
                                font.pixelSize: 12
                                font.bold: true
                            }
                        }

                        Text {
                            Layout.fillWidth: true
                            text: senderOf(messageCard.modelData) + " - " + messageCard.modelData.snippet
                            color: "#8f96ab"
                            font.pixelSize: 12
                            elide: Text.ElideRight
                            maximumLineCount: 1
                        }

                        Text {
                            text: messageCard.modelData.sentAt
                            color: "#5b6178"
                            font.pixelSize: 11
                        }

                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: reader.toggle(messageCard.modelData.id)
                        }
                    }

                    /* --- expanded header --- */
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12
                        visible: messageCard.isOpen

                        Rectangle {
                            Layout.preferredWidth: 40
                            Layout.preferredHeight: 40
                            radius: 20
                            color: "#202636"

                            Text {
                                anchors.centerIn: parent
                                text: initialsOf(messageCard.modelData.from)
                                color: "#c3c8d8"
                                font.pixelSize: 14
                                font.bold: true
                            }
                        }

                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 2

                            RowLayout {
                                spacing: 8
                                Text {
                                    text: senderOf(messageCard.modelData)
                                    color: "white"
                                    font.pixelSize: 13
                                    font.bold: true
                                }
                                Text {
                                    text: "<" + (messageCard.modelData.from ? messageCard.modelData.from.address : "") + ">"
                                    color: "#5b6178"
                                    font.pixelSize: 11
                                }
                            }

                            Text {
                                Layout.fillWidth: true
                                text: "to " + recipientsOf(messageCard.modelData)
                                color: "#7d849c"
                                font.pixelSize: 11
                                elide: Text.ElideRight
                            }
                        }

                        ColumnLayout {
                            spacing: 2
                            Alignment { }

                            Text {
                                text: messageCard.modelData.sentAt
                                color: "#a9aec1"
                                font.pixelSize: 11
                                Layout.alignment: Qt.AlignRight
                            }

                            Text {
                                visible: messageCard.modelData.auth && messageCard.modelData.auth.dmarcResult === "pass"
                                text: "\u2713 verified"
                                color: "#2ecc71"
                                font.pixelSize: 10
                                Layout.alignment: Qt.AlignRight
                            }
                            Text {
                                visible: messageCard.modelData.auth && messageCard.modelData.auth.dmarcResult === "fail"
                                text: "\u26A0 unverified sender"
                                color: "#ff6b6b"
                                font.pixelSize: 10
                                Layout.alignment: Qt.AlignRight
                            }
                        }

                        Button {
                            flat: true
                            text: messageCard.isOpen ? "\u25B4" : "\u25BE"
                            onClicked: reader.toggle(messageCard.modelData.id)
                            background: Rectangle {
                                radius: 6
                                color: parent.hovered ? "#1a1e2b" : "transparent"
                            }
                            contentItem: Text {
                                text: parent.text
                                color: "#7d849c"
                                font.pixelSize: 12
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                        }
                    }

                    /* --- body --- */
                    Text {
                        Layout.fillWidth: true
                        visible: messageCard.isOpen
                        textFormat: Text.RichText
                        text: reader.bodyOf(messageCard.modelData)
                        color: "#c3c8d8"
                        font.pixelSize: 13
                        wrapMode: Text.WrapAtWordBoundaryOrAnywhere
                        /* Links open in the system browser; never in-app,
                           which would give a phishing page the app's chrome. */
                        onLinkActivated: function(link) {
                            if (link.indexOf("http://") === 0 || link.indexOf("https://") === 0)
                                Qt.openUrlExternally(link)
                        }
                    }

                    /* --- attachment chips --- */
                    Flow {
                        Layout.fillWidth: true
                        visible: messageCard.isOpen
                                 && messageCard.modelData.attachmentCount > 0
                        spacing: 8

                        Repeater {
                            model: messageCard.modelData.attachmentCount

                            delegate: Rectangle {
                                required property int index
                                width: 180
                                height: 44
                                radius: 8
                                color: attachMouse.containsMouse ? "#1a1e2b" : "#14171f"
                                border.color: "#202636"

                                RowLayout {
                                    anchors.fill: parent
                                    anchors.leftMargin: 10
                                    anchors.rightMargin: 10
                                    spacing: 8

                                    Text {
                                        text: "\u29C9"
                                        color: "#7d849c"
                                        font.pixelSize: 14
                                    }
                                    ColumnLayout {
                                        Layout.fillWidth: true
                                        spacing: 0
                                        Text {
                                            Layout.fillWidth: true
                                            text: "Attachment " + (index + 1)
                                            color: "#c3c8d8"
                                            font.pixelSize: 11
                                            elide: Text.ElideRight
                                        }
                                        Text {
                                            text: "Click to download"
                                            color: "#5b6178"
                                            font.pixelSize: 9
                                        }
                                    }
                                }

                                MouseArea {
                                    id: attachMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: {
                                        var atts = messageCard.modelData.attachments
                                        if (atts && atts[index])
                                            MailEngine.downloadAttachment(atts[index].id)
                                    }
                                }
                            }
                        }
                    }

                    /* --- per-message actions --- */
                    RowLayout {
                        Layout.fillWidth: true
                        visible: messageCard.isOpen
                        spacing: 8

                        Button {
                            text: "Reply"
                            flat: true
                            onClicked: reader.replyRequested(reader.replyRequest(false))
                            background: Rectangle {
                                radius: 6
                                color: parent.hovered ? "#1a1e2b" : "transparent"
                            }
                            contentItem: Text {
                                text: parent.text
                                color: "#a9aec1"
                                font.pixelSize: 11
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                        }
                        Button {
                            text: "Forward"
                            flat: true
                            onClicked: reader.replyRequested(reader.replyRequest(true))
                            background: Rectangle {
                                radius: 6
                                color: parent.hovered ? "#1a1e2b" : "transparent"
                            }
                            contentItem: Text {
                                text: parent.text
                                color: "#a9aec1"
                                font.pixelSize: 11
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                        }
                        Button {
                            text: "Archive"
                            flat: true
                            onClicked: {
                                MailEngine.archive(messageCard.modelData.id)
                                reader.closeRequested()
                            }
                            background: Rectangle {
                                radius: 6
                                color: parent.hovered ? "#1a1e2b" : "transparent"
                            }
                            contentItem: Text {
                                text: parent.text
                                color: "#a9aec1"
                                font.pixelSize: 11
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                        }
                        Button {
                            text: "Delete"
                            flat: true
                            onClicked: {
                                MailEngine.markTrash(messageCard.modelData.id)
                                reader.closeRequested()
                            }
                            background: Rectangle {
                                radius: 6
                                color: parent.hovered ? "#2a1416" : "transparent"
                            }
                            contentItem: Text {
                                text: parent.text
                                color: "#ff6b6b"
                                font.pixelSize: 11
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                        }

                        Item { Layout.fillWidth: true }

                        Text {
                            visible: messageCard.modelData.isEncrypted
                            text: "\u25A6 encrypted"
                            color: "#7d849c"
                            font.pixelSize: 10
                        }
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    z: -1
                    enabled: !messageCard.isOpen
                    onClicked: reader.toggle(messageCard.modelData.id)
                }
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /* Formatting helpers                                                  */
    /* ------------------------------------------------------------------ */

    function senderOf(message) {
        if (!message) return ""
        if (message.from && message.from.name && message.from.name.length > 0)
            return message.from.name
        if (message.from) return message.from.address
        return ""
    }

    function initialsOf(address) {
        if (!address) return "?"
        var name = address.name && address.name.length > 0 ? address.name : address.address
        if (!name) return "?"
        var parts = name.trim().split(/\s+/)
        if (parts.length >= 2)
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
        return name.substring(0, 2).toUpperCase()
    }

    function recipientsOf(message) {
        if (!message || !message.to) return ""
        var names = []
        for (var i = 0; i < message.to.length; i++) {
            var a = message.to[i]
            names.push(a.name && a.name.length > 0 ? a.name : a.address)
        }
        var joined = names.join(", ")
        if (joined.length > 90)
            joined = joined.substring(0, 90) + "..."
        return joined
    }

    /** True when any message in the thread has a remote image worth
        blocking; only checked when the notices bar is being laid out. */
    function readerContainsRemoteImage() {
        for (var i = 0; i < messages.length; i++) {
            var html = messages[i].bodyHtml || ""
            if (/<img[^>]+src\s*=\s*["']https?:/i.test(html))
                return true
        }
        return false
    }

    Connections {
        target: MailEngine
        function onSelectionChanged() {
            reader.reload()
        }
    }
}
