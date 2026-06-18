"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;

export default function WebContainerEngine({ vmId }: { vmId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    if (!window.crossOriginIsolated) {
      setError("WebContainers require Cross-Origin Isolation. Please ensure you are running on localhost or have COOP/COEP headers enabled on your domain.");
      return;
    }

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#000000",
        foreground: "#10b981", // Emerald 500 for that classic hacker look
        cursor: "#f59e0b",
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 12,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    let resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {}
    });
    resizeObserver.observe(terminalRef.current);

    term.writeln(`Booting Xakteir WebOS for instance '${vmId}'...`);
    term.writeln("Connecting to WebContainer Engine...");

    let shellProcess: any = null;

    async function boot() {
      try {
        if (!webcontainerInstance) {
          term.writeln("Initializing WebAssembly container...");
          webcontainerInstance = await WebContainer.boot();
        }

        term.writeln("WebContainer started. Mounting virtual filesystem...");
        
        await webcontainerInstance.mount({
          "README.md": {
            file: {
              contents: "# Welcome to Xakteir WebOS\\n\\nThis is a real headless Node.js/Linux environment running entirely in your browser using WebContainers. You can run `npm install`, start servers, and execute JS/TS code.\\n"
            }
          }
        });

        term.writeln("Spawning jsh shell...");
        shellProcess = await webcontainerInstance.spawn("jsh", {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });

        // Pipe WebContainer output to xterm
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        // Pipe xterm input to WebContainer
        const inputWriter = shellProcess.input.getWriter();
        term.onData((data) => {
          inputWriter.write(data);
        });

        // Handle terminal resizing
        term.onResize((size) => {
          shellProcess.resize({
            cols: size.cols,
            rows: size.rows,
          });
        });

      } catch (err: any) {
        term.writeln(`\r\n\x1b[31mBoot Sequence Failed: ${err.message}\x1b[0m`);
        console.error(err);
      }
    }

    boot();

    return () => {
      resizeObserver.disconnect();
      if (shellProcess) {
        shellProcess.kill();
      }
      term.dispose();
    };
  }, [vmId]);

  if (error) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-mono">
        {error}
      </div>
    );
  }

  return <div ref={terminalRef} className="w-full h-full min-h-[300px]" />;
}
