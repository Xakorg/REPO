"use client";

import { useState } from "react";
import MonacoEditor from "@/components/editor/MonacoEditor";
import { pushFileClient } from "@/lib/githubClient";
import { askCopilot } from "@/lib/copilotClient";

export default function WorkspacePage() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [path, setPath] = useState("README.md");
  const [content, setContent] = useState("// Start coding in Xakcode workspace\n");
  const [message, setMessage] = useState("Update from Xakcode");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  const handleSave = async () => {
    if (!owner || !repo || !path) return alert("owner, repo, and path required");
    setIsSaving(true);
    try {
      const res = await pushFileClient(owner, repo, path, content, message);
      setResult(res);
      alert("Saved to GitHub");
    } catch (e: any) {
      console.error(e);
      alert(`Error saving: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAskCopilot = async () => {
    if (!copilotPrompt.trim()) return alert('Enter a prompt for Copilot');
    setCopilotLoading(true);
    try {
      const res = await askCopilot(copilotPrompt, content);
      if (res?.suggestion) {
        // append suggestion to content for now
        setContent((c) => c + "\n\n" + res.suggestion);
      } else if (res?.error) {
        alert(`Copilot error: ${res.error}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Copilot request failed: ${e.message || e}`);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#07070b] text-white">
      <header className="mb-6 flex items-center gap-4">
        <input placeholder="owner" value={owner} onChange={(e) => setOwner(e.target.value)} className="px-3 py-2 rounded bg-white/5" />
        <input placeholder="repo" value={repo} onChange={(e) => setRepo(e.target.value)} className="px-3 py-2 rounded bg-white/5" />
        <input placeholder="path (e.g. src/index.ts)" value={path} onChange={(e) => setPath(e.target.value)} className="px-3 py-2 rounded bg-white/5" />
        <input placeholder="commit message" value={message} onChange={(e) => setMessage(e.target.value)} className="px-3 py-2 rounded bg-white/5 flex-1" />
        <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 px-4 py-2 rounded font-bold">
          {isSaving ? "Saving..." : "Save to GitHub"}
        </button>
      </header>

      <section className="mb-6">
        <div className="flex gap-2 mb-2">
          <input placeholder="Ask Copilot (e.g. add tests)" value={copilotPrompt} onChange={(e) => setCopilotPrompt(e.target.value)} className="px-3 py-2 rounded bg-white/5 flex-1" />
          <button onClick={handleAskCopilot} disabled={copilotLoading} className="bg-sky-500 px-4 py-2 rounded font-bold">
            {copilotLoading ? 'Thinking...' : 'Ask Copilot'}
          </button>
        </div>
        <p className="text-sm text-white/60">Tip: Give Copilot a clear instruction like "Add unit tests for function X".</p>
      </section>

      <main className="h-[60vh] border border-white/5 rounded overflow-hidden">
        <MonacoEditor value={content} onChange={setContent} />
      </main>

      {result && (
        <pre className="mt-4 bg-white/5 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
