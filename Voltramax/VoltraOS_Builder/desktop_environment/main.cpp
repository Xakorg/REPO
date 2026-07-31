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
#include "../OOBE_Native/OOBEManager.h"
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
    
    // Inject OOBE Manager (Setup Engine)
    OOBEManager oobeManager;
    engine.rootContext()->setContextProperty("OOBE", &oobeManager);

    // 5. Load the Boot Splash Screen natively from QRC
    const QUrl url(QStringLiteral("qrc:/BootSplash.qml"));

    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [url](QObject *obj, const QUrl &objUrl) {
        if (!obj && url == objUrl) {
            qCritical() << "[FATAL] Failed to load BootSplash.qml from QRC! VDS Panic.";
            QCoreApplication::exit(-1);
        }
    }, Qt::QueuedConnection);

    qInfo() << "[VDS] Loading BootSplash.qml Sequence...";
    engine.load(url);

    // 6. Enter the main event loop
    qInfo() << "[VDS] UI loaded. Handing over thread execution to OS...";
    return app.exec();
}
