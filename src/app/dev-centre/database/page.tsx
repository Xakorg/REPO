"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Plus, Search, Filter, MoreVertical, FileJson, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DevDatabasePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"data" | "rules" | "indexes" | "usage">("data");
  const [selectedCol, setSelectedCol] = useState("users");
  const [selectedDoc, setSelectedDoc] = useState("U84X9A1");

  const collections = ["users", "dev_accounts", "messages", "products", "settings"];
  const documents = ["U84X9A1", "U11Z0B2", "U99H9X9", "A1B2C3D"];
  
  const docData = {
    displayName: "John Connor",
    email: "john@example.com",
    role: "Admin",
    metadata: {
      lastLogin: "2026-06-30T10:00:00Z",
      ipAddress: "192.168.1.1"
    },
    flags: ["verified", "premium"]
  };

  return (
    <div className="space-y-12 pb-32 h-[calc(100vh-160px)] flex flex-col">
      <header className="space-y-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border-2 border-sky-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            <Database className="w-8 h-8 text-sky-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Database</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-1">Real-time NoSQL Cloud Firestore</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4 shrink-0 overflow-x-auto">
        {[
          { id: "data", label: "Data" },
          { id: "rules", label: "Rules" },
          { id: "indexes", label: "Indexes" },
          { id: "usage", label: "Usage" },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-[inset_0_0_15px_rgba(14,165,233,0.2)]" 
                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "data" && (
        <Card className="glass-card rounded-[2rem] border-2 border-white/5 bg-black/40 flex-1 flex overflow-hidden shadow-2xl min-h-[500px]">
          
          {/* Collections Pane */}
          <div className="w-1/4 min-w-[200px] border-r border-white/5 flex flex-col bg-white/[0.01]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Collections</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-sky-400"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {collections.map(c => (
                <button 
                  key={c}
                  onClick={() => setSelectedCol(c)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    selectedCol === c ? "bg-sky-500/20 text-sky-400" : "text-zinc-400 hover:bg-white/5"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Pane */}
          <div className="w-1/4 min-w-[200px] border-r border-white/5 flex flex-col bg-white/[0.01]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{selectedCol}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-sky-400"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="p-2 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                <Input placeholder="Search doc..." className="h-8 pl-7 bg-black/50 border-white/10 rounded-lg text-[10px]" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {documents.map(d => (
                <button 
                  key={d}
                  onClick={() => setSelectedDoc(d)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-mono transition-all ${
                    selectedDoc === d ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Document Viewer Pane */}
          <div className="flex-1 flex flex-col bg-[#0f0f13] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="p-4 border-b border-white/5 flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-sky-500" />
                {selectedCol} / <span className="text-white">{selectedDoc}</span>
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6"><Filter className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto relative z-10">
              <pre className="text-sm font-mono text-emerald-400 bg-black/50 p-6 rounded-2xl border border-white/5 shadow-inner">
                <span className="text-zinc-500">{"{"}</span>{"\n"}
                <span className="text-sky-300">  "displayName"</span><span className="text-white">: </span><span className="text-amber-300">"John Connor"</span><span className="text-white">,</span>{"\n"}
                <span className="text-sky-300">  "email"</span><span className="text-white">: </span><span className="text-amber-300">"john@example.com"</span><span className="text-white">,</span>{"\n"}
                <span className="text-sky-300">  "role"</span><span className="text-white">: </span><span className="text-amber-300">"Admin"</span><span className="text-white">,</span>{"\n"}
                <span className="text-sky-300">  "metadata"</span><span className="text-white">: </span><span className="text-zinc-500">{"{"}</span>{"\n"}
                <span className="text-sky-300">    "lastLogin"</span><span className="text-white">: </span><span className="text-amber-300">"2026-06-30T10:00:00Z"</span><span className="text-white">,</span>{"\n"}
                <span className="text-sky-300">    "ipAddress"</span><span className="text-white">: </span><span className="text-amber-300">"192.168.1.1"</span>{"\n"}
                <span className="text-zinc-500">  {"}"}</span><span className="text-white">,</span>{"\n"}
                <span className="text-sky-300">  "flags"</span><span className="text-white">: </span><span className="text-zinc-500">{"["}</span><span className="text-amber-300">"verified"</span><span className="text-white">, </span><span className="text-amber-300">"premium"</span><span className="text-zinc-500">{"]"}</span>{"\n"}
                <span className="text-zinc-500">{"}"}</span>
              </pre>
            </div>
          </div>

        </Card>
      )}

      {activeTab === "rules" && (
        <Card className="glass-card rounded-[3rem] p-10 border-2 border-white/5 bg-black/40 space-y-6 min-h-[500px]">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" /> Security Rules
            </h3>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs tracking-widest px-8">Publish</Button>
          </div>
          <div className="w-full h-96 bg-[#0f0f13] rounded-2xl border border-white/10 p-6 font-mono text-sm text-zinc-300 shadow-inner">
            <pre>
<span className="text-purple-400">rules_version</span> = <span className="text-amber-300">'2'</span>;{"\n"}
<span className="text-purple-400">service</span> cloud.firestore {"{"}{"\n"}
  <span className="text-purple-400">match</span> /databases/{"{"}database{"}"}/documents {"{"}{"\n"}
    <span className="text-purple-400">match</span> /users/{"{"}userId{"}"} {"{"}{"\n"}
      <span className="text-purple-400">allow</span> read, write: <span className="text-sky-400">if</span> request.auth != <span className="text-rose-400">null</span> && request.auth.uid == userId;{"\n"}
    {"}"}{"\n"}
  {"}"}{"\n"}
{"}"}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
