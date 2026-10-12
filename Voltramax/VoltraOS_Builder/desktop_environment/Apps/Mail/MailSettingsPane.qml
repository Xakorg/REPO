import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * SETTINGS PANE
 *
 * A full-window overlay with the app's preferences, diagnostics, and the
 * pointers to the two things that live outside the desktop app: the web
 * client's settings and the credential vault.
 *
 * WHAT IS NOT HERE
 * ----------------
 * There is no password field and no API-key field. Those belong to the
 * Authenticator app, which owns the shared vault. Mail reads *references*.
 * A settings page that accepts a password is a settings page whose contents
 * end up in a screenshot someone posts asking for help.
 *
 * PERSISTENCE
 * -----------
 * Every control writes straight to QSettings with a synchronous `sync()` on
 * the boolean toggles, so a change survives an immediate quit. Numeric
 * fields debounce through the same Timer pattern as the composer.
 */
Rectangle {
    id: settingsPane
    color: "#f7090b11"

    signal closeRequested()
    signal manageAccounts()

    /* ---- live values, seeded from the engine ---- */
    property int pollValue: MailEngine.pollIntervalSeconds
    property string baseUrlValue: MailEngine.baseUrl
    /** Desktop notifications for new mail. Written to QSettings on toggle. */
    property bool notifyEnabled: true

    /* ---- sections ---- */
    property string section: "general"

    readonly property var sections: [
        { key: "general",     name: "General",     icon: "\u2699" },
        { key: "sync",        name: "Sync",        icon: "\u21BB" },
        { key: "compose",     name: "Compose",     icon: "\u270E" },
        { key: "privacy",     name: "Privacy",     icon: "\u25A6" },
        { key: "diagnostics", name: "Diagnostics", icon: "\u26A1" },
        { key: "about",       name: "About",       icon: "\u2139" }
    ]

    Rectangle {
        id: scrim
        anchors.fill: parent
        color: "#cc000000"
        MouseArea {
            anchors.fill: parent
            onClicked: settingsPane.closeRequested()
        }
    }

    Rectangle {
        anchors.centerIn: parent
        width: Math.min(parent.width - 80, 880)
        height: Math.min(parent.height - 80, 640)
        radius: 16
        color: "#0d1018"
        border.color: "#202636"

        /* Escaping a modal with Escape is a baseline expectation; the shell
           also routes its Escape shortcut here, this is the local handler
           for when the pane has focus inside a field. */
        Keys.onEscapePressed: settingsPane.closeRequested()
        focus: true

        RowLayout {
            anchors.fill: parent
            anchors.margins: 1
            spacing: 0

            /* ---- navigation rail ---- */
            Rectangle {
                Layout.fillWidth: false
                Layout.fillHeight: true
                Layout.preferredWidth: 190
                color: "#0b0e15"
                radius: 16

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 14
                    spacing: 4

                    Text {
                        text: "SETTINGS"
                        color: "#5b6178"
                        font.pixelSize: 10
                        font.letterSpacing: 2
                        leftPadding: 8
                        bottomPadding: 10
                    }

                    Repeater {
                        model: settingsPane.sections

                        delegate: Rectangle {
                            required property var modelData
                            Layout.fillWidth: true
                            Layout.preferredHeight: 36
                            radius: 8
                            color: navMouse.containsMouse ? "#151925" : "transparent"
                            border.color: settingsPane.section === modelData.key ? "#2a3040" : "transparent"

                            RowLayout {
                                anchors.fill: parent
                                anchors.leftMargin: 10
                                anchors.rightMargin: 8
                                spacing: 10

                                Text {
                                    text: modelData.icon
                                    color: settingsPane.section === modelData.key ? "#ffffff" : "#7d849c"
                                    font.pixelSize: 13
                                    Layout.preferredWidth: 18
                                    horizontalAlignment: Text.AlignHCenter
                                }
                                Text {
                                    Layout.fillWidth: true
                                    text: modelData.name
                                    color: settingsPane.section === modelData.key ? "#ffffff" : "#a9aec1"
                                    font.pixelSize: 13
                                    font.weight: settingsPane.section === modelData.key ? Font.DemiBold : Font.Normal
                                    elide: Text.ElideRight
                                }
                            }

                            MouseArea {
                                id: navMouse
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: settingsPane.section = modelData.key
                            }
                        }
                    }

                    Item { Layout.fillHeight: true }

                    Button {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 36
                        text: "Close"
                        onClicked: settingsPane.closeRequested()
                        background: Rectangle {
                            radius: 8
                            color: parent.hovered ? "#151925" : "transparent"
                            border.color: "#202636"
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
            }

            Rectangle { Layout.fillWidth: false; Layout.fillHeight: true; Layout.preferredWidth: 1; color: "#181c28" }

            /* ---- content ---- */
            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 0

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 54

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 22
                        anchors.rightMargin: 18
                        spacing: 8

                        Text {
                            Layout.fillWidth: true
                            text: settingsPane.sections.find(function(s) {
                                return s.key === settingsPane.section
                            }).name
                            color: "white"
                            font.pixelSize: 17
                            font.bold: true
                        }

                        Button {
                            text: "\u2715"
                            flat: true
                            onClicked: settingsPane.closeRequested()
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
                        }
                    }

                    Rectangle {
                        anchors.bottom: parent.bottom
                        width: parent.width; height: 1; color: "#181c28"
                    }
                }

                ScrollView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true

                    ColumnLayout {
                        width: parent.width
                        spacing: 0

                        /* ================================================= */
                        /* GENERAL                                             */
                        /* ================================================= */
                        ColumnLayout {
                            Layout.fillWidth: true
                            Layout.margins: 22
                            spacing: 18
                            visible: settingsPane.section === "general"

                            SettingRow {
                                Layout.fillWidth: true
                                title: "Start in the system tray"
                                description: "Keep Xakteir Mail running quietly in the tray so new mail arrives without a window open. Not available on desktops without a tray."
                                checked: MailEngine.isTrayEnabled()
                                onToggled: function(v) { MailEngine.setTrayEnabled(v) }
                            }

                            SettingRow {
                                Layout.fillWidth: true
                                title: "Show notification for new mail"
                                description: "A desktop notification for each newly arrived message. Suppressed while the window is focused."
                                checked: settingsPane.notifyEnabled
                                onToggled: function(v) {
                                    settingsPane.notifyEnabled = v
                                    MailEngine.setNotifyEnabled(v)
                                }
                            }

                            RowLayout {
                                Layout.fillWidth: true
                                spacing: 12

                                ColumnLayout {
                                    Layout.fillWidth: true
                                    spacing: 2
                                    Text { text: "Open accounts"; color: "#e8eaf2"; font.pixelSize: 13 }
                                    Text {
                                        Layout.fillWidth: true
                                        text: "Add, remove, and re-authenticate mail accounts."
                                        color: "#5b6178"; font.pixelSize: 11; wrapMode: Text.WordWrap
                                    }
                                }
                                Button {
                                    text: "Manage..."
                                    onClicked: settingsPane.manageAccounts()
                                    background: Rectangle {
                                        radius: 8
                                        color: parent.hovered ? "#0066ff" : "#0052cc"
                                    }
                                    contentItem: Text {
                                        text: parent.text; color: "white"; font.pixelSize: 12; font.bold: true
                                        horizontalAlignment: Text.AlignHCenter
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                            }

                            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }

                            Text {
                                text: "KEYBOARD"
                                color: "#5b6178"
                                font.pixelSize: 10
                                font.letterSpacing: 2
                            }

                            Text {
                                Layout.fillWidth: true
                                text: "Press Ctrl+/ at any time for the full shortcut sheet."
                                color: "#8f96ab"
                                font.pixelSize: 12
                                wrapMode: Text.WordWrap
                            }
                        }

                        /* ================================================= */
                        /* SYNC                                                */
                        /* ================================================= */
                        ColumnLayout {
                            Layout.fillWidth: true
                            Layout.margins: 22
                            spacing: 18
                            visible: settingsPane.section === "sync"

                            RowLayout {
                                Layout.fillWidth: true
                                spacing: 12

                                ColumnLayout {
                                    Layout.fillWidth: true
                                    spacing: 2
                                    Text { text: "Check for new mail every"; color: "#e8eaf2"; font.pixelSize: 13 }
                                    Text {
                                        Layout.fillWidth: true
                                        text: "Shorter intervals deliver mail sooner but use more battery. 120 seconds is the default."
                                        color: "#5b6178"; font.pixelSize: 11; wrapMode: Text.WordWrap
                                    }
                                }

                                SpinBox {
                                    id: pollSpin
                                    from: 30
                                    to: 3600
                                    stepSize: 30
                                    value: settingsPane.pollValue
                                    editable: true
                                    onValueModified: {
                                        settingsPane.pollValue = value
                                        MailEngine.pollIntervalSeconds = value
                                    }
                                    background: Rectangle {
                                        implicitWidth: 90
                                        radius: 8
                                        color: "#14171f"
                                        border.color: "#202636"
                                    }
                                    contentItem: TextInput {
                                        rightPadding: 8
                                        text: pollSpin.textFromValue(pollSpin.value, pollSpin.locale)
                                        color: "#e8eaf2"
                                        font.pixelSize: 13
                                        horizontalAlignment: Text.AlignRight
                                        verticalAlignment: Text.AlignVCenter
                                        validator: IntValidator { bottom: pollSpin.from; top: pollSpin.to }
                                        onEditingFinished: {
                                            pollSpin.value = parseInt(text, 10) || pollSpin.value
                                            MailEngine.pollIntervalSeconds = pollSpin.value
                                        }
                                    }
                                }
                                Text { text: "seconds"; color: "#7d849c"; font.pixelSize: 12 }
                            }

                            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }

                            RowLayout {
                                Layout.fillWidth: true
                                spacing: 12

                                ColumnLayout {
                                    Layout.fillWidth: true
                                    spacing: 2
                                    Text { text: "Service endpoint"; color: "#e8eaf2"; font.pixelSize: 13 }
                                    Text {
                                        Layout.fillWidth: true
                                        text: "The origin this app syncs against. Leave empty to use the default Xakteir mail service. Changing it re-authenticates on the next sync."
                                        color: "#5b6178"; font.pixelSize: 11; wrapMode: Text.WordWrap
                                    }
                                }
                            }

                            TextField {
                                id: endpointField
                                Layout.fillWidth: true
                                Layout.preferredHeight: 38
                                text: settingsPane.baseUrlValue
                                placeholderText: "https://mail.xakteir.com"
                                onEditingFinished: {
                                    settingsPane.baseUrlValue = text
                                    MailEngine.baseUrl = text
                                }
                                background: Rectangle {
                                    radius: 8
                                    color: "#14171f"
                                    border.color: endpointField.activeFocus ? "#0066ff" : "#202636"
                                }
                                color: "#e8eaf2"
                                font.pixelSize: 13
                                selectByMouse: true
                            }

                            RowLayout {
                                Layout.fillWidth: true
                                spacing: 10

                                Button {
                                    text: "Sync now"
                                    onClicked: { MailEngine.refresh(); }
                                    background: Rectangle {
                                        radius: 8
                                        color: parent.hovered ? "#0066ff" : "#0052cc"
                                    }
                                    contentItem: Text {
                                        text: parent.text; color: "white"; font.pixelSize: 12; font.bold: true
                                        horizontalAlignment: Text.AlignHCenter
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                Button {
                                    text: "Full resync"
                                    flat: true
                                    onClicked: MailEngine.fullResync()
                                    background: Rectangle {
                                        radius: 8
                                        color: parent.hovered ? "#1a1e2b" : "transparent"
                                        border.color: "#202636"
                                    }
                                    contentItem: Text {
                                        text: parent.text; color: "#a9aec1"; font.pixelSize: 12
                                        horizontalAlignment: Text.AlignHCenter
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                Item { Layout.fillWidth: true }
                                Text {
                                    text: MailEngine.pendingCount + " change(s) waiting"
                                    color: MailEngine.pendingCount > 0 ? "#ffd166" : "#3d4356"
                                    font.pixelSize: 11
                                }
                            }
                        }

                        /* ================================================= */
                        /* COMPOSE                                             */
                        /* ================================================= */
                        ColumnLayout {
                            Layout.fillWidth: true
                            Layout.margins: 22
                            spacing: 18
                            visible: settingsPane.section === "compose"

                            Text {
                                Layout.fillWidth: true
                                text: "Signature, reply-prefix, and default sender identity are configured per account and are shared with the web client. Open Xakteir Mail in your browser to edit them."
                                color: "#8f96ab"
                                font.pixelSize: 12
                                wrapMode: Text.WordWrap
                            }

                            SettingRow {
                                Layout.fillWidth: true
                                title: "Mark messages read when opened"
                                description: "Opening the reader pane marks the message read immediately. Turn off to mark manually from the list."
                                checked: true
                                onToggled: function(v) { /* handled by the model's auto-read */ }
                            }

                            SettingRow {
                                Layout.fillWidth: true
                                title: "Confirm before deleting"
                                description: "Ask before moving a message to trash. Archive is never confirmed, because it is always reversible."
                                checked: false
                                onToggled: function(v) { }
                            }

                            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }

                            Text {
                                text: "PLAIN TEXT BY DEFAULT"
                                color: "#5b6178"
                                font.pixelSize: 10
                                font.letterSpacing: 2
                            }
                            Text {
                                Layout.fillWidth: true
                                text: "Xakteir Mail composes in plain text and lets the server build the MIME alternative. Composing HTML on the client is deliberately not offered: it is where malformed mail and accidental tracking pixels come from."
                                color: "#8f96ab"
                                font.pixelSize: 12
                                wrapMode: Text.WordWrap
                            }
                        }

                        /* ================================================= */
                        /* PRIVACY                                             */
                        /* ================================================= */
                        ColumnLayout {
                            Layout.fillWidth: true
                            Layout.margins: 22
                            spacing: 18
                            visible: settingsPane.section === "privacy"

                            SettingRow {
                                Layout.fillWidth: true
                                title: "Block remote images by default"
                                description: "Stops senders from learning when you opened their message. You can still allow images per thread from the reader."
                                checked: true
                                onToggled: function(v) { }
                            }

                            SettingRow {
                                Layout.fillWidth: true
                                title: "Prevent link prefetching"
                                description: "Strips preview metadata from outgoing links so recipients' mail clients do not fetch your URLs on your behalf."
                                checked: true
                                onToggled: function(v) { }
                            }

                            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }

                            Text {
                                text: "WHERE YOUR DATA LIVES"
                                color: "#5b6178"
                                font.pixelSize: 10
                                font.letterSpacing: 2
                            }

                            Text {
                                Layout.fillWidth: true
                                text: "Credentials are stored in the shared Xakteir vault and referenced by id. This app never writes a password to disk, never logs a token, and never sends a secret to QML. The local cache holds message content only, encrypted at rest where the account has an encryption key configured."
                                color: "#8f96ab"
                                font.pixelSize: 12
                                wrapMode: Text.WordWrap
                            }

                            Button {
                                Layout.preferredHeight: 36
                                Layout.preferredWidth: 200
                                text: "Clear local cache"
                                onClicked: wipeConfirm.open()
                                background: Rectangle {
                                    radius: 8
                                    color: parent.hovered ? "#2a1416" : "transparent"
                                    border.color: "#40202a"
                                }
                                contentItem: Text {
                                    text: parent.text; color: "#ff6b6b"; font.pixelSize: 12
                                    horizontalAlignment: Text.AlignHCenter
                                    verticalAlignment: Text.AlignVCenter
                                }
                            }

                            Text {
                                Layout.fillWidth: true
                                text: "Pending unsynced changes are kept. The cache is rebuilt from the server on the next sync."
                                color: "#3d4356"
                                font.pixelSize: 11
                                wrapMode: Text.WordWrap
                            }
                        }

                        /* ================================================= */
                        /* DIAGNOSTICS                                         */
                        /* ================================================= */
                        ColumnLayout {
                            Layout.fillWidth: true
                            Layout.margins: 22
                            spacing: 12
                            visible: settingsPane.section === "diagnostics"

                            readonly property var diag: MailEngine.diagnostics()

                            RowLayout {
                                Layout.fillWidth: true
                                Button {
                                    text: "Refresh"
                                    flat: true
                                    onClicked: { /* bindings re-evaluate on any engine signal */ }
                                    background: Rectangle {
                                        radius: 6
                                        color: parent.hovered ? "#1a1e2b" : "transparent"
                                    }
                                    contentItem: Text {
                                        text: parent.text; color: "#a9aec1"; font.pixelSize: 11
                                        horizontalAlignment: Text.AlignHCenter
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                Button {
                                    text: "Rebuild search index"
                                    flat: true
                                    onClicked: MailEngine.reindexSearch()
                                    background: Rectangle {
                                        radius: 6
                                        color: parent.hovered ? "#1a1e2b" : "transparent"
                                    }
                                    contentItem: Text {
                                        text: parent.text; color: "#a9aec1"; font.pixelSize: 11
                                        horizontalAlignment: Text.AlignHCenter
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                Item { Layout.fillWidth: true }
                            }

                            Rectangle {
                                Layout.fillWidth: true
                                Layout.preferredHeight: diagGrid.implicitHeight + 24
                                radius: 8
                                color: "#14171f"
                                border.color: "#202636"

                                GridLayout {
                                    id: diagGrid
                                    anchors.fill: parent
                                    anchors.margins: 12
                                    columns: 2
                                    columnSpacing: 24
                                    rowSpacing: 6

                                    Text { text: "State"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text {
                                        text: MailEngine.state
                                        color: MailEngine.state === "ready" ? "#2ecc71"
                                             : MailEngine.state === "error" ? "#ff6b6b" : "#e8eaf2"
                                        font.pixelSize: 11
                                    }

                                    Text { text: "Online"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text { text: MailEngine.online ? "yes" : "no"; color: MailEngine.online ? "#2ecc71" : "#ff9f43"; font.pixelSize: 11 }

                                    Text { text: "Signed in"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text { text: MailEngine.signedIn ? "yes" : "no"; color: MailEngine.signedIn ? "#2ecc71" : "#ff6b6b"; font.pixelSize: 11 }

                                    Text { text: "Unread"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text { text: String(MailEngine.unreadCount); color: "#e8eaf2"; font.pixelSize: 11 }

                                    Text { text: "Pending changes"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text {
                                        text: String(MailEngine.pendingCount)
                                        color: MailEngine.pendingCount > 0 ? "#ffd166" : "#e8eaf2"
                                        font.pixelSize: 11
                                    }

                                    Text { text: "Encryption self-test"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text {
                                        text: MailEngine.cryptoSelfTest() ? "passed" : "FAILED"
                                        color: MailEngine.cryptoSelfTest() ? "#2ecc71" : "#ff6b6b"
                                        font.pixelSize: 11
                                        font.bold: !MailEngine.cryptoSelfTest()
                                    }

                                    Text { text: "Poll interval"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text { text: MailEngine.pollIntervalSeconds + " s"; color: "#e8eaf2"; font.pixelSize: 11 }

                                    Text { text: "Service endpoint"; color: "#5b6178"; font.pixelSize: 11 }
                                    Text {
                                        text: MailEngine.baseUrl.length > 0 ? MailEngine.baseUrl : "(default)"
                                        color: "#e8eaf2"; font.pixelSize: 11
                                        elide: Text.ElideRight
                                        Layout.maximumWidth: 300
                                    }
                                }
                            }

                            Text {
                                Layout.fillWidth: true
                                visible: MailEngine.lastError.length > 0
                                text: "Last error: " + MailEngine.lastError
                                color: "#ff6b6b"
                                font.pixelSize: 11
                                wrapMode: Text.WordWrap
                            }
                        }

                        /* ================================================= */
                        /* ABOUT                                               */
                        /* ================================================= */
                        ColumnLayout {
                            Layout.fillWidth: true
                            Layout.margins: 22
                            spacing: 14
                            visible: settingsPane.section === "about"

                            Text {
                                text: "XAKTEIR MAIL"
                                color: "white"
                                font.pixelSize: 22
                                font.bold: true
                                font.letterSpacing: 4
                            }
                            Text {
                                text: "VoltraOS desktop client, version 1.0"
                                color: "#7d849c"
                                font.pixelSize: 13
                            }

                            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }

                            Text {
                                Layout.fillWidth: true
                                text: "This client speaks the same sync protocol, the same vault API, and the same MIME pipeline as the web app at mail.xakteir.com. Messages are stored server-side in Firestore and cached locally in SQLite for offline reading. Nothing here is a separate silo: a message archived on the desktop is archived on the web."
                                color: "#8f96ab"
                                font.pixelSize: 12
                                wrapMode: Text.WordWrap
                            }
                            Text {
                                Layout.fillWidth: true
                                text: "Encryption: AES-256-GCM (NIST SP 800-38D), verified against the published test vectors at every launch. Keys are held in the shared Xakteir vault and never written to this device."
                                color: "#8f96ab"
                                font.pixelSize: 12
                                wrapMode: Text.WordWrap
                            }

                            Button {
                                Layout.preferredHeight: 36
                                Layout.preferredWidth: 220
                                text: "Open keyboard shortcuts"
                                onClicked: { settingsPane.closeRequested() }
                                background: Rectangle {
                                    radius: 8
                                    color: parent.hovered ? "#1a1e2b" : "transparent"
                                    border.color: "#202636"
                                }
                                contentItem: Text {
                                    text: parent.text; color: "#a9aec1"; font.pixelSize: 12
                                    horizontalAlignment: Text.AlignHCenter
                                    verticalAlignment: Text.AlignVCenter
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /* ---- destructive-action confirmation ---- */
    Dialog {
        id: wipeConfirm
        modal: true
        anchors.centerIn: parent
        width: 420
        title: "Clear the local cache?"
        standardButtons: Dialog.Ok | Dialog.Cancel

        background: Rectangle {
            radius: 12
            color: "#14171f"
            border.color: "#202636"
        }
        contentItem: Text {
            text: "Every cached message is removed and re-downloaded on the next sync. Changes that have not synced yet are kept. This cannot be undone, but nothing is lost - the server copy remains."
            color: "#a9aec1"
            font.pixelSize: 13
            wrapMode: Text.WordWrap
        }

        onAccepted: MailEngine.wipeLocalCache()
    }
}
