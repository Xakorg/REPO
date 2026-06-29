cmake_minimum_required(VERSION 3.16)
project(VoltraOOBE VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt6 REQUIRED COMPONENTS Core Gui Qml Quick)

qt_add_executable(VoltraOOBE
    main.cpp
)

qt_add_qml_module(VoltraOOBE
    URI Voltra
    VERSION 1.0
    QML_FILES Main.qml
)

target_link_libraries(VoltraOOBE PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
)
