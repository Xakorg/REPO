"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brush,
  Eraser,
  PenTool,
  Rectangle,
  Circle,
  Line,
  Type,
  Trash2,
  Download,
  Layers,
  Grid,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Lock,
  Users,
  X,
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitleComp } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  collection,
  query,
  orderBy,
  doc,
} from "firebase/firestore";

/* ------------------------------------------------------------------ */
// Types
/* ------------------------------------------------------------------ */

interface Stroke {
  id?: string;
  uid: string;
  x: number;
  y: number;
  color: string;
  size: number;
  tool: ToolType;
  type: "brush" | "eraser" | "rect" | "circle" | "line" | "text";
  shapeData?: ShapeData;
  text?: string;
  layer: string;
  timestamp: number;
}

interface ShapeData {
  shapeType: "rectangle" | "circle" | "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

type ToolType = "brush" | "eraser" | "rect" | "circle" | "line" | "text" | "shape";

interface CollabCanvasProps {
  channelId: string;
  serverName: string;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
// Constants
/* ------------------------------------------------------------------ */

const LAYERS = ["background", "drawing", "text"];
const GRID_SIZE = 20;
const PRESET_COLORS = [
  "#ffffff", "#ff4444", "#44ff44", "#4444ff",
  "#ffff44", "#ff44ff", "#44ffff", "#000000",
];

/* ------------------------------------------------------------------ */
// Main Component
/* ------------------------------------------------------------------ */

export function CollabCanvas({ channelId, serverName, onClose }: CollabCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  /* ---------- UI State ---------- */
  const [activeTool, setActiveTool] = useState<ToolType>("brush");
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const [activeLayer, setActiveLayer] = useState("drawing");
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [undoStack, setUndoStack] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    background: true,
    drawing: true,
    text: true,
  });
  const [showStrokeHistory, setShowStrokeHistory] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  /* ---------- Firestore Queries ---------- */
  const strokesQuery = useMemoFirebase(() => {
    if (!firestore || !channelId || !serverName) return null;
    const colRef = collection(
      firestore,
      "servers",
      serverName,
      "canvases",
      channelId,
      "strokes"
    );
    return query(colRef, orderBy("timestamp", "asc"));
  }, [firestore, channelId, serverName]);

  const { data: remoteStrokes = [], isLoading } = useCollection(strokesQuery);

  const cursorsQuery = useMemoFirebase(() => {
    if (!firestore || !channelId || !serverName) return null;
    const colRef = collection(
      firestore,
      "servers",
      serverName,
      "canvases",
      channelId,
      "cursors"
    );
    return query(colRef, orderBy("timestamp", "desc"));
  }, [firestore, channelId, serverName]);

  const { data: cursorData = [] } = useCollection(cursorsQuery);

  // Filter out own cursor
  const otherCursors = useMemo(() => {
    if (!user) return [];
    return cursorData.filter((c: any) => c.uid !== user.uid);
  }, [cursorData, user]);

  /* ---------- Local State & Sync ---------- */
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);

  // Sync Firestore strokes into local state
  useEffect(() => {
    if (!isLoading && remoteStrokes.length > 0) {
      const mapped: Stroke[] = remoteStrokes.map((s: any) => ({
        id: s.id,
        uid: s.uid,
        x: s.x,
        y: s.y,
        color: s.color,
        size: s.size,
        tool: s.tool,
        type: s.type,
        shapeData: s.shapeData,
        text: s.text,
        layer: s.layer,
        timestamp: s.timestamp,
      }));

      setLocalStrokes((prev) => {
        const remoteIds = new Set(mapped.map((s) => s.id));
        const localOnly = prev.filter((s) => !s.id || !remoteIds.has(s.id));
        return [...mapped, ...localOnly];
      });
    }
  }, [remoteStrokes, isLoading]);

  /* ---------- Canvas Rendering ---------- */
  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    if (container && canvasRef.current) {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = Math.max(rect.height - 44, 200);
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      renderCanvas();
    }
  }, [localStrokes, layerVisibility, showGrid]);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resizeCanvas]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Strokes by layer
    for (const layer of LAYERS) {
      if (!layerVisibility[layer]) continue;
      const layerStrokes = localStrokes.filter((s) => s.layer === layer);
      for (const stroke of layerStrokes) {
        drawStroke(ctx, stroke);
      }
    }

    // Preview shape while drawing
    if (isDrawing && startPos && currentPos && activeTool !== "brush" && activeTool !== "eraser") {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = brushSize;
      drawShapePreview(ctx, activeTool, startPos, currentPos);
      ctx.restore();
    }
  }, [localStrokes, layerVisibility, showGrid, activeTool, color, brushSize, isDrawing, startPos, currentPos]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  /* ---------- Drawing Helpers ---------- */
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (stroke.type) {
      case "brush":
      case "eraser": {
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, Math.max(stroke.size / 2, 0.5), 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "rect":
      case "circle":
      case "line": {
        if (stroke.shapeData) {
          drawShapeOnCtx(ctx, stroke.type, stroke.shapeData);
        }
        break;
      }
      case "text": {
        ctx.font = `${Math.max(stroke.size * 4, 8)}px sans-serif`;
        ctx.fillText(stroke.text || "", stroke.x, stroke.y);
        break;
      }
    }
    ctx.restore();
  };

  const drawShapeOnCtx = (
    ctx: CanvasRenderingContext2D,
    type: string,
    shapeData: ShapeData
  ) => {
    ctx.beginPath();
    switch (type) {
      case "rect":
        ctx.rect(
          shapeData.startX,
          shapeData.startY,
          shapeData.endX - shapeData.startX,
          shapeData.endY - shapeData.startY
        );
        ctx.stroke();
        break;
      case "circle": {
        const rx = shapeData.endX - shapeData.startX;
        const ry = shapeData.endY - shapeData.startY;
        ctx.ellipse(shapeData.startX, shapeData.startY, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "line":
        ctx.moveTo(shapeData.startX, shapeData.startY);
        ctx.lineTo(shapeData.endX, shapeData.endY);
        ctx.stroke();
        break;
    }
  };

  const drawShapePreview = (
    ctx: CanvasRenderingContext2D,
    tool: ToolType,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    ctx.beginPath();
    const type = tool === "shape" ? "rect" : tool;
    switch (type) {
      case "rect":
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        ctx.stroke();
        break;
      case "circle": {
        const rx = end.x - start.x;
        const ry = end.y - start.y;
        ctx.ellipse(start.x, start.y, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "line":
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let x: number;
    let y: number;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }
    return { x, y };
  };

  /* ---------- Firestore Operations ---------- */
  const saveStrokeToFirestore = useCallback(
    (stroke: Stroke) => {
      if (!firestore || !channelId || !serverName || !user) return;
      const strokesRef = collection(
        firestore,
        "servers",
        serverName,
        "canvases",
        channelId,
        "strokes"
      );
      addDocumentNonBlocking(strokesRef, {
        uid: stroke.uid,
        x: stroke.x,
        y: stroke.y,
        color: stroke.color,
        size: stroke.size,
        tool: stroke.tool,
        type: stroke.type,
        shapeData: stroke.shapeData,
        text: stroke.text,
        layer: stroke.layer,
        timestamp: stroke.timestamp,
      });
    },
    [firestore, channelId, serverName, user]
  );

  const addStrokeLocal = useCallback(
    (stroke: Stroke) => {
      setLocalStrokes((prev) => [...prev, stroke]);
      saveStrokeToFirestore(stroke);
    },
    [saveStrokeToFirestore]
  );

  /* ---------- Pointer Events ---------- */
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDrawing(true);

    if (activeTool === "brush" || activeTool === "eraser") {
      const stroke: Stroke = {
        uid: user?.uid || "unknown",
        x: pos.x,
        y: pos.y,
        color: activeTool === "eraser" ? "#000000" : color,
        size: brushSize,
        tool: activeTool,
        type: activeTool === "eraser" ? "eraser" : "brush",
        layer: activeLayer,
        timestamp: Date.now(),
      };
      addStrokeLocal(stroke);
      setUndoStack((prev) => [...prev, stroke]);
      setRedoStack([]);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setCurrentPos(pos);
    renderCanvas();

    // For brush/eraser, draw continuously
    if ((activeTool === "brush" || activeTool === "eraser") && isDrawing && startPos) {
      const stroke: Stroke = {
        uid: user?.uid || "unknown",
        x: pos.x,
        y: pos.y,
        color: activeTool === "eraser" ? "#000000" : color,
        size: brushSize,
        tool: activeTool,
        type: activeTool === "eraser" ? "eraser" : "brush",
        layer: activeLayer,
        timestamp: Date.now(),
      };
      addStrokeLocal(stroke);
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (startPos && currentPos && (activeTool === "rect" || activeTool === "circle" || activeTool === "line" || activeTool === "shape")) {
      const shapeType = activeTool === "shape" ? "rect" : activeTool;
      const stroke: Stroke = {
        uid: user?.uid || "unknown",
        x: startPos.x,
        y: startPos.y,
        color,
        size: brushSize,
        tool: activeTool,
        type: shapeType,
        shapeData: {
          shapeType,
          startX: startPos.x,
          startY: startPos.y,
          endX: currentPos.x,
          endY: currentPos.y,
        },
        layer: activeLayer,
        timestamp: Date.now(),
      };
      addStrokeLocal(stroke);
      setUndoStack((prev) => [...prev, stroke]);
      setRedoStack([]);
    }

    if (activeTool === "text" && startPos) {
      setShowTextDialog(true);
    }

    setStartPos(null);
    setCurrentPos(null);
    renderCanvas();
  };

  /* ---------- Undo / Redo ---------- */
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastStroke = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastStroke]);
    setLocalStrokes((prev) => prev.filter((s) => s !== lastStroke && s.id !== lastStroke.id));
    toast({ title: "Undo", description: "Last action undone" });
  }, [undoStack, toast]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const stroke = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, stroke]);
    setLocalStrokes((prev) => [...prev, stroke]);
    toast({ title: "Redo", description: "Action redone" });
  }, [redoStack, toast]);

  /* ---------- Clear Canvas ---------- */
  const handleClear = useCallback(() => {
    if (!isAdmin) return;
    setLocalStrokes([]);
    setUndoStack([]);
    setRedoStack([]);
    toast({ title: "Canvas Cleared", description: "All strokes have been removed" });
  }, [isAdmin]);

  /* ---------- Export PNG ---------- */
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `collab-canvas-${channelId}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    setShowExportDialog(false);
    toast({ title: "Exported", description: "Canvas downloaded as PNG" });
  }, [channelId, toast]);

  /* ---------- Layer Visibility Toggle ---------- */
  const toggleLayer = (layer: string) => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  /* ---------- Cursor Position Sync ---------- */
  useEffect(() => {
    if (!user || !firestore || !channelId || !serverName) return;
    const interval = setInterval(() => {
      const cursorRef = doc(
        firestore,
        "servers",
        serverName,
        "canvases",
        channelId,
        "cursors",
        user.uid
      );
      updateDocumentNonBlocking(cursorRef, {
        uid: user.uid,
        displayName: user.displayName || "User",
        photoURL: user.photoURL,
        x: currentPos?.x || 0,
        y: currentPos?.y || 0,
        color,
        timestamp: Date.now(),
      });
    }, 500);
    return () => clearInterval(interval);
  }, [user, firestore, channelId, serverName, currentPos, color]);

  /* ---------- Render ---------- */
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex flex-col bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-white/10 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-white/60" />
          <span className="text-sm font-medium text-white/80">{channelId}</span>
          <Badge variant="secondary" className="bg-white/10 text-white/70 text-xs">
            {otherCursors.length} online
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <ActionButton onClick={handleUndo} disabled={undoStack.length === 0} title="Undo">
            <Undo2 className="w-4 h-4" />
          </ActionButton>
          <ActionButton onClick={handleRedo} disabled={redoStack.length === 0} title="Redo">
            <Redo2 className="w-4 h-4" />
          </ActionButton>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ActionButton onClick={() => setShowGrid(!showGrid)} active={showGrid} title="Grid">
            <Grid className="w-4 h-4" />
          </ActionButton>
          <ActionButton onClick={() => setSnapToGrid(!snapToGrid)} active={snapToGrid} title="Snap to Grid">
            <Grid className="w-4 h-4" />
          </ActionButton>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ActionButton onClick={() => setShowLayers(!showLayers)} active={showLayers} title="Layers">
            <Layers className="w-4 h-4" />
          </ActionButton>
          <ActionButton onClick={() => setShowStrokeHistory(!showStrokeHistory)} active={showStrokeHistory} title="Stroke History">
            <Eye className="w-4 h-4" />
          </ActionButton>
          <div className="w-px h-5 bg-white/10 mx-1" />
          {isAdmin && (
            <ActionButton onClick={handleClear} variant="destructive" title="Clear Canvas">
              <Trash2 className="w-4 h-4" />
            </ActionButton>
          )}
          <ActionButton onClick={() => setShowExportDialog(true)} title="Export PNG">
            <Download className="w-4 h-4" />
          </ActionButton>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ActionButton onClick={onClose} title="Close">
            <X className="w-4 h-4" />
          </ActionButton>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Tool Palette */}
        <div className="flex flex-col items-center py-2 gap-1 bg-zinc-900/40 border-r border-white/5 overflow-y-auto flex-shrink-0 w-[52px]">
          <ToolBtn
            icon={<Brush className="w-4 h-4" />}
            active={activeTool === "brush"}
            onClick={() => setActiveTool("brush")}
            title="Brush (B)"
          />
          <ToolBtn
            icon={<Eraser className="w-4 h-4" />}
            active={activeTool === "eraser"}
            onClick={() => setActiveTool("eraser")}
            title="Eraser (E)"
          />
          <ToolBtn
            icon={<PenTool className="w-4 h-4" />}
            active={activeTool === "shape"}
            onClick={() => setActiveTool("shape")}
            title="Shapes"
          />
          <div className="w-8 h-px bg-white/10 my-1" />
          <ToolBtn
            icon={<Rectangle className="w-4 h-4" />}
            active={activeTool === "rect"}
            onClick={() => setActiveTool("rect")}
            title="Rectangle"
          />
          <ToolBtn
            icon={<Circle className="w-4 h-4" />}
            active={activeTool === "circle"}
            onClick={() => setActiveTool("circle")}
            title="Circle"
          />
          <ToolBtn
            icon={<Line className="w-4 h-4" />}
            active={activeTool === "line"}
            onClick={() => setActiveTool("line")}
            title="Line"
          />
          <div className="w-8 h-px bg-white/10 my-1" />
          <ToolBtn
            icon={<Type className="w-4 h-4" />}
            active={activeTool === "text"}
            onClick={() => setActiveTool("text")}
            title="Text"
          />
          <div className="flex-1" />
          <ToolBtn
            icon={<Lock className="w-4 h-4" />}
            active={isAdmin}
            onClick={() => setIsAdmin(!isAdmin)}
            title="Admin Mode"
          />
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="w-full h-full touch-none cursor-crosshair"
          />

          {/* Other Users' Cursors */}
          <AnimatePresence mode="popLayout">
            {otherCursors.map((cursor: any) => (
              <motion.div
                key={cursor.uid}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute pointer-events-none z-10"
                style={{
                  left: cursor.x || 0,
                  top: cursor.y || 0,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: cursor.color || "#ff6666" }}
                />
                <div
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap shadow-lg"
                  style={{ backgroundColor: cursor.color || "#ff6666", color: "#000" }}
                >
                  {cursor.displayName || "User"}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Current User Cursor Indicator */}
          {currentPos && (activeTool === "brush" || activeTool === "eraser") && (
            <div
              className="absolute pointer-events-none z-10 opacity-50"
              style={{
                left: currentPos.x,
                top: currentPos.y,
                width: Math.max(brushSize, 2),
                height: Math.max(brushSize, 2),
                borderRadius: "50%",
                backgroundColor: color,
                transform: "translate(-50%, -50%)",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
            />
          )}
        </div>

        {/* Right Side Panel */}
        <AnimatePresence>
          {showLayers && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 180, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col bg-zinc-900/40 border-l border-white/5 overflow-y-auto flex-shrink-0"
            >
              {/* Layer Controls */}
              <div className="p-2 border-b border-white/5">
                <h3 className="text-[10px] font-semibold text-white/50 mb-2 flex items-center gap-1 uppercase tracking-wider">
                  <Layers className="w-3 h-3" /> Layers
                </h3>
                {LAYERS.map((layer) => (
                  <button
                    key={layer}
                    onClick={() => toggleLayer(layer)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] mb-0.5 transition-colors",
                      layerVisibility[layer]
                        ? "bg-white/10 text-white"
                        : "text-white/30"
                    )}
                  >
                    <span className="capitalize">{layer}</span>
                    {layerVisibility[layer] ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>

              {/* Active Layer */}
              <div className="p-2 border-b border-white/5">
                <div className="text-[9px] text-white/30 mb-1 uppercase tracking-wider">Active Layer</div>
                <Badge variant="outline" className="text-white/50 border-white/10 text-[10px]">
                  {activeLayer}
                </Badge>
              </div>

              {/* User Avatars */}
              <div className="p-2 border-b border-white/5">
                <div className="text-[9px] text-white/30 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3" /> Users
                </div>
                <div className="flex -space-x-2">
                  {user && (
                    <Avatar className="w-6 h-6 border-2 border-zinc-900">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="text-[8px] bg-zinc-700 text-white">
                        {(user.displayName || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {otherCursors.slice(0, 4).map((c: any) => (
                    <Avatar key={c.uid} className="w-6 h-6 border-2 border-zinc-900">
                      <AvatarImage src={c.photoURL || undefined} />
                      <AvatarFallback className="text-[8px] bg-zinc-700 text-white">
                        {(c.displayName || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>

              {/* Stroke History */}
              {showStrokeHistory && (
                <div className="p-2 flex-1 overflow-y-auto">
                  <h3 className="text-[10px] font-semibold text-white/50 mb-2 flex items-center gap-1 uppercase tracking-wider">
                    <Eye className="w-3 h-3" /> Recent Strokes
                  </h3>
                  <div className="space-y-1">
                    {localStrokes.slice(-30).reverse().map((stroke, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.03] text-[10px] text-white/40"
                      >
                        <div
                          className="w-3 h-3 rounded-full border border-white/10 flex-shrink-0"
                          style={{ backgroundColor: stroke.color }}
                        />
                        <span className="capitalize">{stroke.type}</span>
                        <span className="text-white/20 ml-auto">
                          {new Date(stroke.timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                  {localStrokes.length === 0 && (
                    <div className="text-[10px] text-white/20 text-center py-4">No strokes yet</div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-t border-white/10 backdrop-blur-sm flex-shrink-0 gap-4"
      >
        <div className="flex items-center gap-3">
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/20"
            />
            <div className="flex gap-0.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-4 h-4 rounded-full border transition-transform hover:scale-125",
                    color === c ? "border-white scale-110" : "border-white/20"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Brush Size Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/30 uppercase">Size</span>
            <input
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20 h-1 accent-white/30"
            />
            <span className="text-[10px] text-white/50 w-5 text-right">{brushSize}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/30 uppercase">Tool:</span>
            <Badge variant="secondary" className="bg-white/10 text-white/60 text-[10px] capitalize">
              {activeTool}
            </Badge>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-[10px] text-white/30">{localStrokes.length} strokes</span>
          {snapToGrid && (
            <Badge variant="outline" className="text-green-400 border-green-400/30 text-[9px]">
              Grid ON
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Text Input Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent className="bg-zinc-950 border border-white/10">
          <DialogHeader>
            <DialogTitleComp className="text-white">Add Text to Canvas</DialogTitleComp>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Type your text..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="bg-zinc-900 border border-white/10 text-white placeholder:text-white/30"
              onKeyDown={(e) => {
                if (e.key === "Enter" && textInput.trim()) {
                  const stroke: Stroke = {
                    uid: user?.uid || "unknown",
                    x: startPos?.x || 0,
                    y: startPos?.y || 0,
                    color,
                    size: brushSize,
                    tool: "text",
                    type: "text",
                    text: textInput,
                    layer: activeLayer,
                    timestamp: Date.now(),
                  };
                  addStrokeLocal(stroke);
                  setUndoStack((prev) => [...prev, stroke]);
                  setRedoStack([]);
                  setTextInput("");
                  setShowTextDialog(false);
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!textInput.trim() || !startPos) return;
                  const stroke: Stroke = {
                    uid: user?.uid || "unknown",
                    x: startPos.x,
                    y: startPos.y,
                    color,
                    size: brushSize,
                    tool: "text",
                    type: "text",
                    text: textInput,
                    layer: activeLayer,
                    timestamp: Date.now(),
                  };
                  addStrokeLocal(stroke);
                  setUndoStack((prev) => [...prev, stroke]);
                  setRedoStack([]);
                  setTextInput("");
                  setShowTextDialog(false);
                }}
                className="bg-primary text-black flex-1"
              >
                Add Text
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTextInput("");
                  setShowTextDialog(false);
                }}
                className="border-white/10 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-zinc-950 border border-white/10">
          <DialogHeader>
            <DialogTitleComp className="text-white">Export Canvas</DialogTitleComp>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-white/60">Download the current canvas as a PNG image.</p>
            <Button onClick={handleExport} className="bg-primary text-black w-full">
              <Download className="w-4 h-4 mr-2" /> Export as PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
// Sub-components
/* ------------------------------------------------------------------ */

interface ToolBtnProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}

function ToolBtn({ icon, active, onClick, title }: ToolBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10",
        active ? "bg-white/20 text-white shadow-inner" : "text-white/40"
      )}
    >
      {icon}
    </button>
  );
}

interface ActionBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  active?: boolean;
  variant?: string;
}

function ActionButton({ children, onClick, title, disabled, active, variant }: ActionBtnProps) {
  return (
    <Button
      variant={(variant as any) || "ghost"}
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "bg-transparent text-white/60 hover:bg-white/10 hover:text-white",
        active && "text-white bg-white/20",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </Button>
  );
}
