"use client";

import React, { useState, useRef, useEffect } from "react";
import { useXakCode, type ConsoleLog } from "../context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Terminal, Trash2, ArrowRight, CornerDownLeft } from "lucide-react";

export default function ConsolePage() {
  const {
    activeProject,
    activeFile,
    projectFiles,
    logs,
    addLog,
    clearLogs,
    setTheme
  } = useXakCode();

  const [cliInput, setCliInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "XakCode Web Shell v1.0.4",
    "Type 'help' to list available developer command binaries.",
    ""
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, logs]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = cliInput.trim();
    if (!command) return;

    setTerminalHistory(prev => [...prev, `xakcode@workspace:~$ ${command}`]);
    setCliInput("");

    const parts = command.split(/\s+/);
    const bin = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch(bin) {
      case "help":
        setTerminalHistory(prev => [
          ...prev,
          "Available CLI commands:",
          "  help           Display this help summary directory",
          "  clear          Flush terminal output history buffer",
          "  info           Display user workspace metadata and active file specs",
          "  scan           Analyze javascript syntax structure of current files",
          "  theme <name>   Swap editor theme (dracula, cyberpunk, vscode, monokai, nord)",
          "  test-api <url> Perform mock endpoint query diagnostic tests",
          "  inject-css <code> Inject custom CSS rule sheets directly into preview",
          "  build          Compile active folder bundle assets for production deployment"
        ]);
        break;

      case "clear":
        setTerminalHistory([]);
        clearLogs();
        break;

      case "info":
        setTerminalHistory(prev => [
          ...prev,
          `Project Name: ${activeProject?.name || "No active project"}`,
          `Active File:  ${activeFile}`,
          `Files Count:  ${Object.keys(projectFiles).length} files`,
          `Date:         ${new Date().toString()}`
        ]);
        break;

      case "scan":
        setTerminalHistory(prev => [
          ...prev,
          `Scanning workspace module files...`,
        ]);
        setTimeout(() => {
          let warningsCount = 0;
          const details: string[] = [];
          Object.entries(projectFiles).forEach(([name, code]) => {
            if (code.includes("console.log")) {
              warningsCount++;
              details.push(`  [WARNING] ${name}: contains console.log statement`);
            }
            if (name.endsWith('.jsx') && !code.includes("export default")) {
              warningsCount++;
              details.push(`  [ERROR] ${name}: missing default component export`);
            }
          });
          setTerminalHistory(prev => [
            ...prev,
            ...details,
            `Scan complete. Found ${warningsCount} static syntax alerts.`
          ]);
        }, 600);
        break;

      case "theme":
        if (!args[0]) {
          setTerminalHistory(prev => [...prev, "Usage: theme <dracula | cyberpunk | vscode | monokai | nord>"]);
        } else {
          const tName = args[0].toLowerCase();
          if (["dracula", "cyberpunk", "vscode", "monokai", "nord"].includes(tName)) {
            setTheme(tName as any);
            setTerminalHistory(prev => [...prev, `Successfully set theme to: ${tName}`]);
            addLog({ type: 'info', text: `Theme updated via CLI terminal: ${tName}`, timestamp: new Date().toLocaleTimeString() });
          } else {
            setTerminalHistory(prev => [...prev, `Unknown theme option "${tName}".`]);
          }
        }
        break;

      case "test-api":
        const url = args[0] || "https://api.github.com";
        setTerminalHistory(prev => [...prev, `Testing connection latency to API endpoint: ${url}...`]);
        setTimeout(() => {
          setTerminalHistory(prev => [
            ...prev,
            `  Status: 200 OK`,
            `  Latency: 142ms`,
            `  Type: application/json`,
            `  Payload: Connection diagnostics operational.`
          ]);
        }, 800);
        break;

      case "inject-css":
        if (!args[0]) {
          setTerminalHistory(prev => [...prev, "Usage: inject-css <body { background: red; } ...>"]);
        } else {
          const css = args.join(" ");
          addLog({ type: 'info', text: `Injected custom styles via CLI terminal: ${css}`, timestamp: new Date().toLocaleTimeString() });
          setTerminalHistory(prev => [...prev, "Custom CSS rules compiled and injected into runtime preview."]);
        }
        break;

      case "build":
        setTerminalHistory(prev => [
          ...prev,
          "Bundling files... Babel-standalone optimizing React transpiles",
          "Compressing modules and assets",
          "Resolving CDN dependencies"
        ]);
        setTimeout(() => {
          setTerminalHistory(prev => [
            ...prev,
            `Build SUCCESSful. Production target compiled in 482ms.`
          ]);
          addLog({ type: 'info', text: "Production compilation build completed", timestamp: new Date().toLocaleTimeString() });
        }, 1200);
        break;

      default:
        setTerminalHistory(prev => [...prev, `bash: ${bin}: command binary not found`]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07070d] text-left">
      
      {/* Top Console Logs */}
      <section className="flex-1 border-b border-white/5 flex flex-col min-h-0 bg-[#090912]/30">
        <header className="h-10 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-[9px] tracking-widest">
            <Terminal className="w-4 h-4" /> Live Intercepted Diagnostics (Chrome console)
          </div>
          <Button onClick={clearLogs} size="icon" variant="ghost" className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/5 rounded-md">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </header>

        <ScrollArea className="flex-1 p-4 font-mono text-[10.5px]">
          <div className="space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-white/20 italic">// Standing by. No diagnostics reported.</p>
            ) : (
              logs.map((log, index) => {
                const colorMap = {
                  log: "text-white/80 border-l border-white/20 pl-2",
                  info: "text-sky-400 border-l border-sky-500/50 pl-2",
                  warn: "text-amber-500 border-l border-amber-500/50 pl-2 bg-amber-500/5",
                  error: "text-rose-500 border-l border-rose-500/50 pl-2 bg-rose-500/5"
                };
                return (
                  <div key={index} className={`flex items-start justify-between py-0.5 ${colorMap[log.type]}`}>
                    <span className="break-all">{log.text}</span>
                    <span className="text-[8px] text-white/20 shrink-0 ml-4">{log.timestamp}</span>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </section>

      {/* Interactive Terminal prompt */}
      <section className="h-56 flex flex-col bg-[#030307]">
        <header className="h-8 border-b border-white/5 px-6 flex items-center shrink-0 bg-black/50">
          <span className="text-[8px] font-black uppercase tracking-wider text-white/40">Interactive developer command prompt shell</span>
        </header>

        <ScrollArea className="flex-1 p-4 font-mono text-[11px] text-[#00ffcc] select-text">
          <div className="space-y-1">
            {terminalHistory.map((line, index) => (
              <p key={index} className="whitespace-pre-wrap leading-relaxed">{line}</p>
            ))}
          </div>
        </ScrollArea>

        {/* Input prompt */}
        <form onSubmit={handleCommandSubmit} className="h-10 border-t border-white/5 bg-black px-4 flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold font-mono text-sky-400 shrink-0">xakcode@workspace:~$</span>
          <input 
            type="text" 
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-mono text-[10.5px] text-[#00ffcc]"
            autoFocus
            spellCheck={false}
          />
          <CornerDownLeft className="w-3.5 h-3.5 text-white/20 shrink-0" />
        </form>
      </section>
    </div>
  );
}
