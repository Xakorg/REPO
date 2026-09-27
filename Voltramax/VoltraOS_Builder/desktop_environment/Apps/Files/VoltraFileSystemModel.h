#ifndef VOLTRA_FILE_SYSTEM_MODEL_H
#define VOLTRA_FILE_SYSTEM_MODEL_H

#include <QAbstractListModel>
#include <QList>
#include <QString>
#include <QDateTime>

// ----------------------------------------------------------------------------
// VoltraOS - NVMe Virtual File System Model
// ----------------------------------------------------------------------------
// This C++ class acts as the bridge between the Voltra Kernel VFS (NVMe/FAT32)
// and the QML User Interface. It parses directory structures and provides
// high-speed hardware-accelerated data to the GUI.

struct VoltraFileNode {
    QString name;
    QString type;      // "directory", "file", "image", "executable"
    qint64 sizeBytes;
    QDateTime lastModified;
    QString iconPath;
};

class VoltraFileSystemModel : public QAbstractListModel {
    Q_OBJECT
    Q_PROPERTY(QString currentPath READ currentPath WRITE setCurrentPath NOTIFY currentPathChanged)
    Q_PROPERTY(int fileCount READ rowCount NOTIFY currentPathChanged)

public:
    enum FileRoles {
        NameRole = Qt::UserRole + 1,
        TypeRole,
        SizeRole,
        ModifiedRole,
        IconRole
    };

    explicit VoltraFileSystemModel(QObject *parent = nullptr);

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    QHash<int, QByteArray> roleNames() const override;

    QString currentPath() const;
    void setCurrentPath(const QString &path);

    // QML Invokables for File Operations
    Q_INVOKABLE void navigateUp();
    Q_INVOKABLE void openFolder(int index);
    Q_INVOKABLE void executeFile(int index);
    Q_INVOKABLE void xakAutoOrganize(); // AI Auto-organization

signals:
    void currentPathChanged();
    void aiOrganizationComplete(const QString &summary);

private:
    void fetchDirectoryContents();
    QString formatSize(qint64 bytes) const;

    QString m_currentPath;
    QList<VoltraFileNode> m_files;
};

#endif // VOLTRA_FILE_SYSTEM_MODEL_H
