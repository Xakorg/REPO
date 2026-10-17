#ifndef PAINT_ENGINE_H
#define PAINT_ENGINE_H

// =============================================================================
//  VOLTRA PAINT - PaintEngine
// =============================================================================
//  The conductor. Every other file in this app is a specialist that knows how
//  to do exactly one thing (rasterise a stroke, blend a layer, serialise a
//  document). PaintEngine is the only object that knows the order in which
//  those things have to happen:
//
//      tablet event  ->  InputEngine      (filter palms, coalesce, smooth)
//                    ->  BrushEngine      (pressure/tilt -> stamp geometry)
//                    ->  Rasterizer       (stamps -> premultiplied pixels)
//                    ->  LayerEngine      (pixels + vectors -> one composite)
//                    ->  PaintCanvasItem  (composite -> screen)
//
//  It also owns the parts of "the application" that are neither a document nor
//  a widget: the current tool, the view transform, the two colours, the
//  clipboard, symmetry, and the autosave clock.
//
//  Design notes worth knowing before editing this file:
//
//  * The document model is the pair (LayerEngine, SelectionEngine). There is no
//    separate PaintDocument class: a layer already carries its base raster, its
//    vector stroke list and its cached composite, and duplicating that into yet
//    another struct would create a second source of truth that could drift.
//
//  * Every mutating operation goes through a helper that (a) performs the edit,
//    (b) invalidates the affected layer cache, (c) records an undo step whose
//    closures capture exactly the bytes that changed. Undo is therefore not a
//    bolted-on feature: it is the only way an edit is allowed to happen.
//
//  * Live ink is real ink. When the pen goes down, a Stroke is created and
//    appended to the live layer immediately; the vector list, not a scratch
//    bitmap, is the thing being edited. Replaying it on invalidation is what
//    makes the artwork stroke-resolution-independent and what makes the .vpx
//    file able to reopen it with no rasterisation loss for vector strokes.
//
//  * Nothing here is simulated. The pressure numbers come from Qt's
//    QTabletEvent, the pixels come from our own scanline rasteriser, the PNG
//    bytes come from our own encoder, and the honest "not configured" states
//    for cloud sync are reported rather than faked.
// =============================================================================

#include "BrushEngine.h"
#include "DocumentStore.h"
#include "Filters.h"
#include "ImageIo.h"
#include "InputEngine.h"
#include "LayerEngine.h"
#include "PaintTypes.h"
#include "SelectionEngine.h"
#include "ShapeEngine.h"
#include "StrokeModel.h"
#include "TextEngine.h"
#include "UndoEngine.h"

#include <QColor>
#include <QElapsedTimer>
#include <QImage>
#include <QObject>
#include <QPointF>
#include <QRectF>
#include <QSize>
#include <QString>
#include <QStringList>
#include <QTransform>
#include <QVariantList>
#include <QVariantMap>
#include <QVector>

class QQuickItem;

namespace paint {

class PaintCanvasItem;

// ---------------------------------------------------------------------------
// A text item that lives in the document. TextEngine knows how to lay out and
// render one; PaintEngine keeps the list and their identity across undo.
// ---------------------------------------------------------------------------
struct CanvasText {
    quint32 id = 0;
    TextItem item;
    quint32 layerId = 0;
};

// ---------------------------------------------------------------------------
// Clipboard. We keep our own copy rather than round-tripping through the
// system clipboard's lossy image path, so alpha and the exact cut rectangle
// survive copy/paste within the app.
// ---------------------------------------------------------------------------
struct ClipboardBlob {
    QImage image;               // ARGB32_Premultiplied, tightly cropped
    QRectF bounds;              // document-space origin the image came from
    QString source;             // "selection", "layer", "external"
    bool valid() const { return !image.isNull(); }
};

class PaintEngine : public QObject
{
    Q_OBJECT

    // ---- document identity -------------------------------------------------
    Q_PROPERTY(QSize documentSize READ documentSize NOTIFY documentSizeChanged)
    Q_PROPERTY(int canvasWidth READ canvasWidth NOTIFY documentSizeChanged)
    Q_PROPERTY(int canvasHeight READ canvasHeight NOTIFY documentSizeChanged)
    Q_PROPERTY(QString title READ title WRITE setTitle NOTIFY titleChanged)
    Q_PROPERTY(QString documentPath READ documentPath NOTIFY pathChanged)
    Q_PROPERTY(bool modified READ modified NOTIFY modifiedChanged)
    Q_PROPERTY(qint64 revision READ revision NOTIFY revisionChanged)
    Q_PROPERTY(bool hasDocument READ hasDocument NOTIFY documentSizeChanged)

    // ---- tool state ----------------------------------------------------------
    Q_PROPERTY(int tool READ tool WRITE setTool NOTIFY toolChanged)
    Q_PROPERTY(QString toolLabel READ toolLabel NOTIFY toolChanged)
    Q_PROPERTY(int previousTool READ previousTool NOTIFY toolChanged)
    Q_PROPERTY(bool toolUsesBrush READ toolUsesBrush NOTIFY toolChanged)
    Q_PROPERTY(bool toolUsesShapeOptions READ toolUsesShapeOptions NOTIFY toolChanged)
    Q_PROPERTY(bool toolUsesSelection READ toolUsesSelection NOTIFY toolChanged)

    // ---- view ----------------------------------------------------------------
    Q_PROPERTY(double zoom READ zoom WRITE setZoom NOTIFY viewChanged)
    Q_PROPERTY(double panX READ panX WRITE setPanX NOTIFY viewChanged)
    Q_PROPERTY(double panY READ panY WRITE setPanY NOTIFY viewChanged)
    Q_PROPERTY(bool handMode READ handMode WRITE setHandMode NOTIFY handModeChanged)
    Q_PROPERTY(bool spacePanning READ spacePanning NOTIFY spacePanningChanged)
    Q_PROPERTY(bool viewFlippedH READ viewFlippedH NOTIFY viewChanged)
    Q_PROPERTY(bool viewFlippedV READ viewFlippedV NOTIFY viewChanged)
    Q_PROPERTY(double rotationDegrees READ rotationDegrees NOTIFY viewChanged)

    // ---- colour ---------------------------------------------------------------
    Q_PROPERTY(QColor foreground READ foreground WRITE setForeground NOTIFY colourChanged)
    Q_PROPERTY(QColor background READ background WRITE setBackground NOTIFY colourChanged)
    Q_PROPERTY(QVariantList recentColours READ recentColours NOTIFY colourChanged)

    // ---- symmetry / guides ----------------------------------------------------
    Q_PROPERTY(int symmetryMode READ symmetryMode WRITE setSymmetryMode
                   NOTIFY symmetryChanged)
    Q_PROPERTY(double symmetryAxisX READ symmetryAxisX WRITE setSymmetryAxisX
                   NOTIFY symmetryChanged)
    Q_PROPERTY(double symmetryAxisY READ symmetryAxisY WRITE setSymmetryAxisY
                   NOTIFY symmetryChanged)
    Q_PROPERTY(int symmetryBranches READ symmetryBranches WRITE setSymmetryBranches
                   NOTIFY symmetryChanged)
    Q_PROPERTY(bool gridVisible READ gridVisible WRITE setGridVisible
                   NOTIFY gridChanged)
    Q_PROPERTY(double gridSize READ gridSize WRITE setGridSize NOTIFY gridChanged)
    Q_PROPERTY(bool gridSnap READ gridSnap WRITE setGridSnap NOTIFY gridChanged)
    Q_PROPERTY(bool guidesVisible READ guidesVisible WRITE setGuidesVisible
                   NOTIFY gridChanged)
    Q_PROPERTY(QVariantList guidesV READ guidesV NOTIFY gridChanged)
    Q_PROPERTY(QVariantList guidesH READ guidesH NOTIFY gridChanged)

    // ---- layers ----------------------------------------------------------------
    Q_PROPERTY(QVariantList layerList READ layerList NOTIFY layersChanged)
    Q_PROPERTY(int activeLayerIndex READ activeLayerIndex WRITE setActiveLayerIndex
                   NOTIFY activeLayerChanged)
    Q_PROPERTY(QString activeLayerName READ activeLayerName NOTIFY activeLayerChanged)
    Q_PROPERTY(qint64 layerMemory READ layerMemory NOTIFY layersChanged)

    // ---- brush -------------------------------------------------------------------
    Q_PROPERTY(double brushSize READ brushSize WRITE setBrushSize NOTIFY brushChanged)
    Q_PROPERTY(double brushFlow READ brushFlow WRITE setBrushFlow NOTIFY brushChanged)
    Q_PROPERTY(double brushOpacity READ brushOpacity WRITE setBrushOpacity
                   NOTIFY brushChanged)
    Q_PROPERTY(double brushHardness READ brushHardness WRITE setBrushHardness
                   NOTIFY brushChanged)
    Q_PROPERTY(double brushSpacing READ brushSpacing WRITE setBrushSpacing
                   NOTIFY brushChanged)
    Q_PROPERTY(int nibMode READ nibMode WRITE setNibMode NOTIFY brushChanged)
    Q_PROPERTY(QVariantList brushPresets READ brushPresets NOTIFY brushChanged)
    Q_PROPERTY(QString brushPresetName READ brushPresetName NOTIFY brushChanged)

    // ---- shape / text -----------------------------------------------------------------
    Q_PROPERTY(int shapeKind READ shapeKind WRITE setShapeKind NOTIFY shapeChanged)
    Q_PROPERTY(bool shapeFilled READ shapeFilled WRITE setShapeFilled NOTIFY shapeChanged)
    Q_PROPERTY(double shapeStrokeWidth READ shapeStrokeWidth WRITE setShapeStrokeWidth
                   NOTIFY shapeChanged)
    Q_PROPERTY(int shapeSides READ shapeSides WRITE setShapeSides NOTIFY shapeChanged)
    Q_PROPERTY(bool snapEnabled READ snapEnabled WRITE setSnapEnabled NOTIFY shapeChanged)
    Q_PROPERTY(QString textPreview READ textPreview NOTIFY textChanged)
    Q_PROPERTY(QString textFontFamily READ textFontFamily WRITE setTextFontFamily
                   NOTIFY textChanged)
    Q_PROPERTY(double textFontSize READ textFontSize WRITE setTextFontSize
                   NOTIFY textChanged)
    Q_PROPERTY(QVariantList textItems READ textItems NOTIFY textItemsChanged)

    // ---- selection ---------------------------------------------------------------------
    Q_PROPERTY(bool selectionActive READ selectionActive NOTIFY selectionChanged)
    Q_PROPERTY(QRectF selectionBounds READ selectionBounds NOTIFY selectionChanged)
    Q_PROPERTY(QString selectionKind READ selectionKind NOTIFY selectionChanged)
    Q_PROPERTY(double selectionFillRatio READ selectionFillRatio NOTIFY selectionChanged)
    Q_PROPERTY(int selectionMode READ selectionMode WRITE setSelectionMode
                   NOTIFY selectionChanged)

    // ---- undo --------------------------------------------------------------------------
    Q_PROPERTY(bool canUndo READ canUndo NOTIFY historyChanged)
    Q_PROPERTY(bool canRedo READ canRedo NOTIFY historyChanged)
    Q_PROPERTY(QString undoLabel READ undoLabel NOTIFY historyChanged)
    Q_PROPERTY(QString redoLabel READ redoLabel NOTIFY historyChanged)
    Q_PROPERTY(QVariantList history READ history NOTIFY historyChanged)

    // ---- status / lifecycle ----------------------------------------------------------------
    Q_PROPERTY(QString statusMessage READ statusMessage NOTIFY statusMessageChanged)
    Q_PROPERTY(QString liveReadout READ liveReadout NOTIFY liveChanged)
    Q_PROPERTY(double livePressure READ livePressure NOTIFY liveChanged)
    Q_PROPERTY(double liveTilt READ liveTilt NOTIFY liveChanged)
    Q_PROPERTY(QString pointerName READ pointerName NOTIFY liveChanged)
    Q_PROPERTY(bool autosaveEnabled READ autosaveEnabled WRITE setAutosaveEnabled
                   NOTIFY autosaveChanged)
    Q_PROPERTY(qint64 autosaveCountdown READ autosaveCountdown NOTIFY autosaveChanged)
    Q_PROPERTY(bool recoveryAvailable READ recoveryAvailable NOTIFY recoveryChanged)
    Q_PROPERTY(QVariantList recentDocuments READ recentDocuments NOTIFY recentChanged)
    Q_PROPERTY(QVariantList filterCatalogue READ filterCatalogue CONSTANT)
    Q_PROPERTY(QStringList shortcutSheet READ shortcutSheet CONSTANT)

public:
    explicit PaintEngine(QObject *parent = nullptr);
    ~PaintEngine() override;

    // -----------------------------------------------------------------------
    // Access to the sub-engines. QML gets these through Q_PROPERTY-style
    // invokables rather than raw pointers, but C++ and the canvas item need
    // direct access.
    // -----------------------------------------------------------------------
    LayerEngine &layers() { return m_layers; }
    const LayerEngine &layers() const { return m_layers; }
    SelectionEngine &selection() { return m_selection; }
    UndoEngine &undoEngine() { return m_undo; }
    BrushEngine &brush() { return m_brush; }
    ShapeEngine &shapes() { return m_shapes; }
    TextEngine &text() { return m_text; }
    InputEngine &input() { return m_input; }
    Filters &filters() { return m_filters; }
    DocumentStore &store() { return m_store; }

    // -----------------------------------------------------------------------
    // The canvas item. QML calls createCanvasItem() and hands the result to a
    // container; the engine keeps a non-owning pointer so it can push repaints.
    // -----------------------------------------------------------------------
    Q_INVOKABLE QQuickItem *createCanvasItem();
    PaintCanvasItem *canvas() const { return m_canvas; }

    // -----------------------------------------------------------------------
    // Input path (called by PaintCanvasItem, never by QML directly).
    // `phase` is 0 = press, 1 = move, 2 = release, 3 = hover.
    // Returns true when the engine consumed the event.
    // -----------------------------------------------------------------------
    bool handlePointer(int phase, const RawSample &sample);
    bool handleHover(const RawSample &sample);
    bool handleWheel(double deltaY, const QPointF &itemPos, bool ctrlHeld);
    bool handleKey(int key, const QString &text, int modifiers, bool pressed);

    // Item <-> document coordinate helpers. The canvas item and the rulers both
    // need these, and they must agree to the pixel or the cursor lies.
    QTransform viewTransform() const;
    QTransform documentTransform() const;
    QPointF itemToDocument(const QPointF &itemPos) const;
    QPointF documentToItem(const QPointF &docPos) const;
    QRectF documentRect() const { return QRectF(QPointF(0, 0), QSizeF(m_size)); }
    QSize documentSize() const { return m_size; }
    int canvasWidth() const { return m_size.width(); }
    int canvasHeight() const { return m_size.height(); }
    bool hasDocument() const { return !m_size.isEmpty(); }

    // The composited image the canvas paints. Cheap when nothing changed: the
    // cache lives in LayerEngine, we only watch its invalidation counter.
    const QImage &composite() const;
    quint64 compositeSerial() const { return m_compositeSerial; }
    void noteCompositeDirty();

    // Preview of the shape currently being dragged, painted in document space
    // by the canvas. Null when no shape gesture is active.
    const Shape &previewShape() const { return m_previewShape; }
    bool previewVisible() const { return m_previewActive; }
    QString snapHint() const { return m_snapHint; }
    QPointF snapHintPos() const { return m_snapHintPos; }

    // -----------------------------------------------------------------------
    // Document identity / lifecycle
    // -----------------------------------------------------------------------
    QString title() const { return m_title; }
    void setTitle(const QString &t);
    QString documentPath() const { return m_path; }
    bool modified() const { return m_modified; }
    qint64 revision() const { return m_revision; }

    Q_INVOKABLE QVariantMap newDocument(int width, int height,
                                        const QColor &background = QColor(255, 255, 255, 255));
    Q_INVOKABLE QVariantMap openDocument(const QString &filePath, bool asRecovery = false);
    Q_INVOKABLE QVariantMap saveDocument();
    Q_INVOKABLE QVariantMap saveDocumentAs(const QString &filePath);
    Q_INVOKABLE QVariantMap exportDocument(const QString &filePath,
                                           const QString &format, int quality = 92);
    Q_INVOKABLE QVariantMap exportFlattened(const QString &filePath,
                                            const QString &format, int quality = 92);
    Q_INVOKABLE QVariantMap documentInfo(const QString &filePath) const;
    Q_INVOKABLE void closeDocument();

    // -----------------------------------------------------------------------
    // Tools and view
    // -----------------------------------------------------------------------
    int tool() const { return m_tool; }
    void setTool(int t);
    int previousTool() const { return m_previousTool; }
    QString toolLabel() const { return toolName(m_tool); }
    bool toolUsesBrush() const;
    bool toolUsesShapeOptions() const;
    bool toolUsesSelection() const;

    double zoom() const { return m_zoom; }
    void setZoom(double z);
    double panX() const { return m_pan.x(); }
    void setPanX(double v);
    double panY() const { return m_pan.y(); }
    void setPanY(double v);
    bool handMode() const { return m_handMode; }
    void setHandMode(bool v);
    bool spacePanning() const { return m_spacePan; }
    bool viewFlippedH() const { return m_flipH; }
    bool viewFlippedV() const { return m_flipV; }
    double rotationDegrees() const { return m_rotation; }

    Q_INVOKABLE void zoomAt(const QPointF &itemPos, double factor);
    Q_INVOKABLE void zoomIn();
    Q_INVOKABLE void zoomOut();
    Q_INVOKABLE void zoomToFit(double viewportW, double viewportH);
    Q_INVOKABLE void zoomToActual();
    Q_INVOKABLE void panBy(const QPointF &delta);
    Q_INVOKABLE void resetView();
    Q_INVOKABLE void rotateView(double degrees);
    Q_INVOKABLE void flipViewH();
    Q_INVOKABLE void flipViewV();

    // -----------------------------------------------------------------------
    // Colour
    // -----------------------------------------------------------------------
    QColor foreground() const { return m_foreground; }
    void setForeground(const QColor &c);
    QColor background() const { return m_background; }
    void setBackground(const QColor &c);
    QVariantList recentColours() const { return m_recentColours; }
    Q_INVOKABLE void swapColours();
    Q_INVOKABLE void resetColours();
    Q_INVOKABLE void pushRecentColour(const QColor &c);
    Q_INVOKABLE QColor sampleCompositeAt(const QPointF &docPos) const;
    Q_INVOKABLE QColor sampleLayerAt(const QPointF &docPos) const;

    // -----------------------------------------------------------------------
    // Symmetry, grid, guides
    // -----------------------------------------------------------------------
    int symmetryMode() const { return m_symmetryMode; }
    void setSymmetryMode(int m);
    double symmetryAxisX() const { return m_symAxis.x(); }
    void setSymmetryAxisX(double v);
    double symmetryAxisY() const { return m_symAxis.y(); }
    void setSymmetryAxisY(double v);
    int symmetryBranches() const { return m_symBranches; }
    void setSymmetryBranches(int n);

    bool gridVisible() const { return m_gridVisible; }
    void setGridVisible(bool v);
    double gridSize() const { return m_gridSize; }
    void setGridSize(double v);
    bool gridSnap() const { return m_gridSnap; }
    void setGridSnap(bool v);
    bool guidesVisible() const { return m_guidesVisible; }
    void setGuidesVisible(bool v);
    QVariantList guidesV() const;
    QVariantList guidesH() const;
    Q_INVOKABLE void addGuide(double pos, bool vertical);
    Q_INVOKABLE void moveGuide(int index, bool vertical, double pos);
    Q_INVOKABLE void removeGuide(int index, bool vertical);
    Q_INVOKABLE void clearGuides();

    // -----------------------------------------------------------------------
    // Layers
    // -----------------------------------------------------------------------
    QVariantList layerList() const;
    int activeLayerIndex() const { return m_layers.currentIndex(); }
    void setActiveLayerIndex(int i);
    QString activeLayerName() const;
    qint64 layerMemory() const { return m_layers.totalMemory(); }

    Q_INVOKABLE quint32 addLayer(const QString &name = QString());
    Q_INVOKABLE quint32 addGroup(const QString &name = QString());
    Q_INVOKABLE quint32 duplicateActiveLayer();
    Q_INVOKABLE bool removeActiveLayer();
    Q_INVOKABLE bool moveActiveLayer(int delta);
    Q_INVOKABLE bool renameLayer(int index, const QString &name);
    Q_INVOKABLE bool setLayerOpacity(int index, double opacity);
    Q_INVOKABLE bool setLayerBlend(int index, int blendMode);
    Q_INVOKABLE bool setLayerVisible(int index, bool visible);
    Q_INVOKABLE bool setLayerLocked(int index, bool locked);
    Q_INVOKABLE bool setLayerAlphaLocked(int index, bool locked);
    Q_INVOKABLE bool setLayerClipTo(int index, int targetIndex);
    Q_INVOKABLE bool mergeLayerDown(int index);
    Q_INVOKABLE QImage renderLayerThumbnail(int index, int w, int h) const;
    Q_INVOKABLE void clearActiveLayer();
    Q_INVOKABLE void fillActiveLayer(const QColor &c);

    // -----------------------------------------------------------------------
    // Brush
    // -----------------------------------------------------------------------
    double brushSize() const { return m_brush.size(); }
    void setBrushSize(double v);
    double brushFlow() const { return m_brush.flow(); }
    void setBrushFlow(double v);
    double brushOpacity() const { return m_brush.opacity(); }
    void setBrushOpacity(double v);
    double brushHardness() const { return m_brush.hardness(); }
    void setBrushHardness(double v);
    double brushSpacing() const { return m_brush.spacing(); }
    void setBrushSpacing(double v);
    int nibMode() const { return m_brush.nibMode(); }
    void setNibMode(int v);
    QVariantList brushPresets() const { return m_brush.presetList(); }
    QString brushPresetName() const { return m_brush.currentPresetName(); }
    Q_INVOKABLE void selectBrushPreset(const QString &id);
    Q_INVOKABLE void saveBrushPreset(const QString &name, const QString &group);
    Q_INVOKABLE QImage brushPreview(int w, int h) const;

    // -----------------------------------------------------------------------
    // Shape and text
    // -----------------------------------------------------------------------
    int shapeKind() const { return m_shapes.currentShape(); }
    void setShapeKind(int k);
    bool shapeFilled() const { return m_shapes.filled(); }
    void setShapeFilled(bool v);
    double shapeStrokeWidth() const { return m_shapes.strokeWeight(); }
    void setShapeStrokeWidth(double v);
    int shapeSides() const { return m_shapes.sides(); }
    void setShapeSides(int v);
    bool snapEnabled() const { return m_shapes.snapEnabled(); }
    void setSnapEnabled(bool v);

    QString textPreview() const { return m_text.text(); }
    QString textFontFamily() const { return m_text.fontFamily(); }
    void setTextFontFamily(const QString &f);
    double textFontSize() const { return m_text.fontSize(); }
    void setTextFontSize(double v);
    QVariantList textItems() const;

    Q_INVOKABLE bool placeTextAt(const QPointF &docPos);
    Q_INVOKABLE bool updateTextItem(quint32 id, const QVariantMap &fields);
    Q_INVOKABLE bool removeTextItem(quint32 id);
    Q_INVOKABLE int hitTestText(const QPointF &docPos) const;
    Q_INVOKABLE QVariantList textItemsAt(const QPointF &docPos) const;

    // -----------------------------------------------------------------------
    // Selection
    // -----------------------------------------------------------------------
    bool selectionActive() const { return m_selection.active(); }
    QRectF selectionBounds() const { return m_selection.box(); }
    QString selectionKind() const { return m_selection.kind(); }
    double selectionFillRatio() const { return m_selection.fillRatio(); }
    int selectionMode() const { return int(m_selection.mode()); }
    void setSelectionMode(int m);

    Q_INVOKABLE void selectAll();
    Q_INVOKABLE void invertSelection();
    Q_INVOKABLE void clearSelection();
    Q_INVOKABLE void commitSelection();
    Q_INVOKABLE void growSelection();
    Q_INVOKABLE void shrinkSelection();
    Q_INVOKABLE void featherSelection(double radius);
    Q_INVOKABLE void copySelection();
    Q_INVOKABLE void cutSelection();
    Q_INVOKABLE void pasteClipboard();
    Q_INVOKABLE void deleteSelection();
    Q_INVOKABLE void fillSelection(const QColor &c);
    Q_INVOKABLE void strokeSelectionOutline(double width, const QColor &c);
    Q_INVOKABLE bool hasClipboard() const { return m_clipboard.valid(); }
    Q_INVOKABLE void transformSelection(double dx, double dy, double scale,
                                        double rotateDeg);
    Q_INVOKABLE void flipSelection(bool horizontal, bool vertical);

    // -----------------------------------------------------------------------
    // Pixel operations used by tools and the menu
    // -----------------------------------------------------------------------
    Q_INVOKABLE QVariantMap floodFillAt(const QPointF &docPos);
    Q_INVOKABLE QVariantMap eraseRect(const QRectF &docRect);
    Q_INVOKABLE QVariantMap applyFilter(const QString &filterId,
                                        const QVariantMap &params);
    QVariantList filterCatalogue() const;
    Q_INVOKABLE QVariantList filterGroups() const;
    Q_INVOKABLE QVariantMap filterInfo(const QString &id) const;
    Q_INVOKABLE QVariantMap applyTransform(const QVariantMap &options);

    // -----------------------------------------------------------------------
    // Clipboard (internal model + the system clipboard for interop)
    // -----------------------------------------------------------------------
    Q_INVOKABLE void copyActiveLayer();
    Q_INVOKABLE void pasteAsNewLayer();

    // -----------------------------------------------------------------------
    // Undo
    // -----------------------------------------------------------------------
    bool canUndo() const { return m_undo.canUndo(); }
    bool canRedo() const { return m_undo.canRedo(); }
    QString undoLabel() const { return m_undo.undoLabel(); }
    QString redoLabel() const { return m_undo.redoLabel(); }
    QVariantList history() const { return m_undo.entries(); }
    Q_INVOKABLE bool undo();
    Q_INVOKABLE bool redo();
    Q_INVOKABLE bool jumpHistory(int index);

    // -----------------------------------------------------------------------
    // Status / autosave / recovery / recent / shortcuts
    // -----------------------------------------------------------------------
    QString statusMessage() const { return m_status; }
    QString liveReadout() const { return m_liveReadout; }
    double livePressure() const { return m_input.livePressure(); }
    double liveTilt() const { return m_input.liveTiltAltitude(); }
    QString pointerName() const { return m_input.deviceName(); }
    bool autosaveEnabled() const { return m_store.autosaveEnabled(); }
    void setAutosaveEnabled(bool v);
    qint64 autosaveCountdown() const { return m_store.autosaveCountdown(); }
    bool recoveryAvailable() const { return m_store.recoveryAvailable(); }
    QVariantList recentDocuments() const { return m_store.recent(); }
    Q_INVOKABLE void tick();
    Q_INVOKABLE bool attemptRecovery();
    Q_INVOKABLE void discardRecovery();
    QStringList shortcutSheet() const;
    Q_INVOKABLE QString shortcutFor(const QString &action) const;

    // Marks the document dirty and bumps the revision. Every mutating helper
    // calls this exactly once, at the end.
    Q_INVOKABLE void notifyDocumentChanged();
    void setStatus(const QString &s);

signals:
    void documentSizeChanged();
    void titleChanged();
    void pathChanged();
    void modifiedChanged();
    void revisionChanged();
    void toolChanged();
    void viewChanged();
    void handModeChanged();
    void spacePanningChanged();
    void colourChanged();
    void symmetryChanged();
    void gridChanged();
    void layersChanged();
    void activeLayerChanged();
    void brushChanged();
    void shapeChanged();
    void textChanged();
    void textItemsChanged();
    void selectionChanged();
    void historyChanged();
    void statusMessageChanged();
    void liveChanged();
    void autosaveChanged();
    void recoveryChanged();
    void recentChanged();
    void compositeChanged();
    void snapHintChanged();
    void documentClosed();
    void documentsChanged();

private slots:
    // Connected to InputEngine.
    void onStrokeStarted();
    void onStrokeSample(const paint::StrokePoint &point);
    void onStrokeFinished();
    void onStrokeCancelled();
    void onBarrelPressed(bool pressed);
    void onEraserEnd(bool active);
    void onEyedropRequested(const QPointF &itemPos);
    void onPanRequested(const QPointF &delta);
    void onToolSwapRequested(int fromTool, int toTool);

private:
    // ---- document construction / plumbing ----------------------------------
    void installProviders();
    void wireEngines();
    void resetDocumentState();
    void adoptSize(const QSize &size);

    // ---- undo helpers -------------------------------------------------------
    // Captures the current base raster of a layer and records a step that will
    // restore it. The "after" image is captured once the caller has finished
    // mutating, by calling recordBaseEdit() again with the same key.
    QImage captureLayerBase(quint32 layerId) const;
    void recordBaseEdit(const QString &label, quint32 layerId, const QImage &before,
                        const QString &mergeKey = QString());
    void recordSelectionEdit(const QString &label, const QImage &beforeMask,
                             const QString &mergeKey = QString());
    void recordLayerListEdit(const QString &label,
                             const QVector<LayerSnapshot> &before,
                             const QString &mergeKey = QString());
    void recordTextEdit(const QString &label, const QVector<CanvasText> &before,
                        const QString &mergeKey = QString());

    // ---- drawing internals ---------------------------------------------------
    StrokeStyle styleForTool(int tool) const;
    void beginLiveStroke(const RawSample &sample);
    void extendLiveStrokeFrom(const StrokePoint &point);
    void finishLiveStroke();
    void cancelLiveStroke();
    QVector<QTransform> symmetryTransforms() const;

    // ---- shape gesture ---------------------------------------------------------
    void beginShapeGesture(const QPointF &docPos);
    void updateShapeGesture(const QPointF &docPos, bool shift, bool alt);
    void commitShapeGesture();
    void cancelShapeGesture();
    void rasteriseShape(const Shape &shape);

    // ---- selection gesture -------------------------------------------------------
    void beginSelectionGesture(const QPointF &docPos);
    void updateSelectionGesture(const QPointF &docPos, bool shift, bool alt);
    void commitSelectionGesture();

    // ---- move / transform gesture --------------------------------------------------
    void beginMoveGesture(const QPointF &docPos);
    void updateMoveGesture(const QPointF &docPos, const QPointF &prevDoc, bool constrain);
    void commitMoveGesture();

    // ---- eyedropper / pan ------------------------------------------------------------
    void beginPanGesture(const QPointF &itemPos);
    void updatePanGesture(const QPointF &itemPos);
    void endPanGesture();

    // ---- pixel painting -----------------------------------------------------------------
    QRectF paintIntoActiveLayer(const QImage &source, const QRectF &destRect,
                               int blendMode, double opacity, bool destinationOut);

    // ---- state -----------------------------------------------------------------------------
    QSize m_size;
    QString m_title = QStringLiteral("Untitled");
    QString m_path;
    bool m_modified = false;
    qint64 m_revision = 0;
    QString m_status;

    int m_tool = ToolPencil;
    int m_previousTool = ToolBrush;
    int m_altTool = ToolEraserStroke;

    double m_zoom = 1.0;
    QPointF m_pan = QPointF(0, 0);
    bool m_handMode = false;
    bool m_spacePan = false;
    bool m_flipH = false;
    bool m_flipV = false;
    double m_rotation = 0.0;

    QColor m_foreground = QColor(24, 26, 32, 255);
    QColor m_background = QColor(255, 255, 255, 255);
    QVariantList m_recentColours;
    QVariantList m_palette;

    int m_symmetryMode = SymmetryNone;
    QPointF m_symAxis = QPointF(0, 0);
    int m_symBranches = 6;

    bool m_gridVisible = false;
    double m_gridSize = 32.0;
    bool m_gridSnap = false;
    bool m_guidesVisible = true;
    QVector<double> m_guidesVertical;
    QVector<double> m_guidesHorizontal;

    QVariantList m_layerCache;

    // Cached composite. LayerEngine::composite() returns a fresh QImage by
    // value, and the canvas holds a reference across a paint() call, so the
    // engine must own a stable image and rebuild it only when the serial moves.
    mutable QImage m_compositeCache;
    mutable quint64 m_cacheSerial = 0;
    mutable bool m_cacheValid = false;

    // Live gesture state.
    enum Gesture { GestureNone, GestureStroke, GestureShape, GestureSelect,
                   GestureMove, GesturePan, GestureEyedrop };
    Gesture m_gesture = GestureNone;
    quint32 m_liveStrokeId = 0;
    quint32 m_liveLayerId = 0;
    QImage m_gestureBefore;
    QVector<LayerSnapshot> m_layerSnapshotBefore;
    QVector<CanvasText> m_textSnapshotBefore;
    QImage m_selectionBefore;
    Stroke m_liveStroke;
    QVector<Stroke> m_liveSymmetryStrokes;

    Shape m_previewShape;
    bool m_previewActive = false;
    QString m_snapHint;
    QPointF m_snapHintPos;

    QPointF m_gestureStart;
    QPointF m_lastDocPos;
    QPointF m_lastItemPos;
    bool m_dragging = false;
    int m_moveHandle = 0;
    QPointF m_moveAccum;
    bool m_pendingSelectionCommit = false;

    // Modifier keys tracked by the engine itself: key events arrive at the
    // canvas item, but pen events arrive without key state, so the engine keeps
    // its own mirror of the four modifiers and the canvas tells it when they
    // change. This mirrors the key state in PaintCanvasItem.
    bool m_shiftDown = false;
    bool m_altDown = false;
    bool m_ctrlDown = false;
    bool m_spaceDown = false;

    ClipboardBlob m_clipboard;

    QVector<CanvasText> m_texts;
    quint32 m_nextTextId = 1;
    quint32 m_nextShapeId = 1;

    quint64 m_compositeSerial = 0;

    QString m_liveReadout;
    QElapsedTimer m_sessionClock;
    qint64 m_lastTickMs = 0;
    qint64 m_lastEditMs = 0;

    // Sub-engines. Declaration order matters: LayerEngine and SelectionEngine
    // must exist before DocumentStore builds its payload, and UndoEngine must
    // outlive every closure that captures the engines above it.
    LayerEngine m_layers;
    SelectionEngine m_selection;
    UndoEngine m_undo;
    BrushEngine m_brush;
    ShapeEngine m_shapes;
    TextEngine m_text;
    InputEngine m_input;
    Filters m_filters;
    DocumentStore m_store;
    ImageIo m_io;

    PaintCanvasItem *m_canvas = nullptr;
};

} // namespace paint

#endif // PAINT_ENGINE_H
