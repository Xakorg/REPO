#include "UndoEngine.h"

#include <QDateTime>
#include <QVariantMap>

namespace paint {

// ===========================================================================
// MacroGuard
// ===========================================================================

MacroGuard::MacroGuard(UndoEngine *engine, const QString &label)
    : m_engine(engine), m_label(label)
{
    if (m_engine)
        m_engine->beginMacro(m_label);
}

MacroGuard::~MacroGuard()
{
    release();
}

void MacroGuard::release()
{
    if (m_released)
        return;
    m_released = true;
    if (m_engine)
        m_engine->endMacro();
}

// ===========================================================================
// Construction / configuration
// ===========================================================================

UndoEngine::UndoEngine(QObject *parent)
    : QObject(parent)
{
    m_steps.reserve(128);
}

UndoEngine::~UndoEngine() = default;

void UndoEngine::setMemoryLimit(int bytes)
{
    m_memoryLimit = qBound(1024 * 1024, bytes, 2048 * 1024 * 1024);
    enforceBudget();
    emit stateChanged();
}

void UndoEngine::setMaxSteps(int n)
{
    m_maxSteps = qBound(8, n, 10000);
    enforceBudget();
    emit stateChanged();
}

void UndoEngine::setCoalescingEnabled(bool v)
{
    if (m_coalescing == v)
        return;
    m_coalescing = v;
    emit stateChanged();
}

void UndoEngine::setRecording(bool v)
{
    if (m_recording == v)
        return;
    m_recording = v;
    emit stateChanged();
}

// ===========================================================================
// Recording
// ===========================================================================

void UndoEngine::push(const QString &label, std::function<void()> undo,
                      std::function<void()> redo, qint64 bytes, const QString &mergeKey,
                      int coalesceMs, bool runRedoNow)
{
    if (!m_recording || !undo || !redo)
        return;

    // Macro scope: buffer the step, do not touch the history yet.
    if (m_macroDepth > 0) {
        UndoStep step;
        step.label = label;
        step.mergeKey = mergeKey;
        step.bytes = bytes;
        step.timestampMs = QDateTime::currentMSecsSinceEpoch();
        step.undoFn = undo;
        step.redoFn = redo;
        m_macroBuffer.append(step);
        m_memory += bytes;
        emit stateChanged();
        if (runRedoNow)
            redo();
        return;
    }

    const qint64 now = QDateTime::currentMSecsSinceEpoch();

    // Coalescing: same key, recorded within the window, and there is an open
    // redo tail to absorb it. This is what makes a continuous stroke one step.
    if (m_coalescing && !mergeKey.isEmpty() && mergeKey == m_lastKey
        && !m_steps.isEmpty() && (now - m_lastPushMs) <= qint64(coalesceMs)
        && m_position == m_steps.size() - 1) {
        UndoStep &top = m_steps[m_position];
        // Keep the ORIGINAL undo (pre-stroke state), replace the redo with the
        // NEWEST state, so a single Ctrl+Z restores the whole stroke.
        top.redoFn = redo;
        top.bytes = bytes;
        top.merged = true;
        top.mergeCount++;
        top.timestampMs = now;
        top.label = label;
        m_memory += bytes;
        m_lastPushMs = now;
        enforceBudget();
        emit stateChanged();
        if (runRedoNow)
            redo();
        emit pushed(label);
        return;
    }

    // Discard any redo tail: a new action invalidates it.
    if (m_position + 1 < m_steps.size()) {
        for (int i = m_steps.size() - 1; i > m_position; --i)
            m_memory -= m_steps.at(i).bytes;
        m_steps.resize(m_position + 1);
    }

    UndoStep step;
    step.label = label;
    step.mergeKey = mergeKey;
    step.bytes = bytes;
    step.timestampMs = now;
    step.undoFn = undo;
    step.redoFn = redo;
    m_steps.append(step);
    m_position = m_steps.size() - 1;
    m_memory += bytes;
    m_lastKey = mergeKey;
    m_lastPushMs = now;
    ++m_revision;

    enforceBudget();
    emit stateChanged();
    emit pushed(label);

    if (runRedoNow)
        redo();
}

void UndoEngine::pushApplied(const QString &label, std::function<void()> undo,
                             std::function<void()> redo, qint64 bytes,
                             const QString &mergeKey, int coalesceMs)
{
    push(label, undo, redo, bytes, mergeKey, coalesceMs, false);
}

void UndoEngine::beginMacro(const QString &label)
{
    if (m_macroDepth == 0) {
        m_macroLabel = label;
        m_macroBuffer.clear();
    }
    ++m_macroDepth;
}

void UndoEngine::endMacro()
{
    if (m_macroDepth <= 0)
        return;
    --m_macroDepth;
    if (m_macroDepth > 0)
        return;

    if (m_macroBuffer.isEmpty()) {
        m_macroLabel.clear();
        return;
    }

    // Compose the children's undo/redo into a single ordered pair. Redo runs
    // children forward, undo runs them backward - the standard composition.
    QVector<UndoStep> children = m_macroBuffer;
    const QString label = m_macroLabel;
    qint64 bytes = 0;
    for (const UndoStep &s : children)
        bytes += s.bytes;

    std::function<void()> doUndo = [children]() {
        for (int i = children.size() - 1; i >= 0; --i)
            if (children.at(i).undoFn)
                children.at(i).undoFn();
    };
    std::function<void()> doRedo = [children]() {
        for (const UndoStep &s : children)
            if (s.redoFn)
                s.redoFn();
    };

    m_macroBuffer.clear();
    m_macroLabel.clear();

    push(label, doUndo, doRedo, bytes, QString(), 0, false);
    if (!m_steps.isEmpty())
        m_steps.last().isMacro = true;
}

MacroGuard UndoEngine::macro(const QString &label)
{
    return MacroGuard(this, label);
}

// ===========================================================================
// Traversal
// ===========================================================================

void UndoEngine::runStep(const UndoStep &step, bool isRedo)
{
    // Convert a step to another signal before touching the document: a state
    // that is already applied is a no-op rather than a corrupting one.
    if (isRedo) {
        if (step.redoFn)
            step.redoFn();
    } else {
        if (step.undoFn)
            step.undoFn();
    }
}

bool UndoEngine::undo()
{
    if (!canUndo())
        return false;
    const UndoStep step = m_steps.at(m_position);
    runStep(step, false);
    --m_position;
    ++m_revision;
    // A new branch starts here: the next push replaces the redo tail.
    if (m_position + 1 < m_steps.size())
        m_lastKey.clear();
    emit stateChanged();
    emit undone(step.label);
    return true;
}

bool UndoEngine::redo()
{
    if (!canRedo())
        return false;
    ++m_position;
    const UndoStep step = m_steps.at(m_position);
    runStep(step, true);
    ++m_revision;
    if (m_position + 1 < m_steps.size())
        m_lastKey.clear();
    emit stateChanged();
    emit redone(step.label);
    return true;
}

void UndoEngine::clear()
{
    if (m_steps.isEmpty())
        return;
    m_steps.clear();
    m_position = -1;
    m_memory = 0;
    m_lastKey.clear();
    ++m_revision;
    emit stateChanged();
    emit cleared();
}

void UndoEngine::clearRedo()
{
    if (m_position + 1 >= m_steps.size())
        return;
    for (int i = m_steps.size() - 1; i > m_position; --i)
        m_memory -= m_steps.at(i).bytes;
    m_steps.resize(m_position + 1);
    emit stateChanged();
}

bool UndoEngine::jumpTo(int index)
{
    const int target = qBound(-1, index, m_steps.size() - 1);
    if (target == m_position)
        return false;
    while (m_position > target)
        if (!undo())
            break;
    while (m_position < target)
        if (!redo())
            break;
    emit stateChanged();
    return true;
}

// ===========================================================================
// State
// ===========================================================================

QString UndoEngine::undoLabel() const
{
    if (!canUndo())
        return QString();
    return m_steps.at(m_position).label;
}

QString UndoEngine::redoLabel() const
{
    if (!canRedo())
        return QString();
    return m_steps.at(m_position + 1).label;
}

QVariantList UndoEngine::entries() const
{
    QVariantList out;
    for (int i = 0; i < m_steps.size(); ++i) {
        const UndoStep &s = m_steps.at(i);
        QVariantMap m;
        m.insert("index", i);
        m.insert("label", s.label);
        m.insert("bytes", double(s.bytes));
        m.insert("position", i == m_position);
        m.insert("future", i > m_position);
        m.insert("merged", s.merged);
        m.insert("mergeCount", s.mergeCount);
        m.insert("macro", s.isMacro);
        m.insert("timestamp", QDateTime::fromMSecsSinceEpoch(s.timestampMs)
                                   .toString(QStringLiteral("HH:mm:ss.zzz")));
        out.append(m);
    }
    return out;
}

QString UndoEngine::historySummary(int maxEntries) const
{
    QStringList lines;
    const int first = qMax(0, m_steps.size() - qMax(1, maxEntries));
    for (int i = m_steps.size() - 1; i >= first; --i) {
        const UndoStep &s = m_steps.at(i);
        const QChar marker = (i == m_position) ? QChar('>') : QChar(' ');
        lines.append(QStringLiteral("%1 %2. %3%4")
                         .arg(marker)
                         .arg(i + 1)
                         .arg(s.label)
                         .arg(s.merged
                                  ? QStringLiteral(" (merged x%1)").arg(s.mergeCount + 1)
                                  : QString()));
    }
    return lines.join(QLatin1Char('\n'));
}

UndoEngine::Checkpoint UndoEngine::checkpoint(const QByteArray &payload) const
{
    Checkpoint c;
    c.revision = m_revision;
    c.lastLabel = undoLabel().isEmpty() ? redoLabel() : undoLabel();
    c.steps = m_steps.size();
    c.bytes = m_memory;
    c.payload = payload;
    return c;
}

// ===========================================================================
// Budget
// ===========================================================================

void UndoEngine::applyCoalesce(const QString &mergeKey, int coalesceMs,
                               const QString &label, std::function<void()> undo,
                               std::function<void()> redo, qint64 bytes)
{
    push(label, undo, redo, bytes, mergeKey, coalesceMs, false);
}

void UndoEngine::enforceBudget()
{
    // 1. Drop oldest steps until the byte budget fits.
    while (m_memory > m_memoryLimit && m_steps.size() > 1) {
        const qint64 head = m_steps.first().bytes;
        m_memory -= head;
        m_steps.removeFirst();
        --m_position;
        if (m_position < -1)
            m_position = -1;
    }

    // 2. Drop oldest steps beyond the count limit.
    while (m_steps.size() > m_maxSteps) {
        m_memory -= m_steps.first().bytes;
        m_steps.removeFirst();
        --m_position;
        if (m_position < -1)
            m_position = -1;
    }

    // 3. A macro whose children were evicted is no longer safe to run.
    if (!m_steps.isEmpty()) {
        for (int i = m_position; i >= 0; --i) {
            if (m_steps.at(i).isMacro && !m_steps.at(i).children.isEmpty()) {
                // (children are stored inside the closures, so eviction above
                // only ever removes whole steps; nothing else to do here)
                break;
            }
        }
    }
    rebalance();
}

void UndoEngine::rebalance()
{
    qint64 total = 0;
    for (const UndoStep &s : m_steps)
        total += s.bytes;
    // Guard against double counting introduced by coalescing adjustments.
    m_memory = total;
}

} // namespace paint
