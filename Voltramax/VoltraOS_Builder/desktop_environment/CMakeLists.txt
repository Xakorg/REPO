cmake_minimum_required(VERSION 3.16)

project(VoltraDesktopDaemon VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find Qt6 Core, Gui, Qml/Quick, and WebEngine
find_package(Qt6 COMPONENTS Core Gui Qml Quick WebEngineQuick WebSockets REQUIRED)

# The C++ source files for the Voltra Display Server Daemon
set(PROJECT_SOURCES
    main.cpp
    DesktopDaemon.cpp
    DesktopDaemon.h
    GameAggregatorService.cpp
    GameAggregatorService.h
    XakCoachingService.cpp
    XakCoachingService.h
    VoltraFileSystemModel.cpp
    VoltraFileSystemModel.h
    XakChatService.cpp
    XakChatService.h
)

# Define the executable
add_executable(VoltraDesktop ${PROJECT_SOURCES})

# Link against Qt6 libraries
target_link_libraries(VoltraDesktop PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::WebEngineQuick
    Qt6::WebSockets
)

# Include current directory
target_include_directories(VoltraDesktop PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
