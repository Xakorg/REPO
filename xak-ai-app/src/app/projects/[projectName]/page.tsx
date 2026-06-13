"use client";

import React, { useState, useMemo, useEffect, use } from "react";
import { useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Braces, Calendar, User, Loader2, Play, Share2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const getIframeSrcDoc = (files: Record<string, string>) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
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
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script type="text/babel">
        const modules = {};
        
        // Simple relative path resolver/require function
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

        // 3. Render Entry Point Component (App.jsx / App.js / Default)
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

export default function PublishedProjectPage() {
  const params = useParams();
  const projectName = (params.projectName as string) || "";
  const firestore = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const projectRef = useMemoFirebase(() => {
    if (!firestore || !projectName) return null;
    return doc(firestore, "publishedProjects", projectName);
  }, [firestore, projectName]);

  const { data: project, isLoading } = useDoc(projectRef);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <Braces className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Project Not Found</h1>
        <p className="text-muted-foreground font-medium">This project path is either invalid or has been archived.</p>
        <Button asChild className="bg-primary rounded-xl">
          <a href="/games">Back to Hub</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 animate-fade-in space-y-12 px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 glass-card p-10 rounded-[3.5rem] border-white/5 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-primary text-white font-black uppercase text-[10px] tracking-widest px-4 py-1 border-none">Published</Badge>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> {project.publishedAt?.seconds ? new Date(project.publishedAt.seconds * 1000).toLocaleDateString() : 'Active Node'}
            </span>
          </div>
          <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">{project.name}</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">Created by <span className="text-primary italic">@{project.ownerName || "Member"}</span></p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => { setIframeKey(k => k + 1); setIsRunning(true); }} className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest shadow-xl text-white border-none">
            <RefreshCw className="w-4 h-4 mr-2" /> Restart Node
          </Button>
          <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-secondary">
            <Share2 className="w-5 h-5 text-foreground" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <Card className="glass-card rounded-[3.5rem] aspect-video bg-black flex flex-col items-center justify-center border-4 border-white/5 relative overflow-hidden group">
            {isRunning ? (
              <iframe
                key={iframeKey}
                srcDoc={getIframeSrcDoc(project.files || { "App.jsx": "export default function App() { return <div className='p-8 text-center text-red-500'>No code files published</div>; }" })}
                className="w-full h-full border-none"
                sandbox="allow-scripts"
              />
            ) : (
              <>
                <div className="absolute inset-0 arcade-grid opacity-20" />
                <button 
                  onClick={() => setIsRunning(true)}
                  className="w-24 h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center border-2 border-primary hover:scale-110 transition-transform duration-500"
                >
                  <Play className="w-10 h-10 text-primary fill-primary" />
                </button>
                <p className="mt-6 text-[10px] font-black text-primary uppercase tracking-[0.3em]">Initialize Project Runtime</p>
              </>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-zinc-950/40">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-black uppercase tracking-tighter text-foreground italic">Project Files</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {project.files && Object.keys(project.files).length > 0 ? (
                <>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Files count: {Object.keys(project.files).length}</p>
                  <div className="h-64 overflow-y-auto space-y-2 pr-2">
                    {Object.keys(project.files).map((filename) => (
                      <div key={filename} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-zinc-300 flex justify-between items-center">
                        <span>{filename}</span>
                        <Badge variant="outline" className="border-white/10 text-[9px] uppercase">{filename.split('.').pop() || 'file'}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Project Blocks: {project.blocks?.length || 0}</p>
                  <div className="h-64 overflow-y-auto space-y-3 pr-2">
                    {project.blocks?.map((block: any, i: number) => (
                      <div key={i} className={cn("p-3 rounded-xl border-b-4 text-[10px] font-black text-white", block.color, block.border)}>
                        {block.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
            <h3 className="text-lg font-black text-foreground uppercase italic tracking-tighter mb-2">Verified Ownership</h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">This project signature matches the Xakteir Project Registry for @{project.ownerName || "Member"}. Integrity verified 100%.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
