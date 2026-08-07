'use client';

import { useState, useCallback } from 'react';
import { Play, RefreshCw, Copy, CheckCircle2, Code2, Eye, Download, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';

// Lazy-load Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'html',
  css: 'css',
  py: 'python',
  json: 'json',
  md: 'markdown',
  bash: 'shell',
  sh: 'shell',
};

interface LiveCodeEditorProps {
  code: string;
  language: string;
  filename?: string;
}

export function LiveCodeEditor({ code: initialCode, language: rawLang, filename }: LiveCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isRunning, setIsRunning] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const lang = LANGUAGE_MAP[rawLang?.toLowerCase()] || rawLang || 'plaintext';
  const canPreview = ['html', 'javascript', 'js', 'jsx'].includes(rawLang?.toLowerCase());

  const getPreviewContent = useCallback(() => {
    if (rawLang?.toLowerCase() === 'html') {
      return code;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      background: #0a0a12; 
      color: #e2e8f0; 
      font-family: 'Inter', system-ui, sans-serif;
      padding: 24px;
      margin: 0;
    }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
<script>
${code}
</script>
</body>
</html>`;
  }, [code, rawLang]);

  const handleRun = () => {
    setIsRunning(true);
    setActiveTab('preview');
    setPreviewKey(k => k + 1);
    setTimeout(() => setIsRunning(false), 600);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const ext = lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang === 'python' ? 'py' : lang;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `xak-file-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded file!", description: filename || `xak-file.${ext}` });
  };

  const handleSaveToDrive = async () => {
    if (!user || !firestore) {
      toast({ title: "Sign in to save to Xak Drive" });
      return;
    }
    setIsSavingDrive(true);
    try {
      const ext = lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang;
      const title = filename || `Code Snippet (${lang}) - ${new Date().toLocaleDateString()}`;
      await addDoc(collection(firestore, 'users', user.uid, 'documents'), {
        title,
        content: code,
        language: lang,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'file',
      });
      toast({ title: "📁 Saved to Xak Drive!", description: `Saved as "${title}"` });
    } catch {
      toast({ variant: "destructive", title: "Failed to save to Xak Drive" });
    } finally {
      setIsSavingDrive(false);
    }
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('code')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === 'code'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Code2 className="w-3 h-3" />
            Code
          </button>
          {canPreview && (
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === 'preview'
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/20 px-2 py-1 rounded bg-white/5 mr-1">
            {lang}
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5"
            title="Copy Code"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            Copy
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5"
            title="Download File"
          >
            <Download className="w-3 h-3" />
            Download
          </button>

          <button
            onClick={handleSaveToDrive}
            disabled={isSavingDrive}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all"
            title="Save to Xak Drive"
          >
            <HardDrive className="w-3 h-3 text-purple-400" />
            {isSavingDrive ? "Saving..." : "Save to Drive"}
          </button>

          {canPreview && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 transition-all disabled:opacity-50 ml-1"
            >
              {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative" style={{ height: '360px' }}>
        {activeTab === 'code' && (
          <MonacoEditor
            height="360px"
            language={lang}
            value={code}
            onChange={(v) => setCode(v || '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'gutter',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              wordWrap: 'on',
              automaticLayout: true,
              scrollbar: {
                verticalScrollbarSize: 4,
                horizontalScrollbarSize: 4,
              },
            }}
          />
        )}

        {activeTab === 'preview' && canPreview && (
          <iframe
            key={previewKey}
            srcDoc={getPreviewContent()}
            className="w-full h-full border-0 bg-[#0a0a12]"
            sandbox="allow-scripts allow-modals"
            title="Live Preview"
          />
        )}
      </div>
    </div>
  );
}
