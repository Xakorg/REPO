#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QDebug>
#include "DesktopDaemon.h"
#include "Browser/BrowserEngine.h"
#include "Streaming/StreamEngine.h"
#include "Files/VoltMasterEngine.h"
#include "Terminal/TerminalPTY.h"
#include "Settings/SettingsEngine.h"
#include "Installer/InstallerEngine.h"
#include "Drive/DriveEngine.h"
#include "Windows/WTLManager.h"
#include "../OOBE_Native/OOBEManager.h"
#include <QtWebEngineQuick>

// ----------------------------------------------------------------------------
// VoltraOS Display Server (VDS) - Entry Point
// ----------------------------------------------------------------------------
int main(int argc, char *argv[])
{
    QCoreApplication::setAttribute(Qt::AA_ShareOpenGLContexts, true);
    qputenv("QSG_INFO", "1");
    
    QtWebEngineQuick::initialize();

    QGuiApplication app(argc, argv);
    app.setOrganizationName("Xakteir");
    app.setOrganizationDomain("xakteir.com");
    app.setApplicationName("Voltra Desktop Server");

    qInfo() << "==================================================";
    qInfo() << " Booting Voltra Display Server (VDS) - Engine v1.0";
    qInfo() << "==================================================";

    DesktopDaemon daemon;

    QQmlApplicationEngine engine;

    engine.rootContext()->setContextProperty("VoltraDaemon", &daemon);
    
    BrowserEngine browserEngine;
    engine.rootContext()->setContextProperty("VoltBrowserEngine", &browserEngine);
    
    StreamEngine streamEngine;
    engine.rootContext()->setContextProperty("XakteirStreamEngine", &streamEngine);
    
    VoltMasterEngine voltMasterEngine;
    engine.rootContext()->setContextProperty("VoltMasterEngine", &voltMasterEngine);
    
    TerminalPTY terminalPty;
    engine.rootContext()->setContextProperty("TerminalPTY", &terminalPty);
    
    SettingsEngine settingsEngine;
    engine.rootContext()->setContextProperty("SettingsEngine", &settingsEngine);
    
    InstallerEngine installerEngine;
    engine.rootContext()->setContextProperty("InstallerEngine", &installerEngine);
    
    DriveEngine driveEngine;
    engine.rootContext()->setContextProperty("DriveEngine", &driveEngine);
    
    OOBEManager oobeManager;
    engine.rootContext()->setContextProperty("OOBE", &oobeManager);

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

    qInfo() << "[VDS] UI loaded. Handing over thread execution to OS...";
    return app.exec();
}
