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
    Core/main.cpp
    Core/resources.qrc
    
    # OS Core & Kernel Bridges
    Core/DesktopDaemon.cpp
    Core/DesktopDaemon.h
    Core/Kernel/SyscallBridge.cpp
    Core/Kernel/SyscallBridge.h
    Core/Windows/WTLManager.cpp
    Core/Windows/WTLManager.h
    Core/Settings/SettingsEngine.cpp
    Core/Settings/SettingsEngine.h
    Core/Settings/SystemSettings.qml
    Core/BootSplash.qml
    Core/Desktop.qml
    
    # Core Services
    Core/SettingsEngine.h
    Core/Streaming/StreamEngine.cpp
    Core/Streaming/StreamEngine.h
    
    # Apps & Media
    Apps/Browser/BrowserEngine.cpp
    Apps/Browser/BrowserEngine.h
    Apps/Browser/VoltraBrowser.qml
    Apps/Stream/XakteirStream.qml
    Apps/Drive/DriveEngine.cpp
    Apps/Drive/DriveEngine.h
    Apps/Drive/XakteirDrive.qml
    Apps/Terminal/TerminalPTY.cpp
    Apps/Terminal/TerminalPTY.h
    Apps/Terminal/VoltTerm.qml
    
    # Apps - Files & Media
    Apps/Files/VoltraFileSystemModel.cpp
    Apps/Files/VoltraFileSystemModel.h
    Apps/Files/VoltraFiles.qml
    Apps/Files/VoltMaster.cpp
    Apps/Files/VoltMasterEngine.cpp
    Apps/Files/VoltMasterEngine.h
    Apps/Files/VoltMaster.qml
    Apps/Weather/VoltraCamera.qml
    Apps/Weather/VoltraWeather.qml
    Apps/Store/VoltraStore.qml
    Apps/Installer/VoltraInstaller.qml
    Apps/Installer/InstallerEngine.cpp
    Apps/Installer/InstallerEngine.h
    
    # Services
    Apps/Games/GameAggregatorService.cpp
    Apps/Games/GameAggregatorService.h
    Apps/Games/GameHub.qml
    Apps/Chat/XakChatService.cpp
    Apps/Chat/XakChatService.h
    Apps/Chat/XakChat.qml
    Apps/XakAI/XakCoachingService.cpp
    Apps/XakAI/XakCoachingService.h
    Apps/XakAI/XakPlayground.qml
    Apps/XakAI/XakAIOptInPage.qml
    Apps/XakAI/XakAIPage.qml
    
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

# Include directories
target_include_directories(VoltraOS PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}/Core
    ${CMAKE_CURRENT_SOURCE_DIR}/Core/Kernel
    ${CMAKE_CURRENT_SOURCE_DIR}/Core/Settings
    ${CMAKE_CURRENT_SOURCE_DIR}/Core/Windows
    ${CMAKE_CURRENT_SOURCE_DIR}/Core/Streaming
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Browser
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Drive
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Terminal
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Files
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Games
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Chat
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/XakAI
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Weather
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Store
    ${CMAKE_CURRENT_SOURCE_DIR}/Apps/Installer
    ${CMAKE_CURRENT_SOURCE_DIR}/../OOBE_Native
)

# Resource file
add_resources(VoltraOS Core/resources.qrc)
