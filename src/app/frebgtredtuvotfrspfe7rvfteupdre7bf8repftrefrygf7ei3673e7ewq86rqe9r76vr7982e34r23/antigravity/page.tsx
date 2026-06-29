"use client";

import { useState } from "react";
import { Terminal, Loader2, Send } from "lucide-react";

export default function AntigravityTerminal() {
  const [messages, setMessages] = useState<{role:string, content:string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const newMsgs = [...messages, { role: "user", content: input }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/antigravity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: "model", content: data.reply }]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-amber-500 font-mono p-8 flex flex-col z-50 relative">
      <header className="flex items-center gap-4 border-b border-amber-500/30 pb-4 mb-8">
        <Terminal className="w-8 h-8 text-amber-500" />
        <h1 className="text-2xl font-black uppercase tracking-widest text-amber-500">Antigravity OS Uplink</h1>
        <div className="ml-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500/50">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Security Bypass Active
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto space-y-6 mb-8">
        {messages.length === 0 && (
          <div className="opacity-70 space-y-2">
            <p>Connection established via encrypted backdoor.</p>
            <p>Antigravity brain state loaded (VoltraOS v1.0 parameters active).</p>
            <p>Awaiting command...</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-xl ${m.role === 'user' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-white'}`}>
              <pre className="whitespace-pre-wrap font-sans text-sm font-medium">{m.content}</pre>
            </div>
          </div>
        ))}
        {loading && <div className="text-amber-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Transmitting...</div>}
      </div>

      <div className="flex gap-4">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Command Antigravity..."
          className="flex h-14 w-full rounded-md px-3 py-2 text-sm outline-none bg-zinc-900 border border-amber-500/30 text-amber-400 font-mono"
        />
        <button onClick={sendMessage} disabled={loading} className="inline-flex items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 h-14 px-8 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
