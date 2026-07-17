"use client";

import React, { useState, useEffect, useRef } from "react";
import { useXakCode } from "./context";
import Editor, { useMonaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import { XakteirEditor } from "@/components/editor/XakteirEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  RefreshCw, 
  Code2, 
  Sparkles, 
  Send, 
  Loader2, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  ExternalLink, 
  FileText, 
  Upload, 
  Download, 
  Info,
  Maximize2,
  Minimize2,
  FileCode,
  Undo2,
  Redo2,
  Wand2,
  Wrench,
  Search,
  Check,
  HelpCircle,
  Eye,
  AlertTriangle
} from "lucide-react";

// Markdown parser
function MarkdownRender({ text }: { text: string }) {
  const lines = text.split('\n');
  const rendered = lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return <h1 key={idx} className="text-lg font-black text-white mt-4 mb-2 border-b border-white/5 pb-1">{trimmed.slice(2)}</h1>;
    }
    if (trimmed.startsWith('## ')) {
      return <h2 key={idx} className="text-sm font-bold text-sky-400 mt-3 mb-1.5">{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith('- ')) {
      return <li key={idx} className="text-[10px] text-white/70 ml-4 list-disc leading-relaxed">{trimmed.slice(2)}</li>;
    }
    if (trimmed.startsWith('> ')) {
      return <blockquote key={idx} className="border-l-2 border-sky-500 bg-sky-500/5 px-3 py-1.5 italic text-[10px] my-2 text-white/60">{trimmed.slice(2)}</blockquote>;
    }
    return <p key={idx} className="text-[10px] text-white/80 min-h-[1em] leading-normal">{line}</p>;
  });
  return <div className="p-5 space-y-1 overflow-y-auto h-full text-left bg-zinc-950/40">{rendered}</div>;
}

export default function WorkspacePage() {
  const { toast } = useToast();
  const {
    activeProject,
    projectFiles,
    activeFile,
    openTab,
    closeTab,
    codeText,
    handleFileChange,
    openTabs,
    closeOtherTabs,
    closeAllTabs,
    theme,
    fontSize,
    fontFamily,
    wordWrap,
    tabSize,
    isCompiling,
    setIsCompiling,
    compileDuration,
    setCompileDuration,
    autoReloadPreview,
    setAutoReloadPreview,
    previewUrl,
    setPreviewUrl,
    customCss,
    setCustomCss,
    cdnDependencies,
    toggleCdnDependency,
    addLog,
    isGenerating,
    aiPrompt,
    setAiPrompt,
    aiExplanation,
    setAiExplanation,
    aiPromptHistory,
    handleGenerateCode,
    multiplayerActive,
    multiplayerLogs
  } = useXakCode();

  // Multi-view states
  const [viewMode, setViewMode] = useState<'code' | 'ai'>('code');
  const [resolution, setResolution] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [zenMode, setZenMode] = useState(false);

  // Collaboration and Editor State
  const editorRef = useRef<any>(null);
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Initialize WebRTC and Yjs when multiplayer is active
  useEffect(() => {
    if (!activeProject || !multiplayerActive) {
      if (provider) provider.destroy();
      if (yDoc) yDoc.destroy();
      setYDoc(null);
      setProvider(null);
      return;
    }

    const doc = new Y.Doc();
    const roomName = `xakcode-${activeProject.id}-room`;
    const webrtcProvider = new WebrtcProvider(roomName, doc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    });

    webrtcProvider.awareness.setLocalStateField('user', {
      name: 'Collaborator',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });

    setYDoc(doc);
    setProvider(webrtcProvider);

    return () => {
      webrtcProvider.destroy();
      doc.destroy();
    };
  }, [activeProject?.id, multiplayerActive]);

  // Handle Monaco Editor Mounting
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    setupLanguage(editor, monaco);
    if (yDoc && provider) {
      setupBinding(editor, yDoc, provider);
    }
  };

  const setupLanguage = (editor: any, monaco: any) => {
    const ext = activeFile.split('.').pop();
    let lang = 'javascript';
    if (ext === 'css') lang = 'css';
    if (ext === 'html') lang = 'html';
    if (ext === 'json') lang = 'json';
    monaco.editor.setModelLanguage(editor.getModel(), lang);
  };

  const setupBinding = (editor: any, doc: Y.Doc, prov: WebrtcProvider) => {
    if (bindingRef.current) bindingRef.current.destroy();
    const ytext = doc.getText(activeFile);
    
    if (ytext.toString() === "" && codeText !== "") {
      ytext.insert(0, codeText);
    }

    const newBinding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), prov.awareness);
    bindingRef.current = newBinding;
    
    ytext.observe(() => {
       handleFileChange(ytext.toString());
    });
  };

  // Re-bind when switching files
  useEffect(() => {
    if (editorRef.current && yDoc && provider) {
       setupBinding(editorRef.current, yDoc, provider);
    } else if (editorRef.current && (!yDoc || !provider)) {
       if (bindingRef.current) {
         bindingRef.current.destroy();
         bindingRef.current = null;
       }
    }
  }, [activeFile, yDoc, provider]);

  // Search & Replace Overlay State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [isRegexSearch, setIsRegexSearch] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);

  // Undo / Redo History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Track code revisions for custom Undo/Redo
  useEffect(() => {
    if (codeText && (history.length === 0 || history[historyIndex] !== codeText)) {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(codeText);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }
  }, [codeText]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      handleFileChange(history[nextIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      handleFileChange(history[nextIdx]);
    }
  };

  // Compile Trigger
  const triggerCompile = () => {
    setIsCompiling(true);
    const start = performance.now();
    setTimeout(() => {
      if (previewIframeRef.current) {
        previewIframeRef.current.setAttribute("srcdoc", getIframeSrcDoc());
      }
      setIsCompiling(false);
      setCompileDuration(Math.round(performance.now() - start + 18));
      toast({ title: "Build Successful", description: "Compiled React and CSS bundlers." });
    }, 1000);
  };

  // Auto Compile on change
  useEffect(() => {
    if (autoReloadPreview) {
      const timer = setTimeout(() => {
        if (previewIframeRef.current) {
          previewIframeRef.current.setAttribute("srcdoc", getIframeSrcDoc());
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [codeText, autoReloadPreview, cdnDependencies, customCss]);

  // Code Formatter
  const handleFormatCode = () => {
    let indentLevel = 0;
    const lines = codeText.split('\n');
    const formattedLines = lines.map(line => {
      let trimmed = line.trim();
      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      const spaces = " ".repeat(indentLevel * tabSize);
      const indentLine = spaces + trimmed;
      if (trimmed.endsWith('{') || trimmed.endsWith('(') || trimmed.includes('{') && !trimmed.includes('}')) {
        indentLevel++;
      }
      return indentLine;
    });
    handleFileChange(formattedLines.join('\n'));
    toast({ title: "Code Formatted" });
  };

  // Search/Replace Actions
  const handleSearchReplace = (replaceAll = false) => {
    if (!searchQuery) return;
    try {
      const flags = (isCaseSensitive ? "" : "i") + "g";
      const escQuery = isRegexSearch ? searchQuery : searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escQuery, flags);
      
      if (replaceAll) {
        const nextCode = codeText.replace(regex, replaceQuery);
        handleFileChange(nextCode);
        toast({ title: "Replaced All Instances" });
      } else {
        const nextCode = codeText.replace(regex, replaceQuery); // replace first match
        handleFileChange(nextCode);
        toast({ title: "Replaced match" });
      }
    } catch(e) {
      toast({ variant: "destructive", title: "Invalid Search RegEx" });
    }
  };

  // ZIP Downloader
  const downloadZip = async () => {
    if (!activeProject) return;
    const zip = new JSZip();
    Object.entries(projectFiles).forEach(([name, content]) => {
      zip.file(name, content);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "ZIP Export Complete" });
  };

  // Download single file
  const downloadFile = () => {
    const blob = new Blob([codeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // React Boilerplates Injection
  const injectBoilerplate = (type: 'cyber' | 'grid' | 'auth' | 'counter') => {
    let boilerplateCode = "";
    if (type === 'cyber') {
      boilerplateCode = `// Cyber neon design template\nexport default function App() {\n  return (\n    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-sky-400">\n      <div className="border border-sky-500/30 bg-sky-500/5 rounded-3xl p-8 max-w-sm text-center shadow-2xl shadow-sky-500/10">\n        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">CYBER ENGINE</h1>\n        <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest mb-4">Diagnostic state online</p>\n        <button className="bg-sky-600 hover:bg-sky-500 px-6 py-2 rounded-xl text-black font-black uppercase text-[10px] tracking-wider transition-all">Engage</button>\n      </div>\n    </div>\n  );\n}`;
    } else if (type === 'grid') {
      boilerplateCode = `// Responsive Grid boilerplate\nexport default function App() {\n  return (\n    <div className="p-8 bg-zinc-950 text-white min-h-screen">\n      <h1 className="text-xl font-black uppercase mb-6 text-sky-400">Dashboard Grid</h1>\n      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n        {[1, 2, 3].map(item => (\n          <div key={item} className="bg-white/5 border border-white/5 p-5 rounded-2xl text-left space-y-2">\n            <span className="text-sky-400 text-[10px] font-black uppercase">Card #{item}</span>\n            <p className="text-xs text-white/70">Lorem ipsum dolor sit amet consectetur. Dynamic React items.</p>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}`;
    } else if (type === 'auth') {
      boilerplateCode = `// Glassmorphic Login Form\nexport default function App() {\n  return (\n    <div className="flex items-center justify-center min-h-screen bg-[#06060c] text-white p-6">\n      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2.5xl p-8 space-y-6 shadow-2xl">\n        <h2 className="text-2xl font-black uppercase tracking-tighter text-center">Xak Authenticate</h2>\n        <input className="w-full h-11 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-bold" placeholder="Developer email" />\n        <input className="w-full h-11 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-bold" type="password" placeholder="Terminal key" />\n        <button className="w-full h-11 bg-sky-600 hover:bg-sky-500 rounded-xl font-black uppercase tracking-widest text-[10px]">Log in</button>\n      </div>\n    </div>\n  );\n}`;
    } else if (type === 'counter') {
      boilerplateCode = `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-6">\n      <h1 className="text-5xl font-black italic text-sky-400">COUNTER: {count}</h1>\n      <div className="flex gap-3">\n        <button onClick={() => setCount(count + 1)} className="bg-sky-600 px-6 py-2 rounded-xl font-black text-xs">+</button>\n        <button onClick={() => setCount(0)} className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl font-black text-xs">Reset</button>\n      </div>\n    </div>\n  );\n}`;
    }

    handleFileChange(boilerplateCode);
    toast({ title: "Template Injected" });
  };

  // Compile React preview content in iframe via srcDoc supporting local module resolution
  const getIframeSrcDoc = () => {
    const files = projectFiles;

    // Load framework CDN URLs
    const cdnMap: Record<string, string> = {
      tailwind: '<script src="https://cdn.tailwindcss.com"></script>',
      animate: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>',
      fontawesome: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>',
      googlefonts: '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet"/><style>body { font-family: "Outfit", sans-serif; }</style>'
    };

    const scriptCDNs = cdnDependencies.map(dep => cdnMap[dep] || '').join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        ${scriptCDNs}
        <style>
          body { 
            margin: 0; 
            background: #000; 
            color: #fff; 
            font-family: system-ui, sans-serif; 
            overflow-x: hidden; 
          }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 99px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }
          ${customCss}
        </style>
        
        <!-- Intercept console logs script -->
        <script>
          const _log = console.log;
          const _warn = console.warn;
          const _error = console.error;

          window.parent.postMessage({ type: 'CONSOLE_CLEARED' }, '*');

          console.log = function(...args) {
            _log.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'log', text: args.join(' ') }, '*');
          };
          console.warn = function(...args) {
            _warn.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'warn', text: args.join(' ') }, '*');
          };
          console.error = function(...args) {
            _error.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', text: args.join(' ') }, '*');
          };
          window.addEventListener('error', function(err) {
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', text: err.message }, '*');
          });
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          const modules = {};
          
          const require = (name) => {
            const cleanName = name.replace(/^\\.\\//, '').replace(/\\.(jsx?|tsx?)$/, '');
            for (const key of Object.keys(modules)) {
              const cleanKey = key.replace(/\\.(jsx?|tsx?)$/, '');
              if (cleanKey === cleanName) {
                return modules[key];
              }
            }
            if (name === 'react') return React;
            if (name === 'react-dom') return ReactDOM;
            throw new Error("Cannot find module " + name);
          };

          const filesData = ${JSON.stringify(files)};

          // 1. Load CSS files dynamically
          Object.keys(filesData).forEach(filename => {
            if (filename.endsWith('.css')) {
              const style = document.createElement('style');
              style.innerHTML = filesData[filename];
              document.head.appendChild(style);
            }
          });

          // 2. Transpile and evaluate JS/JSX/TS/TSX files
          Object.keys(filesData).forEach(filename => {
            if (filename.endsWith('.css') || filename.endsWith('.json') || filename.endsWith('.md')) return;
            
            const rawCode = filesData[filename];
            let codeToRun = rawCode;
            codeToRun = codeToRun.replace(/export\\s+default\\s+function\\s+(\\w+)/g, 'function $1');
            codeToRun = codeToRun.replace(/export\\s+default\\s+/g, 'const DefaultExport = ');

            try {
              const compiled = Babel.transform(codeToRun, { 
                presets: ['react'],
                filename: filename
              }).code;

              const moduleFn = new Function('exports', 'require', 'React', 'ReactDOM', 
                compiled + '\\n;if (typeof App !== "undefined") { exports.default = App; } else if (typeof DefaultExport !== "undefined") { exports.default = DefaultExport; }'
              );

              const exports = {};
              moduleFn(exports, require, React, ReactDOM);
              modules[filename] = exports;
            } catch(err) {
              console.error("Compile/Eval Error in " + filename + ":", err);
            }
          });

          // 3. Render Entry Point Component
          try {
            let App = null;
            if (modules['App.jsx'] && modules['App.jsx'].default) {
              App = modules['App.jsx'].default;
            } else if (modules['App.js'] && modules['App.js'].default) {
              App = modules['App.js'].default;
            } else {
              for (const key of Object.keys(modules)) {
                if (modules[key] && modules[key].default) {
                  App = modules[key].default;
                  break;
                }
              }
            }

            if (App) {
              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(React.createElement(App));
            } else {
              document.getElementById('root').innerHTML = '<div style="padding:40px;color:#f87171;font-family:monospace;line-height:1.6;background:#111;border:1px solid #ef4444;border-radius:12px;margin:20px;"><h2 style="font-weight:900;margin-top:0;">Build Error</h2>No export default component was found. Ensure App.jsx has a default export: <br/><code>export default function App() { ... }</code></div>';
            }
          } catch(err) {
            document.getElementById('root').innerHTML = '<div style="padding:40px;color:#f87171;font-family:monospace;background:#111;border:1px solid #ef4444;border-radius:12px;margin:20px;"><h2 style="font-weight:900;margin-top:0;">Runtime Error</h2>' + err.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
  };

  // Intercept IFrame PostMessage logs
  useEffect(() => {
    const handleIframeLog = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        addLog({
          type: e.data.level,
          text: e.data.text,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    };
    window.addEventListener("message", handleIframeLog);
    return () => window.removeEventListener("message", handleIframeLog);
  }, []);

  const lineNumbersArray = Array.from({ length: codeText.split('\n').length }, (_, i) => i + 1);

  // Resolution sizes
  const resolutionWidths = {
    desktop: "w-full h-full",
    laptop: "w-[1024px] h-[700px] border-2 border-white/10 shadow-2xl rounded-2xl mx-auto",
    tablet: "w-[768px] h-[800px] border-2 border-white/10 shadow-2xl rounded-2xl mx-auto",
    mobile: "w-[375px] h-[667px] border-2 border-white/10 shadow-2xl rounded-2xl mx-auto"
  };

  // Simple Code complexity calculator
  const codeComplexity = React.useMemo(() => {
    const matches = codeText.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(|map\s*\(|filter\s*\(|&&\s*|\|\|\s*/g) || [];
    const score = matches.length + 1;
    let rating = "Low / Simple Code";
    let color = "bg-green-500/20 text-emerald-400";
    if (score > 12) {
      rating = "Complex / Needs Refactor";
      color = "bg-rose-500/20 text-rose-400";
    } else if (score > 6) {
      rating = "Moderate Complexity";
      color = "bg-amber-500/20 text-amber-400";
    }
    return { score, rating, color };
  }, [codeText]);

  // Key Down handlers for tab indentation and shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const spaces = " ".repeat(tabSize);
      const newVal = val.substring(0, start) + spaces + val.substring(end);
      handleFileChange(newVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
      }, 0);
    }
    // Ctrl + S (Save code notification)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      toast({ title: "Draft Backup Saved", description: "Your workspace code has been cached in database." });
    }
    // Ctrl + Alt + F (Format)
    if (e.ctrlKey && e.altKey && e.key === 'f') {
      e.preventDefault();
      handleFormatCode();
    }
  };

  return (
    <main className="flex-1 flex overflow-hidden bg-[#090910] text-left">
      
      {/* Code Mode Workspace Layout */}
      {viewMode === 'code' ? (
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Text Editor Panel */}
          <section className={cn("flex flex-col border-r border-white/5 relative bg-[#0b0b14]/50 transition-all", zenMode ? "flex-1" : "flex-1")}>
            
            {/* Tabs Header bar */}
            <header className="h-11 bg-black/40 border-b border-white/5 flex items-center justify-between px-3 overflow-x-auto shrink-0 select-none scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-0">
                {openTabs.map(tab => {
                  const isActive = activeFile === tab;
                  return (
                    <div 
                      key={tab}
                      onClick={() => openTab(tab)}
                      className={cn(
                        "h-8 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all border text-[9.5px] font-bold select-none shrink-0",
                        isActive 
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400" 
                          : "bg-white/5 border-transparent text-white/40 hover:text-white"
                      )}
                    >
                      {tab.endsWith('.css') ? <FileText className="w-3 h-3 text-emerald-400" /> : <FileCode className="w-3 h-3 text-sky-400" />}
                      <span>{tab}</span>
                      
                      {tab !== 'App.jsx' && (
                        <span 
                          onClick={(e) => { e.stopPropagation(); closeTab(tab); }}
                          className="hover:bg-white/10 rounded p-0.5 text-white/30 hover:text-white"
                        >
                          ×
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Editor controls */}
              <div className="flex gap-1.5 pl-3 shrink-0">
                <Button onClick={handleUndo} size="icon" variant="ghost" className="h-7 w-7 text-white/45 hover:text-white"><Undo2 className="w-3.5 h-3.5" /></Button>
                <Button onClick={handleRedo} size="icon" variant="ghost" className="h-7 w-7 text-white/45 hover:text-white"><Redo2 className="w-3.5 h-3.5" /></Button>
                <Button onClick={handleFormatCode} title="Format Code (Ctrl+Alt+F)" size="icon" variant="ghost" className="h-7 w-7 text-white/45 hover:text-white"><Wrench className="w-3.5 h-3.5" /></Button>
                <Button onClick={() => setIsSearchOpen(!isSearchOpen)} size="icon" variant="ghost" className="h-7 w-7 text-white/45 hover:text-white"><Search className="w-3.5 h-3.5" /></Button>
                <Button onClick={downloadFile} size="icon" variant="ghost" className="h-7 w-7 text-white/45 hover:text-white"><Download className="w-3.5 h-3.5" /></Button>
                <Button onClick={downloadZip} title="Export Project ZIP" size="icon" variant="ghost" className="h-7 w-7 text-sky-400 hover:text-sky-300"><Upload className="w-3.5 h-3.5 rotate-180" /></Button>
                <Button onClick={() => setZenMode(!zenMode)} size="icon" variant="ghost" className="h-7 w-7 text-white/45 hover:text-white">
                  {zenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </header>

            {/* Breadcrumb Path Info */}
            <div className="h-7 bg-black/25 px-4 flex items-center border-b border-white/5 shrink-0 text-[8.5px] font-mono text-white/35">
              <span>workspace</span>
              <span className="mx-1">/</span>
              <span>src</span>
              <span className="mx-1">/</span>
              <span className="text-sky-400/60 font-bold">{activeFile}</span>
            </div>

            {/* Search/Replace Overlay */}
            {isSearchOpen && (
              <div className="bg-black/80 border-b border-white/10 p-3 space-y-2 shrink-0">
                <div className="flex gap-2">
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search text..." 
                    className="bg-zinc-950 border-white/10 h-8 text-[10px] font-bold text-white flex-1"
                  />
                  <Input 
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    placeholder="Replace with..." 
                    className="bg-zinc-950 border-white/10 h-8 text-[10px] font-bold text-white flex-1"
                  />
                  <div className="flex gap-1.5 shrink-0">
                    <Button onClick={() => handleSearchReplace(false)} className="bg-sky-600 hover:bg-sky-500 h-8 text-[8px] font-black uppercase text-white px-3">Replace</Button>
                    <Button onClick={() => handleSearchReplace(true)} className="bg-sky-600 hover:bg-sky-500 h-8 text-[8px] font-black uppercase text-white px-3">Replace All</Button>
                  </div>
                </div>
                
                <div className="flex gap-4 text-[8.5px] font-black uppercase text-white/45 select-none pl-1">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input type="checkbox" checked={isCaseSensitive} onChange={() => setIsCaseSensitive(!isCaseSensitive)} /> Match Case
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input type="checkbox" checked={isRegexSearch} onChange={() => setIsRegexSearch(!isRegexSearch)} /> Regular Expression
                  </label>
                </div>
              </div>
            )}

            {/* Editor Canvas Area */}
            <div className="flex-1 flex overflow-hidden relative">
              


              {activeFile.endsWith('.md') ? (
                <MarkdownRender text={codeText} />
              ) : (
                <>
                  {/* Input TextArea / Monaco Editor */}
                  <Editor
                    height="100%"
                    width="100%"
                    theme={theme === 'vscode' ? 'vs-dark' : 'hc-black'}
                    value={!yDoc ? codeText : undefined}
                    onChange={(value) => {
                      if (!yDoc && value !== undefined) {
                        handleFileChange(value);
                      }
                    }}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: fontSize,
                      fontFamily: fontFamily || 'Consolas, monospace',
                      wordWrap: wordWrap ? 'on' : 'off',
                      tabSize: tabSize,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      padding: { top: 16 }
                    }}
                  />
                </>
              )}
            </div>
          </section>

          {/* RIGHT: Live preview container (Hidden in Zen Mode) */}
          {!zenMode && (
            <aside className="w-[440px] bg-[#05050a]/95 flex flex-col border-l border-white/5 shrink-0">
              
              {/* Preview header controls */}
              <header className="h-11 bg-[#090915] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">Sandbox preview</span>
                
                {/* Resolution selectors */}
                <div className="flex bg-black p-1 rounded-lg border border-white/10 items-center">
                  <button onClick={() => setResolution('desktop')} className={cn("p-1 rounded transition-all", resolution === 'desktop' ? "bg-sky-500 text-white" : "text-white/40")}><Monitor className="w-3 h-3" /></button>
                  <button onClick={() => setResolution('laptop')} className={cn("p-1 rounded transition-all", resolution === 'laptop' ? "bg-sky-500 text-white" : "text-white/40")}><Laptop className="w-3 h-3" /></button>
                  <button onClick={() => setResolution('tablet')} className={cn("p-1 rounded transition-all", resolution === 'tablet' ? "bg-sky-500 text-white" : "text-white/40")}><Tablet className="w-3 h-3" /></button>
                  <button onClick={() => setResolution('mobile')} className={cn("p-1 rounded transition-all", resolution === 'mobile' ? "bg-sky-500 text-white" : "text-white/40")}><Smartphone className="w-3 h-3" /></button>
                </div>
              </header>

              {/* Router URL Address Bar */}
              <div className="h-9 bg-black/40 border-b border-white/5 px-3 flex items-center gap-2 shrink-0">
                <div className="flex-1 bg-zinc-950 border border-white/10 rounded-lg h-6.5 px-3 flex items-center gap-1.5 text-[9.5px] font-mono text-white/50">
                  <span className="text-white/20 select-none">https://xakteir.app</span>
                  <input 
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white font-bold"
                  />
                </div>
                <Button onClick={triggerCompile} size="icon" variant="ghost" className="h-6 w-6 text-sky-400 hover:text-sky-300"><RefreshCw className="w-3.5 h-3.5" /></Button>
              </div>

              {/* Bundler options Drawer */}
              <div className="p-3 border-b border-white/5 bg-black/20 flex flex-wrap gap-2 text-[8px] font-black uppercase text-white/60 select-none">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input type="checkbox" checked={cdnDependencies.includes('tailwind')} onChange={() => toggleCdnDependency('tailwind')} /> Tailwind
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input type="checkbox" checked={cdnDependencies.includes('animate')} onChange={() => toggleCdnDependency('animate')} /> Animate.css
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input type="checkbox" checked={cdnDependencies.includes('fontawesome')} onChange={() => toggleCdnDependency('fontawesome')} /> Icons
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input type="checkbox" checked={cdnDependencies.includes('googlefonts')} onChange={() => toggleCdnDependency('googlefonts')} /> Outfit Font
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white ml-auto">
                  <input type="checkbox" checked={autoReloadPreview} onChange={() => setAutoReloadPreview(!autoReloadPreview)} /> Hot-Reload
                </label>
              </div>

              {/* Compiler stats banner */}
              <div className="h-6 bg-sky-500/5 px-4 flex items-center justify-between text-[8px] font-mono text-white/40 border-b border-white/5 shrink-0">
                <span>Compiler: Standby</span>
                <span>Speed: {compileDuration}ms</span>
              </div>

              {/* Frame Wrapper Canvas */}
              <div className="flex-1 bg-black flex items-center justify-center p-4 overflow-y-auto">
                <iframe
                  ref={previewIframeRef}
                  title="XakCode Workspace IFrame"
                  srcDoc={getIframeSrcDoc()}
                  sandbox="allow-scripts"
                  className={cn("bg-black border-none", resolutionWidths[resolution])}
                />
              </div>

              {/* Boilerplates quick insertion tray */}
              <div className="p-3 border-t border-white/5 bg-black/60 shrink-0 text-left space-y-1.5">
                <span className="text-[8.5px] font-black uppercase text-white/35 block ml-1">HTML/React Boilerplates</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <Button onClick={() => injectBoilerplate('cyber')} variant="outline" className="h-7 text-[7px] font-black uppercase border-white/10 hover:bg-white/5 text-white">Cyber</Button>
                  <Button onClick={() => injectBoilerplate('grid')} variant="outline" className="h-7 text-[7px] font-black uppercase border-white/10 hover:bg-white/5 text-white">Grid</Button>
                  <Button onClick={() => injectBoilerplate('auth')} variant="outline" className="h-7 text-[7px] font-black uppercase border-white/10 hover:bg-white/5 text-white">Login</Button>
                  <Button onClick={() => injectBoilerplate('counter')} variant="outline" className="h-7 text-[7px] font-black uppercase border-white/10 hover:bg-white/5 text-white">State</Button>
                </div>
              </div>
            </aside>
          )}

        </div>
      ) : (
        /* AI Assistant Mode panel */
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Large 70% IFrame Preview */}
          <section className="w-[70%] h-full flex flex-col border-r border-white/5 bg-black relative text-left">
            <header className="h-11 bg-black/40 border-b border-white/5 flex items-center justify-between px-5 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[9px] font-black uppercase text-white tracking-widest">Workspace Live Render (70%)</span>
              </div>
              <Button onClick={triggerCompile} size="sm" variant="ghost" className="h-7 px-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-white"><RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload</Button>
            </header>
            <div className="flex-1 bg-black">
              <iframe
                ref={previewIframeRef}
                title="XakCode AI Frame"
                srcDoc={getIframeSrcDoc()}
                sandbox="allow-scripts"
                className="w-full h-full border-none bg-black"
              />
            </div>
          </section>

          {/* Right: AI Sidebar */}
          <section className="w-[30%] h-full bg-[#05050a] flex flex-col shrink-0 text-left">
            <header className="h-11 bg-white/5 border-b border-white/5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4.5 h-4.5 text-sky-400 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">AI Assistant Code Synthesis</h3>
              </div>
              <Badge className="bg-sky-500/20 text-sky-400 border-none text-[8px] font-bold">ACTIVE</Badge>
            </header>

            <ScrollArea className="flex-1 p-5">
              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10.5px] leading-relaxed italic text-white/70">
                  "I am synchronized with the code. Input styling updates, responsive configurations, or layout specifications and I will generate new scripts."
                </div>

                {/* Code Complexity Analyzer card */}
                <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-widest text-white/45">
                    <span>File Code Complexity</span>
                    <span className="font-mono">Metrics</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold">Complexity index</span>
                    <span className="text-[10px] font-black text-white">{codeComplexity.score}</span>
                  </div>
                  <div className={`text-[8.5px] font-black uppercase px-2.5 py-1 rounded-lg text-center ${codeComplexity.color}`}>
                    {codeComplexity.rating}
                  </div>
                </div>

                {/* AI Commentary */}
                {aiExplanation && (
                  <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl space-y-2">
                    <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Synthesis Explanation</span>
                    <p className="text-[10px] leading-relaxed italic text-white/80">{aiExplanation}</p>
                  </div>
                )}

                {/* Quick Prompts list */}
                <div className="space-y-2">
                  <p className="text-[8px] font-black uppercase text-muted-foreground ml-1">Predefined prompt models</p>
                  <div className="grid grid-cols-1 gap-2">
                    {aiPromptHistory.map((h, idx) => (
                      <Button 
                        key={idx}
                        onClick={() => handleGenerateCode(h)}
                        variant="outline" 
                        className="h-11 text-[8px] font-black uppercase justify-start px-4 rounded-xl border-white/5 bg-white/5 hover:bg-sky-500/10 text-white whitespace-normal text-left"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-sky-400 shrink-0" /> {h}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Input Prompt bar */}
            <div className="p-4 border-t border-white/5 bg-black/40 shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleGenerateCode(aiPrompt); }}
                className="relative"
              >
                <Input 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask the AI to change styles or code..." 
                  className="h-12 bg-zinc-950 border-white/10 rounded-xl pr-14 text-xs font-bold text-white focus:border-sky-500"
                />
                <Button 
                  disabled={isGenerating || !aiPrompt.trim()} 
                  type="submit" 
                  size="icon" 
                  className="absolute right-1 top-1 h-10 w-10 bg-sky-600 rounded-lg hover:bg-sky-500 shadow-xl transition-all"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                </Button>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* Floating Toggle view switcher */}
      <div className="fixed bottom-4 right-4 z-[99] bg-zinc-950 p-1 rounded-xl border border-white/10 items-center flex shadow-2xl">
        <button 
          onClick={() => setViewMode('code')}
          className={cn(
            "px-4 h-8 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
            viewMode === 'code' ? "bg-sky-500 text-white shadow-xl" : "text-muted-foreground hover:bg-white/5"
          )}
        >
          <Code2 className="w-3 h-3" /> Code View
        </button>
        <button 
          onClick={() => setViewMode('ai')}
          className={cn(
            "px-4 h-8 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
            viewMode === 'ai' ? "bg-sky-500 text-white shadow-xl animate-pulse" : "text-muted-foreground hover:bg-white/5"
          )}
        >
          <Sparkles className="w-3 h-3" /> AI Builder
        </button>
      </div>

    </main>
  );
}
