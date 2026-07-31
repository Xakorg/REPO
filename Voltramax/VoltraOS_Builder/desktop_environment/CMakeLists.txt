cmake_minimum_required(VERSION 3.16)

project(VoltraOS_Enterprise VERSION 2.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find Qt6 components required for the massive VoltraOS ecosystem
find_package(Qt6 COMPONENTS Core Gui Qml Quick WebEngineQuick WebSockets REQUIRED)

# Combine the Desktop Environment, WTL, and OOBE subsystems into a single binary
set(PROJECT_SOURCES
    main.cpp
    resources.qrc
    # OS Core & Kernel Bridges
    DesktopDaemon.cpp
    DesktopDaemon.h
    SyscallBridge.cpp
    SyscallBridge.h
    WTLManager.cpp
    WTLManager.h
    SettingsEngine.cpp
    SettingsEngine.h
    InstallerEngine.cpp
    InstallerEngine.h
    # Apps & Media
    BrowserEngine.cpp
    BrowserEngine.h
    StreamEngine.cpp
    StreamEngine.h
    TerminalPTY.cpp
    TerminalPTY.h
    VoltMasterEngine.cpp
    VoltMasterEngine.h
    DriveEngine.cpp
    DriveEngine.h
    VoltraFileSystemModel.cpp
    VoltraFileSystemModel.h
    # Services
    GameAggregatorService.cpp
    GameAggregatorService.h
    XakCoachingService.cpp
    XakCoachingService.h
    XakChatService.cpp
    XakChatService.h
    # The Setup Experience (OOBE)
    ../OOBE_Native/OOBEManager.cpp
    ../OOBE_Native/OOBEManager.h
)

# Define the single massive VoltraOS executable
add_executable(VoltraOS ${PROJECT_SOURCES})

# Link against Qt6 libraries
target_link_libraries(VoltraOS PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::WebEngineQuick
    Qt6::WebSockets
)

# Include current directory and OOBE directory
target_include_directories(VoltraOS PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../OOBE_Native
)
