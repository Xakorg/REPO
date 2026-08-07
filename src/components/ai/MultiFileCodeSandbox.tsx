"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code, Eye, Plus, Trash2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboard";

interface FileEntry {
  name: string;
  language: string;
  content: string;
}

export function MultiFileCodeSandbox({ initialFiles }: { initialFiles?: FileEntry[] }) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileEntry[]>(
    initialFiles && initialFiles.length > 0
      ? initialFiles
      : [
          { name: "index.html", language: "html", content: '<div id="root">\n  <h1 style="color: #6366f1;">Hello from Xak AI Sandbox!</h1>\n  <p>Edit HTML, CSS, and JS to see live updates!</p>\n  <button id="btn">Click Me!</button>\n</div>' },
          { name: "style.css", language: "css", content: "body {\n  font-family: sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n  padding: 1.5rem;\n}\nbutton {\n  background: linear-gradient(135deg, #6366f1, #a855f7);\n  color: white;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 8px;\n  cursor: pointer;\n}" },
          { name: "script.js", language: "js", content: 'document.getElementById("btn")?.addEventListener("click", () => {\n  alert("Button clicked in Xak AI Sandbox!");\n});' },
        ]
  );
  const [activeTab, setActiveTab] = useState(0);
  const [activeView, setActiveView] = useState<"code" | "preview" | "split">("split");
  const [copied, setCopied] = useState(false);

  const activeFile = files[activeTab] || files[0];

  const updateFileContent = (val: string) => {
    const next = [...files];
    next[activeTab] = { ...next[activeTab], content: val };
    setFiles(next);
  };

  const addNewFile = () => {
    const fileName = prompt("Enter file name (e.g. app.js, style.css):", `file_${files.length + 1}.js`);
    if (!fileName) return;
    const ext = fileName.split(".").pop() || "js";
    setFiles([...files, { name: fileName, language: ext, content: "// New file content\n" }]);
    setActiveTab(files.length);
  };

  const deleteFile = (index: number) => {
    if (files.length <= 1) return;
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setActiveTab(0);
  };

  const generateCombinedSrcDoc = () => {
    const htmlFile = files.find((f) => f.name.endsWith(".html"))?.content || '<div id="root"></div>';
    const cssFile = files.filter((f) => f.name.endsWith(".css")).map((f) => f.content).join("\n");
    const jsFile = files.filter((f) => f.name.endsWith(".js") || f.name.endsWith(".ts")).map((f) => f.content).join("\n");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${cssFile}</style>
          <script>
            const _log = console.log;
            console.log = (...args) => {
              _log(...args);
            };
          </script>
        </head>
        <body>
          ${htmlFile}
          <script>${jsFile}</script>
        </body>
      </html>
    `;
  };

  const handleCopy = async () => {
    const allContent = files.map((f) => `// --- ${f.name} ---\n${f.content}`).join("\n\n");
    const ok = await copyToClipboard(allContent);
    if (ok) {
      setCopied(true);
      toast({ title: "Copied Sandbox files to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-indigo-500/30 bg-[#0a0c16]/90 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Header toolbar */}
      <div className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-950/40 px-4 py-2 text-xs">
        <div className="flex items-center space-x-2">
          <Code className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-indigo-200">Multi-File Code Sandbox</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="xs"
            variant={activeView === "code" ? "secondary" : "ghost"}
            onClick={() => setActiveView("code")}
            className="h-7 text-xs px-2"
          >
            <Code className="h-3.5 w-3.5 mr-1" /> Code
          </Button>
          <Button
            size="xs"
            variant={activeView === "split" ? "secondary" : "ghost"}
            onClick={() => setActiveView("split")}
            className="h-7 text-xs px-2"
          >
            Split
          </Button>
          <Button
            size="xs"
            variant={activeView === "preview" ? "secondary" : "ghost"}
            onClick={() => setActiveView("preview")}
            className="h-7 text-xs px-2"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
          </Button>
          <Button size="xs" variant="outline" onClick={handleCopy} className="h-7 text-xs px-2 border-indigo-500/30">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex items-center justify-between bg-black/40 border-b border-indigo-500/10 px-2 pt-1 text-xs overflow-x-auto">
        <div className="flex items-center space-x-1">
          {files.map((file, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-t-md cursor-pointer border-t border-x transition-colors ${
                activeTab === idx
                  ? "bg-[#0a0c16] border-indigo-500/40 text-indigo-300 font-medium"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              <span>{file.name}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(idx);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <Button size="xs" variant="ghost" onClick={addNewFile} className="h-7 px-2 text-indigo-400 hover:text-indigo-300">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Content Body */}
      <div className={`grid ${activeView === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} min-h-[280px]`}>
        {/* Code Editor */}
        {(activeView === "code" || activeView === "split") && (
          <div className="relative border-r border-indigo-500/20 bg-[#050711] p-2">
            <textarea
              value={activeFile?.content || ""}
              onChange={(e) => updateFileContent(e.target.value)}
              className="w-full h-full min-h-[260px] bg-transparent font-mono text-xs text-indigo-100 focus:outline-none resize-none p-2 leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {/* Live Preview */}
        {(activeView === "preview" || activeView === "split") && (
          <div className="bg-white/5 relative min-h-[260px]">
            <iframe
              srcDoc={generateCombinedSrcDoc()}
              title="Sandbox Preview"
              className="w-full h-full min-h-[260px] border-none bg-white rounded-b-xl"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
}
