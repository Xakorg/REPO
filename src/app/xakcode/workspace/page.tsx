"use client";

import { useState } from "react";
import MonacoEditor from "@/components/editor/MonacoEditor";
import { pushFileClient } from "@/lib/githubClient";

export default function WorkspacePage() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [path, setPath] = useState("README.md");
  const [content, setContent] = useState("// Start coding in Xakcode workspace\n");
  const [message, setMessage] = useState("Update from Xakcode");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

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

      <main className="h-[70vh] border border-white/5 rounded overflow-hidden">
        <MonacoEditor value={content} onChange={setContent} />
      </main>

      {result && (
        <pre className="mt-4 bg-white/5 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
