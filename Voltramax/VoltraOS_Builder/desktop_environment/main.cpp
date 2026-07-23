#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QDebug>
#include "DesktopDaemon.h"
#include "BrowserEngine.h"
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

    // 5. Load the Desktop UI
    const QUrl url(QStringLiteral("qrc:/Desktop.qml")); // Assuming qrc, but for now we'll load raw path
    // Since we aren't using a qrc file in this scaffold, load the local file directly:
    const QUrl localUrl = QUrl::fromLocalFile("Desktop.qml");

    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [localUrl](QObject *obj, const QUrl &objUrl) {
        if (!obj && localUrl == objUrl) {
            qCritical() << "[FATAL] Failed to load Desktop.qml! VDS Panic.";
            QCoreApplication::exit(-1);
        }
    }, Qt::QueuedConnection);

    qInfo() << "[VDS] Loading Desktop.qml Shell...";
    engine.load(localUrl);

    // 6. Enter the main event loop
    qInfo() << "[VDS] UI loaded. Handing over thread execution to OS...";
    return app.exec();
}
