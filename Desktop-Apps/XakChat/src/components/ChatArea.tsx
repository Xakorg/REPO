import { useState, useRef, useEffect } from "react";
import { Send, Hash, Volume2, Paperclip, Copy, Check } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  content: string;
  timestamp: string;
  reactions?: Record<string, number>;
  codeSnippet?: { language: string; code: string };
}

interface ChatAreaProps {
  channelName: string;
  channelType: "text" | "voice";
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onAddReaction?: (msgId: string, emoji: string) => void;
}

export function ChatArea({ channelName, channelType, messages, onSendMessage, onAddReaction }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 bg-[#05030d] flex flex-col justify-between select-text relative z-20 overflow-hidden">
      {/* Header bar */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          {channelType === "voice" ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Hash className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-bold text-sm text-white">{channelName}</span>
          <span className="text-[11px] text-gray-500 font-medium">| Official Server Channel</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start space-x-3 group hover:bg-white/[0.02] p-2 rounded-xl transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
              {msg.avatar ? <img src={msg.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : msg.sender.substring(0, 1)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-emerald-300 hover:underline cursor-pointer">{msg.sender}</span>
                <span className="text-[10px] text-gray-500 font-mono">{msg.timestamp}</span>
              </div>

              <p className="text-xs text-gray-200 mt-1 leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Code Snippet Block if present */}
              {msg.codeSnippet && (
                <div className="my-2 rounded-xl overflow-hidden border border-emerald-500/20 bg-[#070514]">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-500/20 text-[10px]">
                    <span className="font-mono text-emerald-400 font-bold uppercase">{msg.codeSnippet.language}</span>
                    <button
                      onClick={() => copyCode(msg.codeSnippet!.code, msg.id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-white"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3 font-mono text-xs text-emerald-200 overflow-x-auto">
                    <code>{msg.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Reactions Bar */}
              <div className="flex items-center space-x-1.5 mt-2">
                {msg.reactions &&
                  Object.entries(msg.reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => onAddReaction?.(msg.id, emoji)}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hover:border-emerald-500/30 text-[11px] text-gray-300 hover:text-white"
                    >
                      <span>{emoji}</span>
                      <span className="font-bold text-[10px]">{count}</span>
                    </button>
                  ))}
                <button
                  onClick={() => onAddReaction?.(msg.id, "🔥")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-gray-400"
                >
                  + 🔥
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Message Input Toolbar */}
      <div className="p-4 bg-black/40 border-t border-white/10">
        <form onSubmit={handleSend} className="bg-white/5 border border-white/10 focus-within:border-emerald-500/40 rounded-2xl p-2 flex items-center space-x-2 transition-all">
          <button type="button" className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={`Message #${channelName}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-xs placeholder:text-gray-500 focus:outline-none px-2"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all disabled:opacity-30 shadow-lg shadow-emerald-500/30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
