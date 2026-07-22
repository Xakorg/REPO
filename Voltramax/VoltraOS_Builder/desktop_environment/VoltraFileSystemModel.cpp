#include "VoltraFileSystemModel.h"
#include <QDebug>
#include <QTimer>
#include <thread>
#include <chrono>

// ----------------------------------------------------------------------------
// VoltraFileSystemModel Implementation
// ----------------------------------------------------------------------------

VoltraFileSystemModel::VoltraFileSystemModel(QObject *parent)
    : QAbstractListModel(parent), m_currentPath("nvme0n1:/VoltraOS/Users/MainUser/Home")
{
    qInfo() << "[VFS-MODEL] Initializing NVMe File System Bridge...";
    fetchDirectoryContents();
}

int VoltraFileSystemModel::rowCount(const QModelIndex &parent) const {
    if (parent.isValid()) return 0;
    return m_files.count();
}

QVariant VoltraFileSystemModel::data(const QModelIndex &index, int role) const {
    if (!index.isValid() || index.row() >= m_files.count())
        return QVariant();

    const VoltraFileNode &file = m_files[index.row()];

    switch (role) {
        case NameRole: return file.name;
        case TypeRole: return file.type;
        case SizeRole: return formatSize(file.sizeBytes);
        case ModifiedRole: return file.lastModified.toString("MMM d, yyyy - hh:mm AP");
        case IconRole: return file.iconPath;
        default: return QVariant();
    }
}

QHash<int, QByteArray> VoltraFileSystemModel::roleNames() const {
    QHash<int, QByteArray> roles;
    roles[NameRole] = "fileName";
    roles[TypeRole] = "fileType";
    roles[SizeRole] = "fileSize";
    roles[ModifiedRole] = "fileModified";
    roles[IconRole] = "fileIcon";
    return roles;
}

QString VoltraFileSystemModel::currentPath() const {
    return m_currentPath;
}

void VoltraFileSystemModel::setCurrentPath(const QString &path) {
    if (m_currentPath != path) {
        m_currentPath = path;
        fetchDirectoryContents();
        emit currentPathChanged();
    }
}

void VoltraFileSystemModel::navigateUp() {
    qInfo() << "[VFS-MODEL] Navigating up from" << m_currentPath;
    
    // Simple path parsing simulation
    if (m_currentPath.contains("/")) {
        int lastSlash = m_currentPath.lastIndexOf("/");
        if (lastSlash > 0) {
            setCurrentPath(m_currentPath.left(lastSlash));
            return;
        }
    }
    setCurrentPath("nvme0n1:/");
}

void VoltraFileSystemModel::openFolder(int index) {
    if (index >= 0 && index < m_files.count()) {
        const VoltraFileNode &file = m_files[index];
        if (file.type == "directory") {
            setCurrentPath(m_currentPath + "/" + file.name);
        }
    }
}

void VoltraFileSystemModel::executeFile(int index) {
    if (index >= 0 && index < m_files.count()) {
        const VoltraFileNode &file = m_files[index];
        qInfo() << "[VFS-MODEL] Executing file natively via Kernel:" << file.name;
        // In reality, this would emit a signal to DesktopDaemon to call sys_execve
    }
}

void VoltraFileSystemModel::xakAutoOrganize() {
    qInfo() << "[XAK-AI] Analyzing directory contents for semantic clustering...";
    
    // Simulate AI processing delay
    QTimer::singleShot(1500, this, [this]() {
        beginResetModel();
        m_files.clear();
        
        // Post-AI Organization
        m_files.append({"Images", "directory", 0, QDateTime::currentDateTime(), "📁"});
        m_files.append({"Documents", "directory", 0, QDateTime::currentDateTime(), "📁"});
        m_files.append({"Executables", "directory", 0, QDateTime::currentDateTime(), "📁"});
        m_files.append({"cyberpunk2077.exe", "executable", 85000000000, QDateTime::currentDateTime(), "🎮"});
        
        endResetModel();
        
        emit aiOrganizationComplete("Xak AI successfully organized 24 files into 3 categories using semantic clustering.");
        qInfo() << "[XAK-AI] Directory auto-organization complete.";
    });
}

void VoltraFileSystemModel::fetchDirectoryContents() {
    qInfo() << "[VFS-MODEL] Fetching inodes for path:" << m_currentPath;
    
    beginResetModel();
    m_files.clear();

    // Simulate different contents based on path
    if (m_currentPath.endsWith("Home")) {
        m_files.append({"Documents", "directory", 0, QDateTime::currentDateTime().addDays(-2), "📁"});
        m_files.append({"Downloads", "directory", 0, QDateTime::currentDateTime().addDays(-1), "📁"});
        m_files.append({"Pictures", "directory", 0, QDateTime::currentDateTime().addDays(-5), "📁"});
        m_files.append({"voltra_kernel_src.zip", "file", 14500000, QDateTime::currentDateTime(), "📦"});
        m_files.append({"project_vision.md", "file", 2400, QDateTime::currentDateTime().addSecs(-3600), "📝"});
        m_files.append({"wallpaper_4k.png", "image", 8500000, QDateTime::currentDateTime().addDays(-10), "🖼️"});
    } else {
        // Generic directory contents
        m_files.append({"..", "directory", 0, QDateTime::currentDateTime(), "🔙"});
        m_files.append({"system_config.json", "file", 1024, QDateTime::currentDateTime(), "⚙️"});
        m_files.append({"data.bin", "file", 4096, QDateTime::currentDateTime(), "📄"});
    }
    
    endResetModel();
}

QString VoltraFileSystemModel::formatSize(qint64 bytes) const {
    if (bytes == 0) return "--";
    if (bytes < 1024) return QString::number(bytes) + " B";
    if (bytes < 1024 * 1024) return QString::number(bytes / 1024) + " KB";
    if (bytes < 1024 * 1024 * 1024) return QString::number(bytes / (1024 * 1024)) + " MB";
    return QString::number(bytes / (1024 * 1024 * 1024)) + " GB";
}
