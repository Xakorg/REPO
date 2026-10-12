import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * ACCOUNT MANAGER
 *
 * Lists the accounts this mailbox syncs, their transport kind, whether a vault
 * credential is attached, and their last sync result.
 *
 * WHAT THIS PANE DOES NOT DO
 * --------------------------
 * It does not collect passwords. Adding an account means creating a credential
 * in the shared Xakteir vault (the Authenticator app) and then attaching its
 * id here. The secret itself is resolved server-side on each sync and never
 * reaches this process. A pane that collected a password would put it in a
 * QML TextField, which means in a crash dump, in the clipboard history, and
 * in whatever screenshot the user posts when it fails.
 *
 * The "Attach credential" flow below asks the vault for its reference list
 * (`MailEngine.requestVaultList()`), shows the ids and labels, and writes the
 * chosen id onto the account through the same API the web client uses.
 */
Rectangle {
    id: accountManager
    color: "#f7090b11"

    signal closeRequested()

    property var accounts: MailEngine.accounts()
    property int selectedIndex: -1
    property bool vaultPickerOpen: false
    property var vaultCredentials: []
    property bool loadingVault: false

    function refresh() {
        accounts = MailEngine.accounts()
        if (selectedIndex >= accounts.length)
            selectedIndex = accounts.length - 1
    }

    function current() {
        if (selectedIndex < 0 || selectedIndex >= accounts.length)
            return null
        return accounts[selectedIndex]
    }

    function openVaultPicker() {
        vaultPickerOpen = true
        loadingVault = true
        MailEngine.requestVaultList()
    }

    Connections {
        target: MailEngine
        function onVaultListReceived(credentials) {
            accountManager.vaultCredentials = credentials
            accountManager.loadingVault = false
        }
        function onAccountsChanged() { accountManager.refresh() }
    }

    Rectangle {
        anchors.fill: parent
        color: "#cc000000"
        MouseArea {
            anchors.fill: parent
            onClicked: accountManager.closeRequested()
        }
    }

    Rectangle {
        anchors.centerIn: parent
        width: Math.min(parent.width - 80, 820)
        height: Math.min(parent.height - 80, 580)
        radius: 16
        color: "#0d1018"
        border.color: "#202636"

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 1
            spacing: 0

            /* ---- header ---- */
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 54
                color: "transparent"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 22
                    anchors.rightMargin: 18
                    spacing: 8

                    Text {
                        Layout.fillWidth: true
                        text: "Accounts"
                        color: "white"
                        font.pixelSize: 17
                        font.bold: true
                    }

                    Text {
                        text: MailEngine.signedIn ? "signed in" : "signed out"
                        color: MailEngine.signedIn ? "#2ecc71" : "#ff6b6b"
                        font.pixelSize: 11
                    }

                    Button {
                        text: "\u2715"
                        flat: true
                        onClicked: accountManager.closeRequested()
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

            RowLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 0

                /* ---- account list ---- */
                ListView {
                    id: accountList
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    Layout.preferredWidth: 320
                    clip: true
                    model: accountManager.accounts
                    spacing: 0
                    boundsBehavior: Flickable.StopAtBounds

                    delegate: Rectangle {
                        required property var modelData
                        required property int index
                        width: accountList.width
                        height: 62
                        color: accountManager.selectedIndex === index ? "#151a26"
                             : (rowHover.containsMouse ? "#12151f" : "transparent")

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 16
                            anchors.rightMargin: 14
                            spacing: 12

                            Rectangle {
                                Layout.preferredWidth: 34
                                Layout.preferredHeight: 34
                                radius: 17
                                color: modelData.color && modelData.color.length > 0
                                       ? modelData.color : "#202636"

                                Text {
                                    anchors.centerIn: parent
                                    text: (modelData.label || modelData.address || "?")
                                          .substring(0, 1).toUpperCase()
                                    color: "white"
                                    font.pixelSize: 14
                                    font.bold: true
                                }
                            }

                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 2

                                Text {
                                    Layout.fillWidth: true
                                    text: modelData.label || modelData.address
                                    color: "#e8eaf2"
                                    font.pixelSize: 13
                                    font.bold: true
                                    elide: Text.ElideRight
                                }
                                Text {
                                    Layout.fillWidth: true
                                    text: modelData.address + "  -  " + modelData.kind
                                    color: "#5b6178"
                                    font.pixelSize: 11
                                    elide: Text.ElideRight
                                }
                            }

                            Text {
                                text: modelData.hasCredential ? "\u25CF" : "\u26A0"
                                color: modelData.hasCredential ? "#2ecc71" : "#ffd166"
                                font.pixelSize: 10
                            }
                        }

                        Rectangle {
                            anchors.bottom: parent.bottom
                            x: 16; width: parent.width - 32; height: 1
                            color: "#14171f"
                        }

                        MouseArea {
                            id: rowHover
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: accountManager.selectedIndex = index
                        }
                    }

                    Rectangle {
                        anchors.centerIn: parent
                        width: emptyCol.width; height: emptyCol.height
                        visible: accountList.count === 0

                        ColumnLayout {
                            id: emptyCol
                            spacing: 6
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                text: "\u25C8"
                                color: "#2a3040"
                                font.pixelSize: 36
                            }
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                text: "No accounts yet"
                                color: "#a9aec1"
                                font.pixelSize: 14
                            }
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.maximumWidth: 220
                                wrapMode: Text.WordWrap
                                horizontalAlignment: Text.AlignHCenter
                                text: "Add one in the web client at mail.xakteir.com, then it will appear here on the next sync."
                                color: "#5b6178"
                                font.pixelSize: 11
                            }
                        }
                    }
                }

                Rectangle { Layout.fillWidth: false; Layout.fillHeight: true; Layout.preferredWidth: 1; color: "#181c28" }

                /* ---- detail ---- */
                ColumnLayout {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    Layout.preferredWidth: 420
                    spacing: 0

                    ScrollView {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        clip: true

                        ColumnLayout {
                            width: parent.width
                            spacing: 16
                            visible: accountManager.current() !== null

                            ColumnLayout {
                                Layout.fillWidth: true
                                Layout.margins: 22
                                spacing: 14

                                Text {
                                    text: "ACCOUNT"
                                    color: "#5b6178"
                                    font.pixelSize: 10
                                    font.letterSpacing: 2
                                }

                                DetailField {
                                    Layout.fillWidth: true
                                    label: "Label"
                                    value: accountManager.current()
                                           ? (accountManager.current().label || "(none)") : ""
                                }
                                DetailField {
                                    Layout.fillWidth: true
                                    label: "Address"
                                    value: accountManager.current()
                                           ? accountManager.current().address : ""
                                }
                                DetailField {
                                    Layout.fillWidth: true
                                    label: "Transport"
                                    value: accountManager.current()
                                           ? accountManager.current().kind : ""
                                }
                                DetailField {
                                    Layout.fillWidth: true
                                    label: "Last sync"
                                    value: {
                                        var a = accountManager.current()
                                        if (!a || !a.lastSyncAt) return "never"
                                        return new Date(a.lastSyncAt).toLocaleString()
                                    }
                                }

                                Rectangle {
                                    Layout.fillWidth: true
                                    Layout.preferredHeight: 1
                                    color: "#181c28"
                                }

                                Text {
                                    text: "CREDENTIAL"
                                    color: "#5b6178"
                                    font.pixelSize: 10
                                    font.letterSpacing: 2
                                }

                                RowLayout {
                                    Layout.fillWidth: true
                                    spacing: 10

                                    Text {
                                        Layout.fillWidth: true
                                        text: {
                                            var a = accountManager.current()
                                            if (!a) return ""
                                            return a.hasCredential
                                                ? "A vault credential is attached. Xakteir Mail never stores its value."
                                                : "No credential attached. This account cannot authenticate until one is."
                                        }
                                        color: accountManager.current() && accountManager.current().hasCredential
                                               ? "#8f96ab" : "#ffd166"
                                        font.pixelSize: 12
                                        wrapMode: Text.WordWrap
                                    }

                                    Button {
                                        text: "Attach from vault"
                                        onClicked: accountManager.openVaultPicker()
                                        background: Rectangle {
                                            radius: 8
                                            color: parent.hovered ? "#0066ff" : "#0052cc"
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
                                }

                                Text {
                                    Layout.fillWidth: true
                                    visible: accountManager.current() !== null
                                             && accountManager.current().lastSyncError.length > 0
                                    text: "Last error: " + (accountManager.current()
                                             ? accountManager.current().lastSyncError : "")
                                    color: "#ff6b6b"
                                    font.pixelSize: 11
                                    wrapMode: Text.WordWrap
                                }

                                Rectangle {
                                    Layout.fillWidth: true
                                    Layout.preferredHeight: 1
                                    color: "#181c28"
                                }

                                Text {
                                    Layout.fillWidth: true
                                    text: "Removing an account here stops Xakteir Mail from syncing it. The credential stays in the vault, because other apps may use it. Remove it in the Authenticator app if you want it gone entirely."
                                    color: "#5b6178"
                                    font.pixelSize: 11
                                    wrapMode: Text.WordWrap
                                }
                            }
                        }

                        /* No selection: explain rather than show blank fields. */
                        ColumnLayout {
                            anchors.centerIn: parent
                            width: parent.width - 44
                            spacing: 8
                            visible: accountManager.current() === null

                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                text: "Select an account"
                                color: "#7d849c"
                                font.pixelSize: 14
                            }
                            Text {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillWidth: true
                                horizontalAlignment: Text.AlignHCenter
                                wrapMode: Text.WordWrap
                                text: "Pick an account on the left to see its transport, credential, and last sync."
                                color: "#5b6178"
                                font.pixelSize: 12
                            }
                        }
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 1
                color: "#181c28"
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 52
                color: "#0b0e15"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 20
                    anchors.rightMargin: 20
                    spacing: 10

                    Text {
                        Layout.fillWidth: true
                        text: "Accounts are created and re-authenticated in the web client."
                        color: "#5b6178"
                        font.pixelSize: 11
                    }
                    Button {
                        text: "Open web settings"
                        flat: true
                        onClicked: Qt.openUrlExternally("https://mail.xakteir.com/settings/accounts")
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
        }
    }

    /* ---- vault picker ---- */
    Rectangle {
        anchors.fill: parent
        color: "#cc000000"
        visible: accountManager.vaultPickerOpen
        z: 10

        MouseArea {
            anchors.fill: parent
            onClicked: accountManager.vaultPickerOpen = false
        }

        Rectangle {
            anchors.centerIn: parent
            width: 460
            height: 420
            radius: 12
            color: "#14171f"
            border.color: "#202636"

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 18
                spacing: 12

                Text {
                    text: "Attach a vault credential"
                    color: "white"
                    font.pixelSize: 15
                    font.bold: true
                }
                Text {
                    Layout.fillWidth: true
                    text: "Only the credential id is stored on this device. Its value stays in the vault and is resolved by the server when the account syncs."
                    color: "#8f96ab"
                    font.pixelSize: 11
                    wrapMode: Text.WordWrap
                }

                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 1
                    color: "#181c28"
                }

                ListView {
                    id: vaultList
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    model: accountManager.vaultCredentials
                    spacing: 4
                    boundsBehavior: Flickable.StopAtBounds

                    delegate: Rectangle {
                        required property var modelData
                        width: vaultList.width
                        height: 46
                        radius: 8
                        color: vaultRow.containsMouse ? "#1a1e2b" : "transparent"
                        border.color: "#202636"

                        RowLayout {
                            anchors.fill: parent
                            anchors.leftMargin: 12
                            anchors.rightMargin: 12
                            spacing: 10

                            Text {
                                text: "\u25CF"
                                color: "#2ecc71"
                                font.pixelSize: 10
                            }
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 1
                                Text {
                                    Layout.fillWidth: true
                                    text: modelData.service || modelData.account || modelData.id
                                    color: "#e8eaf2"
                                    font.pixelSize: 12
                                    elide: Text.ElideRight
                                }
                                Text {
                                    Layout.fillWidth: true
                                    text: modelData.purpose || "credential"
                                    color: "#5b6178"
                                    font.pixelSize: 10
                                    elide: Text.ElideRight
                                }
                            }
                            Text {
                                text: "\u2794"
                                color: "#0066ff"
                                font.pixelSize: 12
                            }
                        }

                        MouseArea {
                            id: vaultRow
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                /* The engine resolves and attaches the
                                   credential; QML only passes the id. */
                                if (accountManager.current())
                                    MailEngine.resolveCredential(modelData.id)
                                accountManager.vaultPickerOpen = false
                                accountManager.refresh()
                            }
                        }
                    }

                    Text {
                        anchors.centerIn: parent
                        visible: vaultList.count === 0 && !accountManager.loadingVault
                        text: "The vault has no credentials yet.\nCreate one in the Authenticator app first."
                        color: "#7d849c"
                        font.pixelSize: 12
                        horizontalAlignment: Text.AlignHCenter
                    }
                    Text {
                        anchors.centerIn: parent
                        visible: accountManager.loadingVault
                        text: "Reading the vault..."
                        color: "#7d849c"
                        font.pixelSize: 12
                    }
                }

                Button {
                    Layout.alignment: Qt.AlignRight
                    text: "Cancel"
                    flat: true
                    onClicked: accountManager.vaultPickerOpen = false
                    background: Rectangle {
                        radius: 6
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
        }
    }

    Component.onCompleted: refresh()
}

/* Small labelled read-only field used by the detail column. */
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
