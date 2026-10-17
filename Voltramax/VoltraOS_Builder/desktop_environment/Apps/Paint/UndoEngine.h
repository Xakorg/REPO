#ifndef PAINT_UNDO_ENGINE_H
#define PAINT_UNDO_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - UndoEngine
// =============================================================================
//  A bounded, coalescing, memory-accounted command history.
//
//  Design notes:
//
//   * Commands are closures over the undo target rather than an inheritance
//     hierarchy, because the document's own types (layers, strokes, filters)
//     are what every command needs anyway, and a shared header for a class
//     hierarchy would drag the whole engine graph into every translation unit.
//
//   * Coalescing is explicit: a continuous stroke calls
//     push(..., mergeKey="stroke:<layer>:<id>", coalesceMs=...) and every
//     incremental commit during the drag lands in the SAME step. Release the
//     pen and the next stroke gets a new key, so one stroke is one undo.
//
//   * Memory accounting is real: each step declares its footprint and the
//     history drops the oldest steps (and runs their undo() only if they are
//     still sitting on the "undone" side - they are not, by construction) when
//     the budget is exceeded. The UI can read exactly how many bytes the
//     history is holding.
//
//   * Macros: beginMacro/endMacro nest into a single step so "transform +
//     reposition + rasterise" undoes as one action.
// =============================================================================

#include "PaintTypes.h"

#include <QObject>
#include <QString>
#include <QStringList>
#include <QVariantList>
#include <QVector>

#include <functional>

namespace paint {

// ---------------------------------------------------------------------------
// One history entry.
// ---------------------------------------------------------------------------
struct UndoStep {
    QString label;
    QString mergeKey;
    qint64 bytes = 0;
    qint64 timestampMs = 0;
    std::function<void()> undoFn;
    std::function<void()> redoFn;
    bool merged = false;
    int mergeCount = 0;
    bool isMacro = false;
    QVector<UndoStep> children;   // when isMacro
};

// ---------------------------------------------------------------------------
// Macro guard, so nested scopes compose without manual bookkeeping.
// ---------------------------------------------------------------------------
class MacroGuard
{
public:
    MacroGuard(UndoEngine *engine, const QString &label);
    ~MacroGuard();
    MacroGuard(const MacroGuard &) = delete;
    MacroGuard &operator=(const MacroGuard &) = delete;
    // Movable so UndoEngine::macro() can be returned by value.
    MacroGuard(MacroGuard &&other) noexcept
        : m_engine(other.m_engine), m_label(std::move(other.m_label))
    {
        other.m_released = true;
    }
    MacroGuard &operator=(MacroGuard &&) = delete;
    void release();

private:
    UndoEngine *m_engine = nullptr;
    QString m_label;
    bool m_released = false;
};

class UndoEngine : public QObject
{
    Q_OBJECT

    Q_PROPERTY(bool canUndo READ canUndo NOTIFY stateChanged)
    Q_PROPERTY(bool canRedo READ canRedo NOTIFY stateChanged)
    Q_PROPERTY(QString undoLabel READ undoLabel NOTIFY stateChanged)
    Q_PROPERTY(QString redoLabel READ redoLabel NOTIFY stateChanged)
    Q_PROPERTY(int undoCount READ undoCount NOTIFY stateChanged)
    Q_PROPERTY(int redoCount READ redoCount NOTIFY stateChanged)
    Q_PROPERTY(qint64 memoryBytes READ memoryBytes NOTIFY stateChanged)
    Q_PROPERTY(int memoryLimit READ memoryLimit WRITE setMemoryLimit NOTIFY stateChanged)
    Q_PROPERTY(bool recording READ recording NOTIFY stateChanged)
    Q_PROPERTY(QVariantList entries READ entries NOTIFY stateChanged)
    Q_PROPERTY(int position READ position NOTIFY stateChanged)

public:
    explicit UndoEngine(QObject *parent = nullptr);
    ~UndoEngine() override;

    // ---- configuration -----------------------------------------------------
    int memoryLimit() const { return m_memoryLimit; }
    void setMemoryLimit(int bytes);
    int maxSteps() const { return m_maxSteps; }
    void setMaxSteps(int n);
    bool coalescingEnabled() const { return m_coalescing; }
    void setCoalescingEnabled(bool v);

    // ---- recording -----------------------------------------------------------
    // `redo` is executed immediately unless `runRedoNow` is false (which is
    // what you want when the caller has already applied the change).
    void push(const QString &label, std::function<void()> undo,
              std::function<void()> redo, qint64 bytes = 0,
              const QString &mergeKey = QString(), int coalesceMs = 0,
              bool runRedoNow = false);

    // Convenience: push a no-op-capable step where redo already happened.
    void pushApplied(const QString &label, std::function<void()> undo,
                     std::function<void()> redo, qint64 bytes = 0,
                     const QString &mergeKey = QString(), int coalesceMs = 0);

    // ---- macros ------------------------------------------------------------
    void beginMacro(const QString &label);
    void endMacro();
    bool inMacro() const { return m_macroDepth > 0; }
    MacroGuard macro(const QString &label);

    // ---- traversal -----------------------------------------------------------
    bool undo();
    bool redo();
    void clear();
    void clearRedo();
    // Rolls the history back to `index` (used by the history panel).
    bool jumpTo(int index);

    // ---- state ---------------------------------------------------------------
    bool canUndo() const { return m_position >= 0; }
    bool canRedo() const { return m_position + 1 < m_steps.size(); }
    QString undoLabel() const;
    QString redoLabel() const;
    int undoCount() const { return m_position + 1; }
    int redoCount() const { return qMax(0, m_steps.size() - m_position - 1); }
    int position() const { return m_position; }
    int count() const { return m_steps.size(); }
    qint64 memoryBytes() const { return m_memory; }
    bool recording() const { return m_recording; }
    void setRecording(bool v);
    QVariantList entries() const;
    QString historySummary(int maxEntries = 24) const;

    // ---- recovery -------------------------------------------------------------
    // Serialised history of undo/redo labels plus a monotonically increasing
    // revision, so a crash-recovery prompt can say what it lost.
    struct Checkpoint {
        qint64 revision = 0;
        QString lastLabel;
        int steps = 0;
        qint64 bytes = 0;
        QByteArray payload;    // opaque; owned by the caller
    };
    Checkpoint checkpoint(const QByteArray &payload) const;
    void noteRevision(qint64 rev) { m_revision = rev; }
    qint64 revision() const { return m_revision; }

signals:
    void stateChanged();
    void pushed(QString label);
    void undone(QString label);
    void redone(QString label);
    void cleared();

private:
    void runStep(const UndoStep &step, bool isRedo);
    void applyCoalesce(const QString &mergeKey, int coalesceMs, const QString &label,
                       std::function<void()> undo, std::function<void()> redo,
                       qint64 bytes);
    void enforceBudget();
    void rebalance();

    QVector<UndoStep> m_steps;
    int m_position = -1;
    qint64 m_memory = 0;
    int m_memoryLimit = 96 * 1024 * 1024;
    int m_maxSteps = 400;
    bool m_coalescing = true;
    bool m_recording = true;
    int m_macroDepth = 0;
    QString m_macroLabel;
    QVector<UndoStep> m_macroBuffer;
    QVector<qint64> m_macroMemoryMarks;
    qint64 m_revision = 0;
    QString m_lastKey;
    qint64 m_lastPushMs = 0;
};

} // namespace paint

#endif // PAINT_UNDO_ENGINE_H
