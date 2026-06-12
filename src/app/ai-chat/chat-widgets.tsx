"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Download, 
  RefreshCw, 
  Plus, 
  Trash, 
  Eye, 
  Code, 
  FileCode, 
  FolderArchive, 
  CheckCircle2, 
  ChevronRight, 
  Sliders,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import JSZip from "jszip";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, onSnapshot, doc } from "firebase/firestore";

// ==========================================
// 1. Sandboxed Iframe Preview (App Runner)
// ==========================================
export function IframeSandbox({ code }: { code: string }) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [iframeKey, setIframeKey] = useState(0);

  const cleanCode = code.trim();
  const iframeSrc = `data:text/html;charset=utf-8,${encodeURIComponent(cleanCode)}`;

  const handleDownload = () => {
    const blob = new Blob([cleanCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-2xl my-6">
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTab("preview")}
            className={`text-xs uppercase font-black tracking-widest h-8 px-3 rounded-lg ${activeTab === "preview" ? "bg-primary/20 text-primary" : "text-white/60 hover:text-white"}`}
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> Preview
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTab("code")}
            className={`text-xs uppercase font-black tracking-widest h-8 px-3 rounded-lg ${activeTab === "code" ? "bg-primary/20 text-primary" : "text-white/60 hover:text-white"}`}
          >
            <Code className="w-3.5 h-3.5 mr-1" /> Source Code
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "preview" && (
            <Button variant="ghost" size="icon" onClick={() => setIframeKey(k => k + 1)} className="h-8 w-8 hover:bg-white/5 rounded-lg text-white/60 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDownload} className="text-xs uppercase font-black tracking-widest h-8 px-3 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
            <Download className="w-3.5 h-3.5 mr-1" /> Download
          </Button>
        </div>
      </div>
      <div className="relative">
        {activeTab === "preview" ? (
          <iframe 
            key={iframeKey}
            srcDoc={cleanCode}
            sandbox="allow-scripts"
            className="w-full h-[450px] bg-white border-none"
            title="App Preview Sandbox"
          />
        ) : (
          <div className="p-6 overflow-x-auto max-h-[450px]">
            <pre className="font-mono text-xs text-sky-400 leading-relaxed whitespace-pre select-all">
              {cleanCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. Procedural Video Player (Canvas + MediaRecorder)
// ==========================================
export interface VideoConfig {
  title: string;
  style: "stars" | "matrix" | "tunnel" | "waves" | "particles" | "fractal";
  primaryColor: string;
  secondaryColor: string;
  speed: number;
  caption: string;
}

export function ProceduralVideoPlayer({ config }: { config: VideoConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Simulation states
    const particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    const stars: { x: number; y: number; z: number }[] = [];

    // Init particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1
      });
    }

    // Init stars
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * canvas.width
      });
    }

    const render = () => {
      if (!isPlaying) return;

      const style = configRef.current.style;
      const speed = configRef.current.speed || 1;
      const primary = configRef.current.primaryColor || "#3b82f6";
      const secondary = configRef.current.secondaryColor || "#8b5cf6";
      const caption = configRef.current.caption || "";

      time += 0.02 * speed;

      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (style === "stars") {
        ctx.fillStyle = primary;
        stars.forEach(star => {
          star.z -= 2 * speed;
          if (star.z <= 0) {
            star.z = canvas.width;
            star.x = Math.random() * canvas.width - canvas.width / 2;
            star.y = Math.random() * canvas.height - canvas.height / 2;
          }
          const px = (star.x / star.z) * canvas.width + canvas.width / 2;
          const py = (star.y / star.z) * canvas.height + canvas.height / 2;
          const size = (1 - star.z / canvas.width) * 4;
          ctx.beginPath();
          ctx.arc(px, py, size > 0 ? size : 0.1, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (style === "matrix") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = primary;
        ctx.font = "12px monospace";
        for (let i = 0; i < canvas.width; i += 15) {
          const y = (Math.sin(time + i) * 0.5 + 0.5) * canvas.height;
          ctx.fillText(Math.random() > 0.5 ? "1" : "0", i, y);
        }
      } else if (style === "tunnel") {
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        const count = 10;
        for (let i = 0; i < count; i++) {
          const r = ((i * 30 + time * 40) % (canvas.width / 2));
          ctx.strokeStyle = i % 2 === 0 ? primary : secondary;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, r > 0 ? r : 0.1, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (style === "waves") {
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = i === 0 ? primary : i === 1 ? secondary : "#ffffff";
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 5) {
            const y = canvas.height / 2 + Math.sin(x * 0.01 + time + i) * 40;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (style === "particles") {
        particles.forEach((p, idx) => {
          p.x += p.vx * speed;
          p.y += p.vy * speed;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

          ctx.fillStyle = primary;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          for (let j = idx + 1; j < particles.length; j++) {
            const other = particles[j];
            const dx = p.x - other.x;
            const dy = p.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${1 - dist / 80})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          }
        });
      } else if (style === "fractal") {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(time * 0.2);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.strokeStyle = i % 2 === 0 ? primary : secondary;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(100 * Math.sin(time), 100 * Math.cos(time));
          ctx.stroke();
        }
        ctx.restore();
      }

      // Title & Caption Overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(caption, canvas.width / 2, canvas.height - 20);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  const handleRecord = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    setIsRecording(true);
    setRecordProgress(0);

    const stream = (canvas as any).captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.title.toLowerCase().replace(/\s+/g, "_") || "procedural"}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };

    // Update progress bar
    const duration = 5000; // 5 seconds recording
    const intervalTime = 100;
    let elapsed = 0;
    const progressInterval = setInterval(() => {
      elapsed += intervalTime;
      setRecordProgress(Math.min((elapsed / duration) * 100, 100));
    }, intervalTime);

    mediaRecorder.start();

    setTimeout(() => {
      clearInterval(progressInterval);
      mediaRecorder.stop();
    }, duration);
  };

  return (
    <div className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-2xl my-6 mx-auto">
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">AI Generated Video</span>
        <span className="text-xs font-bold text-white/40 truncate max-w-[200px]">{config.title}</span>
      </div>
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <canvas ref={canvasRef} width={640} height={360} className="w-full h-full" />
        
        {isRecording && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-sm font-black uppercase tracking-wider text-white">Rendering & Exporting Video...</p>
            <div className="w-48 bg-white/15 h-2 rounded-full overflow-hidden mt-3">
              <div className="bg-primary h-full transition-all duration-100" style={{ width: `${recordProgress}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-6 py-3 bg-white/5">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-xs uppercase font-black tracking-widest text-white/60 hover:text-white"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRecord}
          disabled={isRecording}
          className="text-xs uppercase font-black tracking-widest text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 mr-1" /> Export WEBM/MP4
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// 3. Interactive Three.js 3D Viewer
// ==========================================
export interface ThreeConfig {
  type: "box" | "sphere" | "torus" | "knot" | "plane";
  color: string;
  wireframe: boolean;
  autoRotate: boolean;
}

export function ThreeViewer({ config }: { config: ThreeConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(config.wireframe || false);
  const [autoRotate, setAutoRotate] = useState<boolean>(config.autoRotate ?? true);

  useEffect(() => {
    let cleanup = () => {};
    if (typeof window === "undefined" || !containerRef.current) return;

    // Load ThreeJS dynamically to prevent SSR error
    import("three").then((THREE) => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = 300;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 8;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, 5, 5);
      scene.add(dirLight);

      // Geometry selection
      let geometry: any;
      switch (config.type) {
        case "sphere":
          geometry = new THREE.SphereGeometry(1.8, 32, 32);
          break;
        case "torus":
          geometry = new THREE.TorusGeometry(1.2, 0.4, 16, 100);
          break;
        case "knot":
          geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
          break;
        case "plane":
          geometry = new THREE.PlaneGeometry(2.5, 2.5);
          break;
        case "box":
        default:
          geometry = new THREE.BoxGeometry(2, 2, 2);
      }

      const material = new THREE.MeshStandardMaterial({
        color: config.color || "#3b82f6",
        wireframe: wireframe,
        roughness: 0.2,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Handle interactive drag rotators
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        mesh.rotation.y += deltaX * 0.01;
        mesh.rotation.x += deltaY * 0.01;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      const domElement = renderer.domElement;
      domElement.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        if (autoRotate && !isDragging) {
          mesh.rotation.x += 0.005;
          mesh.rotation.y += 0.01;
        }

        material.wireframe = wireframe;

        renderer.render(scene, camera);
      };

      animate();

      cleanup = () => {
        cancelAnimationFrame(animationId);
        domElement.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        renderer.dispose();
        if (container.contains(domElement)) {
          container.removeChild(domElement);
        }
      };
    });

    return () => {
      cleanup();
    };
  }, [config, wireframe, autoRotate]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-2xl my-6">
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">AI 3D Scene Viewer</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={wireframe} 
              onChange={() => setWireframe(!wireframe)}
              className="accent-primary rounded bg-zinc-900 border-white/10"
            />
            Wireframe
          </label>
          <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoRotate} 
              onChange={() => setAutoRotate(!autoRotate)}
              className="accent-primary rounded bg-zinc-900 border-white/10"
            />
            Auto-Rotate
          </label>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[300px] bg-zinc-950 cursor-grab active:cursor-grabbing" />
    </div>
  );
}

// ==========================================
// 4. Multi-File Explorer & JSZip Exporter
// ==========================================
export interface FileItem {
  name: string;
  content: string;
}

export function MultiFileExplorer({ files }: { files: FileItem[] }) {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [zipSuccess, setZipSuccess] = useState(false);

  const activeFile = files[selectedFileIdx] || files[0];

  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      files.forEach((f) => {
        zip.file(f.name, f.content);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "xak_project_source.zip";
      a.click();
      URL.revokeObjectURL(url);
      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 2000);
    } catch (e) {
      console.error("ZIP Generation error", e);
    }
  };

  if (!files || files.length === 0) return null;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-2xl my-6 flex flex-col md:flex-row min-h-[350px]">
      <div className="w-full md:w-56 border-r border-white/10 bg-black/20 flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Project Files</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleExportZip}
            className="h-8 px-2 text-[10px] uppercase font-black text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1"
          >
            {zipSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <FolderArchive className="w-3.5 h-3.5" />}
            {zipSuccess ? "Done" : "ZIP"}
          </Button>
        </div>
        <div className="p-2 space-y-1 flex-1 overflow-y-auto">
          {files.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedFileIdx(idx)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs transition-all ${selectedFileIdx === idx ? "bg-primary/20 text-white font-bold" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="truncate block">{file.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-zinc-950">
        <div className="px-6 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between text-xs text-white/40">
          <span className="font-mono text-[10px]">{activeFile?.name}</span>
          <span>{activeFile?.content.length} characters</span>
        </div>
        <div className="flex-1 p-6 overflow-auto max-h-[380px] custom-scrollbar">
          <pre className="font-mono text-xs text-sky-400 leading-relaxed whitespace-pre select-all">
            {activeFile?.content || ""}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. RPG Adventure Console
// ==========================================
export interface RpgConfig {
  title: string;
  description: string;
  choices: string[];
}

export function RpgConsole({ config, onSelectChoice }: { config: RpgConfig; onSelectChoice: (choice: string) => void }) {
  return (
    <div className="w-full max-w-lg rounded-2xl overflow-hidden border-2 border-indigo-500/30 bg-zinc-950/90 shadow-2xl my-6 mx-auto">
      <div className="px-6 py-3 bg-indigo-950/40 border-b border-indigo-500/20 text-center relative overflow-hidden">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Adventure RPG Engine</span>
        <h4 className="text-sm font-black uppercase tracking-wider text-white mt-1 italic">{config.title}</h4>
      </div>
      <div className="p-8 space-y-6">
        <p className="text-sm italic text-white/90 leading-relaxed text-center">
          "{config.description}"
        </p>
        
        <div className="grid grid-cols-1 gap-2">
          {config.choices.map((choice, idx) => (
            <Button
              key={idx}
              onClick={() => onSelectChoice(choice)}
              variant="outline"
              className="w-full h-11 justify-start px-5 text-xs font-black uppercase tracking-wider text-indigo-200 border-indigo-500/20 hover:border-indigo-500/60 hover:bg-indigo-500/10 rounded-xl transition-all flex items-center justify-between group"
            >
              <span>{choice}</span>
              <ChevronRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. Interactive Editable Spreadsheet Grid
// ==========================================
interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export function InteractiveSpreadsheet({ initialTable }: { initialTable: ParsedTable }) {
  const [table, setTable] = useState<ParsedTable>(initialTable);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [tempVal, setTempVal] = useState("");

  const handleCellClick = (r: number, c: number, currentVal: string) => {
    setEditingCell({ row: r, col: c });
    setTempVal(currentVal);
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    const newRows = [...table.rows];
    newRows[editingCell.row] = [...newRows[editingCell.row]];
    newRows[editingCell.row][editingCell.col] = tempVal;
    setTable({ ...table, rows: newRows });
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const emptyRow = Array(table.headers.length).fill("");
    setTable({ ...table, rows: [...table.rows, emptyRow] });
  };

  const handleAddColumn = () => {
    const colName = `Col ${table.headers.length + 1}`;
    const newHeaders = [...table.headers, colName];
    const newRows = table.rows.map(row => [...row, ""]);
    setTable({ headers: newHeaders, rows: newRows });
  };

  const handleDownloadCsv = () => {
    const csvContent = [
      table.headers.join(","),
      ...table.rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spreadsheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-2xl my-6">
      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Interactive Grid Editor</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleAddRow} className="h-8 text-[10px] uppercase font-black text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1 rounded-lg">
            <Plus className="w-3 h-3" /> Add Row
          </Button>
          <Button variant="ghost" size="sm" onClick={handleAddColumn} className="h-8 text-[10px] uppercase font-black text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1 rounded-lg">
            <Plus className="w-3 h-3" /> Add Col
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadCsv} className="h-8 text-[10px] uppercase font-black text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1 rounded-lg">
            <Download className="w-3 h-3" /> Export CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {table.headers.map((header, colIdx) => (
                <th key={colIdx} className="p-4 font-black uppercase tracking-wider text-white/60 border-r border-white/5 last:border-none">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-white/5 last:border-none hover:bg-white/5 transition-colors">
                {row.map((cell, colIdx) => {
                  const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                  return (
                    <td 
                      key={colIdx} 
                      onClick={() => !isEditing && handleCellClick(rowIdx, colIdx, cell)}
                      className="p-4 border-r border-white/5 last:border-none cursor-pointer relative min-h-[48px]"
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={tempVal}
                          onChange={(e) => setTempVal(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => e.key === "Enter" && handleCellSave()}
                          className="absolute inset-1 bg-black border border-primary text-white rounded px-2 outline-none w-[calc(100%-8px)] h-[calc(100%-8px)]"
                        />
                      ) : (
                        <span className="block truncate max-w-[200px] min-h-[16px]">{cell || "—"}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 7. IPC File Operation Runner
// ==========================================
export interface IpcFileOpConfig {
  action: "read" | "write" | "delete";
  filePath: string;
  content?: string;
}

export function IpcFileOpRunner({ config }: { config: IpcFileOpConfig }) {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const handleRun = async () => {
    if (typeof window === "undefined") return;
    
    setStatus("running");

    if ((window as any).electron) {
      try {
        let res;
        if (config.action === "read") {
          res = await (window as any).electron.fs.readFile(config.filePath);
        } else if (config.action === "write") {
          res = await (window as any).electron.fs.writeFile(config.filePath, config.content || "");
        } else if (config.action === "delete") {
          res = await (window as any).electron.fs.deleteFile(config.filePath);
        }
        
        if (res && res.success) {
          setStatus("success");
          setResult(res.data ? `Read ${res.data.length} bytes.` : "Operation successful.");
        } else {
          setStatus("error");
          setResult(res?.error || "Unknown IPC error.");
        }
      } catch (err: any) {
        setStatus("error");
        setResult(err.message);
      }
    } else {
      // Route through Firestore Desktop Bridge
      if (!user || !firestore) {
        setStatus("error");
        setResult("Sign in to route this command to your Desktop app.");
        return;
      }
      try {
        const docRef = await addDoc(collection(firestore, "users", user.uid, "desktop_commands"), {
          type: "file",
          action: config.action,
          filePath: config.filePath,
          content: config.content || null,
          status: "pending",
          createdAt: new Date().toISOString()
        });

        const unsub = onSnapshot(doc(firestore, "users", user.uid, "desktop_commands", docRef.id), (docSnap) => {
          const data = docSnap.data();
          if (data && (data.status === "success" || data.status === "error")) {
            setStatus(data.status);
            setResult(data.result);
            unsub();
          }
        });
      } catch (e: any) {
        setStatus("error");
        setResult(e.message);
      }
    }
  };

  return (
    <div className="w-full max-w-lg rounded-2xl overflow-hidden border-2 border-orange-500/30 bg-zinc-950/90 shadow-2xl my-6 mx-auto">
      <div className="px-6 py-3 bg-orange-950/40 border-b border-orange-500/20 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Local File System</span>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 bg-black/40 rounded border border-white/5">
          {config.action}
        </span>
      </div>
      <div className="p-6 space-y-4">
        <div className="font-mono text-xs text-orange-200 bg-black/40 p-3 rounded-lg border border-orange-500/20 truncate" title={config.filePath}>
          {config.filePath}
        </div>
        
        {config.action === "write" && (
          <div className="text-[10px] text-white/50 bg-black/40 p-3 rounded-lg border border-white/5 max-h-[100px] overflow-y-auto custom-scrollbar font-mono whitespace-pre">
            {config.content?.substring(0, 200)}
            {config.content && config.content.length > 200 ? "... (truncated)" : ""}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRun} 
            disabled={status === "running"}
            className="h-10 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all w-full flex items-center gap-2"
          >
            {status === "running" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {status === "success" ? "Run Again" : "Execute Local Action"}
          </Button>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" /> {result}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-start gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
            <Trash className="w-4 h-4 shrink-0" /> <span className="break-all">{result}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 8. IPC Terminal Operation Runner
// ==========================================
export interface IpcTerminalConfig {
  action: "run";
  command: string;
  cwd?: string;
}

export function IpcTerminalRunner({ config }: { config: IpcTerminalConfig }) {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const handleRun = async () => {
    if (typeof window === "undefined") return;
    
    setStatus("running");

    if ((window as any).electron) {
      try {
        const res = await (window as any).electron.fs.runTerminalCommand(config.command, config.cwd);
        
        if (res && res.success) {
          setStatus("success");
          setResult(res.data || "Command executed successfully.");
        } else {
          setStatus("error");
          setResult(res?.error || "Unknown IPC error.");
        }
      } catch (err: any) {
        setStatus("error");
        setResult(err.message);
      }
    } else {
      // Route through Firestore Desktop Bridge
      if (!user || !firestore) {
        setStatus("error");
        setResult("Sign in to route this command to your Desktop app.");
        return;
      }
      try {
        const docRef = await addDoc(collection(firestore, "users", user.uid, "desktop_commands"), {
          type: "terminal",
          command: config.command,
          cwd: config.cwd || null,
          status: "pending",
          createdAt: new Date().toISOString()
        });

        const unsub = onSnapshot(doc(firestore, "users", user.uid, "desktop_commands", docRef.id), (docSnap) => {
          const data = docSnap.data();
          if (data && (data.status === "success" || data.status === "error")) {
            setStatus(data.status);
            setResult(data.result);
            unsub();
          }
        });
      } catch (e: any) {
        setStatus("error");
        setResult(e.message);
      }
    }
  };

  return (
    <div className="w-full max-w-lg rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-zinc-950/90 shadow-2xl my-6 mx-auto">
      <div className="px-6 py-3 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Local Terminal</span>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 bg-black/40 rounded border border-white/5">
          {config.action}
        </span>
      </div>
      <div className="p-6 space-y-4">
        <div className="font-mono text-xs text-emerald-200 bg-black/40 p-3 rounded-lg border border-emerald-500/20 truncate" title={config.command}>
          {config.cwd && <span className="text-white/40 mr-2">{config.cwd} $</span>}
          {config.command}
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRun} 
            disabled={status === "running"}
            className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all w-full flex items-center gap-2"
          >
            {status === "running" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {status === "success" ? "Run Again" : "Execute Command"}
          </Button>
        </div>

        {(status === "success" || status === "error") && result && (
          <div className="mt-4 bg-black/60 p-4 rounded-xl border border-white/5">
             <pre className={`font-mono text-[10px] whitespace-pre-wrap overflow-x-auto max-h-[200px] custom-scrollbar ${status === "error" ? "text-rose-400" : "text-emerald-400"}`}>
               {result}
             </pre>
          </div>
        )}
      </div>
    </div>
  );
}
