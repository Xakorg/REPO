import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/**
 * SEARCH PANEL
 *
 * Lives in the toolbar and provides two levels of search:
 *
 *   1. LIVE FILTER - typing updates `MailEngine.search()` as you go, which
 *      constrains the current folder's list. This is instant because it runs
 *      against SQLite's FTS5 index with no network round trip.
 *
 *   2. SEARCH EVERYWHERE - Enter, or Ctrl+Shift+F, opens the full-scope panel
 *      below, which queries every folder the account has through
 *      `MailEngine.searchAll()` and shows results grouped by folder.
 *
 * WHY TWO LEVELS
 * --------------
 * Because they answer different questions. "Filter" answers *where is the
 * message I can see*; "search" answers *did I ever receive it*. Collapsing
 * them into one behaviour is why so many clients make you choose a folder
 * before you can find anything.
 *
 * NO NETWORK
 * ----------
 * Both levels read the local cache. A mail client whose search spinner is a
 * network round trip is a mail client that cannot search on a plane, and the
 * cache is authoritative for everything the user has already synced.
 */
Rectangle {
    id: searchPanel
    color: "#14171f"
    radius: 10
    border.color: textField.activeFocus ? "#0066ff" : "#202636"

    Behavior on border.color { ColorAnimation { duration: 120 } }

    /** Query text. Two-way bound to the engine so an external clear (the
        Escape key in the list) also clears this field. */
    property string query: MailEngine.searchTerms
    /** True when the expanded results panel is showing. */
    property bool expanded: false
    /** Results for the expanded panel. */
    property var results: []
    /** True while a full-scope search is running. */
    property bool searching: false
    /** Folder the last result belongs to, for the grouped header. */
    property string scope: "current folder"

    signal resultChosen(string threadId, string messageId)
    signal dismissRequested()

    function forceActiveFocus() {
        textField.forceActiveFocus()
        textField.selectAll()
    }

    function clear() {
        textField.text = ""
        MailEngine.search("")
        expanded = false
        results = []
        scope = "current folder"
    }

    /**
     * Runs the full-scope search.
     *
     * `MailEngine.searchAll` is synchronous against SQLite, so there is no
     * spinner to fake and no loading state to invent. The `searching` flag
     * exists only to cover the (currently empty) async path and to give the
     * UI one place to hang a future debounce.
     */
    function searchEverywhere() {
        if (textField.text.trim().length === 0) {
            clear()
            return
        }
        searching = true
        results = MailEngine.searchAll(textField.text, 60)
        scope = "all folders"
        expanded = results.length > 0
        searching = false
    }

    /* Debounce: a keystroke-per-query pattern hammers the FTS index with
       queries the user is about to replace anyway. 180ms is short enough to
       feel instant and long enough to skip most intermediate strings. */
    Timer {
        id: debounce
        interval: 180
        repeat: false
        onTriggered: {
            MailEngine.search(textField.text)
            if (expanded)
                searchEverywhere()
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 12
        anchors.rightMargin: 8
        spacing: 8

        Text {
            text: "\u2315"
            color: textField.activeFocus ? "#0066ff" : "#5b6178"
            font.pixelSize: 15
        }

        TextField {
            id: textField
            Layout.fillWidth: true
            Layout.fillHeight: true
            text: searchPanel.query
            placeholderText: "Search mail...    (Enter to search all folders)"
            background: Rectangle { color: "transparent" }
            color: "#e8eaf2"
            placeholderTextColor: "#4d546b"
            font.pixelSize: 13
            selectByMouse: true

            onTextChanged: {
                if (searchPanel.query !== text) {
                    searchPanel.query = text
                    debounce.restart()
                }
            }

            Keys.onReturnPressed: searchPanel.searchEverywhere()
            Keys.onEnterPressed: searchPanel.searchEverywhere()

            Keys.onEscapePressed: {
                if (searchPanel.expanded) {
                    searchPanel.expanded = false
                } else if (text.length > 0) {
                    text = ""
                    searchPanel.clear()
                } else {
                    searchPanel.dismissRequested()
                }
            }
        }

        /* Clear button, only when there is something to clear. */
        Button {
            visible: textField.text.length > 0
            text: "\u2715"
            flat: true
            onClicked: searchPanel.clear()
            background: Rectangle {
                radius: 4
                color: parent.hovered ? "#1a1e2b" : "transparent"
            }
            contentItem: Text {
                text: parent.text
                color: "#5b6178"
                font.pixelSize: 10
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
        }

        /* Expand/collapse the full-scope panel. */
        Button {
            text: searchPanel.expanded ? "\u25BE" : "\u25BF"
            flat: true
            onClicked: {
                if (searchPanel.expanded) {
                    searchPanel.expanded = false
                } else {
                    searchPanel.searchEverywhere()
                }
            }
            background: Rectangle {
                radius: 4
                color: parent.hovered ? "#1a1e2b" : "transparent"
            }
            contentItem: Text {
                text: parent.text
                color: searchPanel.expanded ? "#0066ff" : "#5b6178"
                font.pixelSize: 10
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            ToolTip.visible: hovered
            ToolTip.text: "Search every folder"
        }
    }

    /* ================================================================== */
    /* Expanded results panel                                              */
    /* ================================================================== */
    Rectangle {
        id: resultsPanel
        anchors.top: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.topMargin: 6
        height: Math.min(resultsList.contentHeight + headerRow.height + 20, 420)
        visible: searchPanel.expanded
        z: 60
        radius: 10
        color: "#0d1018"
        border.color: "#202636"

        /* A clipped content height with a scrollable list inside means the
           panel never grows past 420px regardless of result count. */
        ColumnLayout {
            anchors.fill: parent
            spacing: 0

            RowLayout {
                id: headerRow
                Layout.fillWidth: true
                Layout.preferredHeight: 36
                spacing: 8

                Text {
                    Layout.fillWidth: true
                    leftPadding: 14
                    text: searchPanel.results.length + " result(s) in " + searchPanel.scope
                          + (textField.text.length > 0 ? " for \"" + textField.text + "\"" : "")
                    color: "#7d849c"
                    font.pixelSize: 11
                    elide: Text.ElideRight
                    verticalAlignment: Text.AlignVCenter
                }

                Text {
                    visible: searchPanel.results.length === 0 && textField.text.length > 0
                    rightPadding: 14
                    text: "No matches. The message may not have synced yet - try Ctrl+R."
                    color: "#5b6178"
                    font.pixelSize: 11
                    verticalAlignment: Text.AlignVCenter
                }

                Button {
                    text: "\u2715"
                    flat: true
                    rightPadding: 8
                    onClicked: searchPanel.expanded = false
                    background: Rectangle {
                        radius: 4
                        color: parent.hovered ? "#1a1e2b" : "transparent"
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "#5b6178"
                        font.pixelSize: 10
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }

            Rectangle { Layout.fillWidth: true; Layout.preferredHeight: 1; color: "#181c28" }

            ListView {
                id: resultsList
                Layout.fillWidth: true
                Layout.fillHeight: true
                clip: true
                model: searchPanel.results
                boundsBehavior: Flickable.StopAtBounds
                spacing: 0

                ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

                delegate: Rectangle {
                    id: hit
                    required property var modelData
                    required property int index

                    width: resultsList.width
                    height: hitContent.implicitHeight + 14
                    color: hitMouse.containsMouse ? "#151a26" : "transparent"

                    ColumnLayout {
                        id: hitContent
                        anchors.fill: parent
                        anchors.leftMargin: 14
                        anchors.rightMargin: 14
                        anchors.topMargin: 7
                        anchors.bottomMargin: 7
                        spacing: 2

                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 8

                            Text {
                                Layout.fillWidth: true
                                /* The subject comes back highlighted by the
                                   FTS snippet() function with <b> markers;
                                   RichText renders them. */
                                textFormat: Text.RichText
                                text: hit.modelData.subject || "(no subject)"
                                color: "#e8eaf2"
                                font.pixelSize: 13
                                font.bold: true
                                elide: Text.ElideRight
                            }

                            Text {
                                text: hit.modelData.folder
                                color: "#5b6178"
                                font.pixelSize: 9
                                font.letterSpacing: 1
                                textTransform: Text.Uppercase
                            }
                        }

                        Text {
                            Layout.fillWidth: true
                            textFormat: Text.RichText
                            text: hit.modelData.snippet || ""
                            color: "#8f96ab"
                            font.pixelSize: 12
                            elide: Text.ElideRight
                            maximumLineCount: 2
                        }

                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 8
                            Text {
                                text: hit.modelData.accountId
                                color: "#3d4356"
                                font.pixelSize: 10
                                elide: Text.ElideRight
                                Layout.maximumWidth: 200
                            }
                            Item { Layout.fillWidth: true }
                            Text {
                                text: String(hit.modelData.sentAt)
                                color: "#3d4356"
                                font.pixelSize: 10
                            }
                        }
                    }

                    Rectangle {
                        anchors.bottom: parent.bottom
                        x: 14; width: parent.width - 28; height: 1
                        color: "#14171f"
                    }

                    MouseArea {
                        id: hitMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            /* Opening a hit navigates the main list to the
                               thread and closes the panel, so the user lands
                               where the result actually is. */
                            MailEngine.openFolder(hit.modelData.folder)
                            searchPanel.resultChosen(hit.modelData.threadId, hit.modelData.messageId)
                            searchPanel.expanded = false
                        }
                    }
                }
            }
        }
    }

    /* Click-away. A results panel that only closes on Escape is a panel that
       gets reported as a bug. */
    MouseArea {
        anchors.fill: parent
        z: -1
        onPressed: function(mouse) {
            mouse.accepted = false
        }
    }
}
