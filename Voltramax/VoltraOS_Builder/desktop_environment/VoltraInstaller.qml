import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Item {
    id: installerRoot
    anchors.fill: parent

    property int step: 1 // 1: Welcome, 2: Disk Select, 3: The Wipe, 4: Installing, 5: Done
    property string selectedDiskPath: ""

    Rectangle {
        anchors.fill: parent
        color: step === 3 ? "#0A0000" : "#05050A" // Flash dark red in danger zone
        Behavior on color { ColorAnimation { duration: 500 } }
    }

    // Top Header
    Rectangle {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 80
        color: "#11FFFFFF"
        
        Text {
            anchors.centerIn: parent
            text: "VOLTRA OS ENTERPRISE INSTALLER"
            color: "white"
            font.pixelSize: 24
            font.family: "Syne"
            font.bold: true
            font.letterSpacing: 4
        }
    }

    // ------------------------------------------------------------------------
    // STEP 1: WELCOME
    // ------------------------------------------------------------------------
    ColumnLayout {
        anchors.centerIn: parent
        visible: step === 1
        spacing: 30

        Text {
            text: "Welcome to Ring 0."
            color: "white"
            font.pixelSize: 48
            font.family: "Syne"
            font.bold: true
            Layout.alignment: Qt.AlignHCenter
        }
        Text {
            text: "This application will write the Voltra C Kernel to bare metal hardware.\nProceed with extreme caution."
            color: "#AAAAAA"
            font.pixelSize: 18
            horizontalAlignment: Text.AlignHCenter
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 40
            width: 200
            height: 50
            color: "#FFBD2E"
            radius: 4

            Text { anchors.centerIn: parent; text: "SCAN HARDWARE"; font.bold: true; font.pixelSize: 16 }
            MouseArea {
                anchors.fill: parent
                onClicked: {
                    var drives = InstallerEngine.scanPhysicalDrives();
                    diskModel.clear();
                    for(var i=0; i < drives.length; i++) { diskModel.append(drives[i]); }
                    step = 2;
                }
            }
        }
    }

    // ------------------------------------------------------------------------
    // STEP 2: DISK SELECTION (The Hardware Matrix)
    // ------------------------------------------------------------------------
    ColumnLayout {
        anchors.centerIn: parent
        visible: step === 2
        width: 800
        spacing: 20

        Text { text: "Select Target Block Device"; color: "white"; font.pixelSize: 32; font.family: "Syne"; font.bold: true }

        ListView {
            Layout.fillWidth: true
            Layout.preferredHeight: 300
            model: ListModel { id: diskModel }
            spacing: 15
            clip: true

            delegate: Rectangle {
                width: parent.width
                height: 80
                color: "#11FFFFFF"
                border.color: selectedDiskPath === model.path ? "#FFBD2E" : "#33FFFFFF"
                border.width: selectedDiskPath === model.path ? 2 : 1
                radius: 8

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    
                    Text { text: "💾"; font.pixelSize: 32 }
                    
                    ColumnLayout {
                        Layout.fillWidth: true
                        Text { text: model.path; color: "white"; font.pixelSize: 20; font.family: "Courier New"; font.bold: true }
                        Text { text: model.name + " (" + model.sizeGB + ")"; color: "#00FFCC"; font.pixelSize: 14 }
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: selectedDiskPath = model.path
                }
            }
        }

        RowLayout {
            Layout.alignment: Qt.AlignRight
            Rectangle {
                width: 150; height: 50; color: "#333"; radius: 4
                Text { anchors.centerIn: parent; text: "CANCEL"; color: "white"; font.bold: true }
                MouseArea { anchors.fill: parent; onClicked: step = 1 }
            }
            Rectangle {
                width: 150; height: 50; color: selectedDiskPath === "" ? "#55FF0000" : "#FF0000"; radius: 4
                Text { anchors.centerIn: parent; text: "WIPE DRIVE"; color: "white"; font.bold: true }
                MouseArea { 
                    anchors.fill: parent; 
                    enabled: selectedDiskPath !== ""
                    onClicked: step = 3 
                }
            }
        }
    }

    // ------------------------------------------------------------------------
    // STEP 3: THE DANGER WARNING
    // ------------------------------------------------------------------------
    Rectangle {
        anchors.centerIn: parent
        width: 600
        height: 400
        visible: step === 3
        color: "#110000"
        border.color: "#FF0000"
        border.width: 2
        radius: 8

        ColumnLayout {
            anchors.centerIn: parent
            spacing: 20
            
            Text { text: "⚠️ DATA DESTRUCTION IMMINENT"; color: "#FF0000"; font.pixelSize: 28; font.family: "Syne"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
            Text { 
                text: "You are about to issue a low-level format to:\n\n" + selectedDiskPath + "\n\nAll partition tables, boot sectors, and data will be permanently destroyed."
                color: "white"
                font.pixelSize: 18
                horizontalAlignment: Text.AlignHCenter
                Layout.alignment: Qt.AlignHCenter
            }

            RowLayout {
                Layout.alignment: Qt.AlignHCenter
                Layout.topMargin: 30
                Rectangle {
                    width: 200; height: 60; color: "#333"; radius: 4
                    Text { anchors.centerIn: parent; text: "ABORT"; color: "white"; font.bold: true }
                    MouseArea { anchors.fill: parent; onClicked: step = 2 }
                }
                Rectangle {
                    width: 200; height: 60; color: "#FF0000"; radius: 4
                    Text { anchors.centerIn: parent; text: "EXECUTE FORMAT"; color: "white"; font.bold: true }
                    MouseArea { 
                        anchors.fill: parent; 
                        onClicked: {
                            step = 4;
                            InstallerEngine.wipeAndInstall(selectedDiskPath);
                        }
                    }
                }
            }
        }
    }

    // ------------------------------------------------------------------------
    // STEP 4: INSTALLING (Actual Raw Output)
    // ------------------------------------------------------------------------
    ColumnLayout {
        anchors.centerIn: parent
        visible: step === 4
        width: 800
        spacing: 20

        Text { text: "Writing C Kernel to Bare Metal..."; color: "white"; font.pixelSize: 32; font.family: "Syne"; font.bold: true }
        
        Rectangle {
            Layout.fillWidth: true
            height: 10
            color: "#222"
            radius: 5
            Rectangle {
                id: installProgressRect
                height: parent.height
                width: (parent.width * installPercent) / 100
                color: "#FFBD2E"
                radius: 5
                Behavior on width { NumberAnimation { duration: 200 } }
            }
        }

        Text { 
            id: currentFileText
            text: "Initializing raw sockets..."
            color: "#00FFCC"
            font.family: "Courier New"
            font.pixelSize: 16
        }

        Connections {
            target: InstallerEngine
            function onInstallProgress(percent, currentFile) {
                installPercent = percent;
                currentFileText.text = currentFile;
            }
            function onInstallFinished() {
                step = 5;
            }
            function onInstallError(errorLog) {
                currentFileText.text = "FATAL KERNEL PANIC:\n" + errorLog;
                currentFileText.color = "#FF0000";
            }
        }

        property int installPercent: 0
    }

    // ------------------------------------------------------------------------
    // STEP 5: DONE
    // ------------------------------------------------------------------------
    ColumnLayout {
        anchors.centerIn: parent
        visible: step === 5
        spacing: 20

        Text { text: "VOLTRA OS INSTALLED."; color: "#00FFCC"; font.pixelSize: 48; font.family: "Syne"; font.bold: true; Layout.alignment: Qt.AlignHCenter }
        Text { text: "The C Kernel has been successfully grafted to " + selectedDiskPath; color: "white"; font.pixelSize: 18; Layout.alignment: Qt.AlignHCenter }
        
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: 30
            width: 250; height: 60; color: "#FFBD2E"; radius: 4
            Text { anchors.centerIn: parent; text: "REBOOT SYSTEM"; font.bold: true; font.pixelSize: 18 }
            // MouseArea { anchors.fill: parent; onClicked: Syscall.reboot() }
        }
    }
}
