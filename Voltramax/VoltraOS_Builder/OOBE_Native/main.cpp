#include <QGuiApplication>
#include <QQmlApplicationEngine>

// VOLTRA OS - NATIVE OOBE RUNTIME
// This C++ engine directly hooks into the Linux DRM/Wayland layer.
// Blazing fast boot time, zero web browser overhead.

int main(int argc, char *argv[])
{
    // Native High-DPI scaling for ultra-crisp 4K/OLED screens
    QGuiApplication::setHighDpiScaleFactorRoundingPolicy(Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    QGuiApplication app(argc, argv);
    QQmlApplicationEngine engine;

    const QUrl url(u"qrc:/Voltra/Main.qml"_qs);
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed,
        &app, []() { QCoreApplication::exit(-1); },
        Qt::QueuedConnection);
    
    // Loads the cinematic UI directly into the GPU
    engine.load(url);

    return app.exec();
}
