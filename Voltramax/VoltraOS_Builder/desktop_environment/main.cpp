#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QDebug>
#include "DesktopDaemon.h"
#include "BrowserEngine.h"
#include "StreamEngine.h"
#include "VoltMasterEngine.h"
#include "TerminalPTY.h"
#include "SettingsEngine.h"
#include "InstallerEngine.h"
#include "DriveEngine.h"
#include "WTLManager.h"
#include <QtWebEngineQuick>

// ----------------------------------------------------------------------------
// VoltraOS Display Server (VDS) - Entry Point
// ----------------------------------------------------------------------------
int main(int argc, char *argv[])
{
    // 1. Initialize core system Qt parameters for high performance
    QCoreApplication::setAttribute(Qt::AA_ShareOpenGLContexts, true);
    qputenv("QSG_INFO", "1"); // Print SceneGraph info for debugging
    
    // Initialize Chromium Backend for VoltraBrowser
    QtWebEngineQuick::initialize();

    QGuiApplication app(argc, argv);
    app.setOrganizationName("Xakteir");
    app.setOrganizationDomain("xakteir.com");
    app.setApplicationName("Voltra Desktop Server");

    qInfo() << "==================================================";
    qInfo() << " Booting Voltra Display Server (VDS) - Engine v1.0";
    qInfo() << "==================================================";

    // 2. Instantiate the Desktop Daemon (The C++ bridge to the kernel)
    DesktopDaemon daemon;

    // 3. Boot the QML Engine
    QQmlApplicationEngine engine;

    // 4. Inject the C++ Daemon into the QML Environment globally
    // This allows Desktop.qml to call `VoltraDaemon.launchApplication(...)`
    engine.rootContext()->setContextProperty("VoltraDaemon", &daemon);
    
    // Inject the massive Browser Engine backend
    BrowserEngine browserEngine;
    engine.rootContext()->setContextProperty("VoltBrowserEngine", &browserEngine);
    
    // Inject Xakteir Stream Engine
    StreamEngine streamEngine;
    engine.rootContext()->setContextProperty("XakteirStreamEngine", &streamEngine);
    
    // Inject VoltMaster Telemetry Engine
    VoltMasterEngine voltMasterEngine;
    engine.rootContext()->setContextProperty("VoltMasterEngine", &voltMasterEngine);
    
    // Inject Terminal PTY Backend
    TerminalPTY terminalPty;
    engine.rootContext()->setContextProperty("TerminalPTY", &terminalPty);
    
    // Inject System Settings Engine
    SettingsEngine settingsEngine;
    engine.rootContext()->setContextProperty("SettingsEngine", &settingsEngine);
    
    // Inject Bare Metal Installer
    InstallerEngine installerEngine;
    engine.rootContext()->setContextProperty("InstallerEngine", &installerEngine);
    
    // Inject Xakteir Drive Sync Daemon
    DriveEngine driveEngine;
    engine.rootContext()->setContextProperty("DriveEngine", &driveEngine);
    
    // Inject Windows Translation Layer (WTL)
    WTLManager wtlManager;
    engine.rootContext()->setContextProperty("WTLManager", &wtlManager);

    // 5. Load the Boot Splash Screen
    const QUrl url(QStringLiteral("qrc:/BootSplash.qml")); // Assuming qrc, but for now we'll load raw path
    // Since we aren't using a qrc file in this scaffold, load the local file directly:
    const QUrl localUrl = QUrl::fromLocalFile("BootSplash.qml");

    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [localUrl](QObject *obj, const QUrl &objUrl) {
        if (!obj && localUrl == objUrl) {
            qCritical() << "[FATAL] Failed to load BootSplash.qml! VDS Panic.";
            QCoreApplication::exit(-1);
        }
    }, Qt::QueuedConnection);

    qInfo() << "[VDS] Loading BootSplash.qml Sequence...";
    engine.load(localUrl);

    // 6. Enter the main event loop
    qInfo() << "[VDS] UI loaded. Handing over thread execution to OS...";
    return app.exec();
}
