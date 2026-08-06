'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, RefreshCw, Copy, CheckCircle2, ExternalLink, Code2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard';
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
}

export function LiveCodeEditor({ code: initialCode, language: rawLang }: LiveCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isRunning, setIsRunning] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const lang = LANGUAGE_MAP[rawLang?.toLowerCase()] || rawLang || 'plaintext';
  const canPreview = ['html', 'javascript', 'js', 'jsx'].includes(rawLang?.toLowerCase());

  const getPreviewContent = useCallback(() => {
    if (rawLang?.toLowerCase() === 'html') {
      return code;
    }
    // Wrap JS in an HTML template for preview
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
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

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/20 px-2 py-1 rounded bg-white/5">
            {lang}
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          {canPreview && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 transition-all disabled:opacity-50"
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
