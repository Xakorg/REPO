"use client";

import { useState } from "react";
import { Sparkles, MessageSquare, X, Send, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FloatingPiPAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "model", text: "Hi! I am your Xak AI Picture-in-Picture Mini Assistant." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "model", text: `I received: "${userText}". How else can I assist your workflow?` }]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20"
      >
        <Sparkles className="h-5 w-5 text-amber-300 animate-spin" />
        <span className="font-semibold text-xs">Ask Xak AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 h-96 rounded-2xl border border-indigo-500/40 bg-[#070a16]/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
      <div className="flex items-center justify-between p-3 border-b border-indigo-500/20 bg-indigo-950/40">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-indigo-200">Xak AI Mini Assistant</span>
        </div>
        <Button size="xs" variant="ghost" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0 text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-[11px]">
        {messages.map((m, idx) => (
          <div key={idx} className={`p-2 rounded-lg ${m.role === "user" ? "bg-indigo-600/30 ml-6 text-indigo-100 border border-indigo-500/30" : "bg-white/5 mr-6 text-gray-200 border border-white/10"}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-indigo-500/20 bg-black/40 flex items-center space-x-2">
        <Input
          placeholder="Type a quick prompt..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="bg-transparent border-none text-white text-xs focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
        />
        <Button size="xs" onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-500 text-white h-7 px-2">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
