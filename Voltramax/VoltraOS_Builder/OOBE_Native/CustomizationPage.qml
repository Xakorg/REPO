import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtGraphicalEffects 1.15

Item {
    id: root
    width: 1920
    height: 1080

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0a0a1a" }
            GradientStop { position: 1.0; color: "#1a1a3e" }
        }
    }

    Rectangle {
        id: glassPanel
        width: 720
        height: 620
        anchors.centerIn: parent
        color: Qt.rgba(10/255, 10/255, 20/255, 0.85)
        radius: 28
        border.color: Qt.rgba(255/255, 255/255, 255/255, 0.15)
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 28
            width: parent.width * 0.82

            Text {
                text: "Personalize Your VoltraMax"
                font.pixelSize: 34
                font.weight: Font.Bold
                color: "white"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Text {
                text: "Make this device uniquely yours."
                font.pixelSize: 16
                color: "#8888aa"
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // Avatar + Device Name + Display Name
            RowLayout {
                width: parent.width
                spacing: 30
                Layout.topMargin: 10

                // Avatar selector with canvas-drawn icon
                ColumnLayout {
                    Layout.weight: 1
                    spacing: 15
                    Canvas {
                        width: 100; height: 100
                        anchors.horizontalCenter: parent.horizontalCenter
                        onPaint: {
                            var ctx = getContext("2d")
                            ctx.clearRect(0, 0, width, height)
                            // Draw avatar circle
                            ctx.beginPath()
                            ctx.arc(50, 50, 45, 0, Math.PI * 2)
                            ctx.fillStyle = "#1a1a3e"
                            ctx.fill()
                            ctx.strokeStyle = "#a855f7"
                            ctx.lineWidth = 2
                            ctx.stroke()
                            // Draw head
                            ctx.beginPath()
                            ctx.arc(50, 38, 18, 0, Math.PI * 2)
                            ctx.fillStyle = "#a855f7"
                            ctx.fill()
                            // Draw body
                            ctx.beginPath()
                            ctx.moveTo(50, 60)
                            ctx.lineTo(28, 90)
                            ctx.lineTo(72, 90)
                            ctx.closePath()
                            ctx.fillStyle = "#a855f7"
                            ctx.fill()
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: { /* Open avatar picker */ }
                        }
                    }
                    Text { text: "Avatar"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                    Text { text: "Tap to change"; font.pixelSize: 12; color: "#666666"; Layout.alignment: Qt.AlignHCenter }
                }

                // Device name
                ColumnLayout {
                    Layout.weight: 1
                    spacing: 10
                    Canvas {
                        width: 28; height: 28
                        anchors.horizontalCenter: parent.horizontalCenter
                        onPaint: {
                            var ctx = getContext("2d")
                            ctx.clearRect(0, 0, width, height)
                            ctx.fillStyle = "#a0a0a0"
                            ctx.fillRect(4, 4, 20, 20)
                            ctx.strokeStyle = "#a855f7"
                            ctx.lineWidth = 1.5
                            ctx.strokeRect(4, 4, 20, 20)
                            ctx.beginPath()
                            ctx.moveTo(14, 10)
                            ctx.lineTo(14, 18)
                            ctx.moveTo(11, 15)
                            ctx.lineTo(14, 18)
                            ctx.lineTo(17, 15)
                            ctx.stroke()
                        }
                    }
                    Text { text: "Device Name"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                    TextField {
                        text: OOBE.deviceName
                        onTextChanged: { OOBE.setDeviceName(text); }
                        placeholderText: "VoltraMax"
                        Layout.fillWidth: true
                        font.pixelSize: 16
                        background: Rectangle { color: "#20FFFFFF"; radius: 8 }
                    }
                }

                // Display name
                ColumnLayout {
                    Layout.weight: 1
                    spacing: 10
                    Canvas {
                        width: 28; height: 28
                        anchors.horizontalCenter: parent.horizontalCenter
                        onPaint: {
                            var ctx = getContext("2d")
                            ctx.clearRect(0, 0, width, height)
                            ctx.fillStyle = "#a0a0a0"
                            ctx.fillRect(4, 4, 20, 20)
                            ctx.strokeStyle = "#a855f7"
                            ctx.lineWidth = 1.5
                            ctx.strokeRect(4, 4, 20, 20)
                            ctx.beginPath()
                            ctx.arc(14, 12, 5, 0, Math.PI * 2)
                            ctx.fillStyle = "#a855f7"
                            ctx.fill()
                        }
                    }
                    Text { text: "Display Name"; font.pixelSize: 18; color: "white"; Layout.alignment: Qt.AlignHCenter }
                    TextField {
                        text: OOBE.displayName
                        onTextChanged: { OOBE.setDisplayName(text); }
                        placeholderText: "User"
                        Layout.fillWidth: true
                        font.pixelSize: 16
                        background: Rectangle { color: "#20FFFFFF"; radius: 8 }
                    }
                }
            }

            // Wallpaper selector - Canvas drawn scenery
            Rectangle {
                width: parent.width
                height: 180
                color: "#151530"
                radius: 16
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    Text { text: "Wallpaper"; font.pixelSize: 20; color: "white" }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12

                        Repeater {
                            model: 6
                            delegate: Rectangle {
                                width: 100
                                height: 100
                                radius: 12
                                color: "#0a0a1a"
                                border.color: wallpaperSelected === index ? primaryColor : Qt.rgba(255/255, 255/255, 255/255, 0.1)
                                border.width: 2

                                Canvas {
                                    anchors.fill: parent
                                    anchors.margins: 4
                                    onPaint: {
                                        var ctx = getContext("2d")
                                        ctx.clearRect(0, 0, width, height)
                                        var themes = [
                                            function() { // Night sky
                                                var grad = ctx.createLinearGradient(0, 0, 0, height)
                                                grad.addColorStop(0, "#0a0a2e")
                                                grad.addColorStop(1, "#1a1a3e")
                                                ctx.fillStyle = grad
                                                ctx.fillRect(0, 0, width, height)
                                                ctx.fillStyle = "#FFD700"
                                                ctx.beginPath(); ctx.arc(80, 20, 3, 0, Math.PI*2); ctx.fill()
                                                ctx.fillStyle = "#FFD700"
                                                ctx.beginPath(); ctx.arc(30, 50, 2, 0, Math.PI*2); ctx.fill()
                                            },
                                            function() { // Ocean
                                                var grad = ctx.createLinearGradient(0, 0, 0, height)
                                                grad.addColorStop(0, "#001133")
                                                grad.addColorStop(1, "#004488")
                                                ctx.fillStyle = grad
                                                ctx.fillRect(0, 0, width, height)
                                                ctx.fillStyle = "#00AAFF"
                                                ctx.beginPath(); ctx.arc(50, 70, 15, 0, Math.PI); ctx.fill()
                                            },
                                            function() { { // Volcano
                                                var grad = ctx.createLinearGradient(0, 0, 0, height)
                                                grad.addColorStop(0, "#1a0a00")
                                                grad.addColorStop(1, "#331100")
                                                ctx.fillStyle = grad
                                                ctx.fillRect(0, 0, width, height)
                                                ctx.fillStyle = "#FF4400"
                                                ctx.beginPath(); ctx.moveTo(50, 20); ctx.lineTo(20, 80); ctx.lineTo(80, 80); ctx.closePath(); ctx.fill()
                                            }},
                                            function() { // Forest
                                                var grad = ctx.createLinearGradient(0, 0, 0, height)
                                                grad.addColorStop(0, "#001a00")
                                                grad.addColorStop(1, "#003300")
                                                ctx.fillStyle = grad
                                                ctx.fillRect(0, 0, width, height)
                                                ctx.fillStyle = "#00AA00"
                                                for(var i=0; i<5; i++) { ctx.beginPath(); ctx.moveTo(20+i*18, 80); ctx.lineTo(15+i*18, 50); ctx.lineTo(25+i*18, 50); ctx.closePath(); ctx.fill() }
                                            },
                                            function() { { // City night
                                                var grad = ctx.createLinearGradient(0, 0, 0, height)
                                                grad.addColorStop(0, "#0a0a1a")
                                                grad.addColorStop(1, "#222233")
                                                ctx.fillStyle = grad
                                                ctx.fillRect(0, 0, width, height)
                                                ctx.fillStyle = "#FFD700"
                                                for(var i=0; i<8; i++) { ctx.fillRect(10+i*12, 20+i*8, 4, 30-i*3) }
                                            }},
                                            function() { // Lightning
                                                var grad = ctx.createLinearGradient(0, 0, 0, height)
                                                grad.addColorStop(0, "#0a0a1a")
                                                grad.addColorStop(1, "#333344")
                                                ctx.fillStyle = grad
                                                ctx.fillRect(0, 0, width, height)
                                                ctx.strokeStyle = "#FFD700"
                                                ctx.lineWidth = 2
                                                ctx.beginPath()
                                                ctx.moveTo(40, 10); ctx.lineTo(55, 40); ctx.lineTo(35, 40); ctx.lineTo(60, 80); ctx.lineTo(30, 50); ctx.lineTo(50, 50); ctx.closePath()
                                                ctx.stroke()
                                            }
                                        ]
                                        themes[index]()
                                    }
                                }

                                MouseArea {
                                    anchors.fill: parent
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: { wallpaperSelected = index; }
                                }
                            }
                        }
                    }
                }
            }

            // Sound & Vibration settings
            Rectangle {
                width: parent.width
                height: 140
                color: "#151530"
                radius: 16
                border.color: Qt.rgba(255/255, 255/255, 255/255, 0.1)
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    Text { text: "Sound & Vibration"; font.pixelSize: 20; color: "white" }

                    RowLayout {
                        width: parent.width
                        spacing: 20

                        RowLayout {
                            Layout.weight: 1
                            Canvas {
                                width: 24; height: 24
                                onPaint: {
                                    var ctx = getContext("2d")
                                    ctx.clearRect(0,0,24,24)
                                    ctx.fillStyle = "#a0a0a0"
                                    ctx.beginPath(); ctx.arc(12,12,8,0,Math.PI*2); ctx.fill()
                                    ctx.beginPath(); ctx.moveTo(12,6); ctx.lineTo(12,18); ctx.moveTo(8,10); ctx.lineTo(12,18); ctx.lineTo(16,10); ctx.stroke()
                                }
                            }
                            Text { text: "Sound Effects"; color: "#c0c0c0"; font.pixelSize: 15 }
                            Switch { checked: true }
                        }

                        RowLayout {
                            Layout.weight: 1
                            Canvas {
                                width: 24; height: 24
                                onPaint: {
                                    var ctx = getContext("2d")
                                    ctx.clearRect(0,0,24,24)
                                    ctx.fillStyle = "#a0a0a0"
                                    ctx.fillRect(6,10,12,8)
                                    ctx.strokeStyle = "#a855f7"
                                    ctx.lineWidth = 1
                                    ctx.beginPath(); ctx.moveTo(10,10); ctx.lineTo(10,6); ctx.moveTo(14,10); ctx.lineTo(14,6); ctx.stroke()
                                }
                            }
                            Text { text: "Haptic Feedback"; color: "#c0c0c0"; font.pixelSize: 15 }
                            Switch { checked: true }
                        }
                    }
                }
            }

            // Buttons
            RowLayout {
                width: parent.width
                spacing: 16

                Rectangle {
                    Layout.fillWidth: true
                    height: 52
                    radius: 14
                    color: primaryColor
                    Text {
                        text: "Continue →"
                        color: "white"
                        font.pixelSize: 18
                        font.bold: true
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { stackView.push("SecurityPage.qml"); }
                    }
                }

                Rectangle {
                    width: 120
                    height: 52
                    radius: 14
                    color: "#40FFFFFF"
                    border.color: "#CCCCCC"
                    border.width: 1
                    Text {
                        text: "Skip"
                        color: "#666666"
                        font.pixelSize: 16
                        anchors.centerIn: parent
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: { stackView.push("SecurityPage.qml"); }
                    }
                }
            }
        }
    }

    property int wallpaperSelected: 0
}
