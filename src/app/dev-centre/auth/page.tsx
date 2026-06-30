"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Plus, Mail, ShieldAlert, Key, UserX, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DevAuthPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"users" | "providers" | "templates">("users");

  const mockUsers = [
    { email: "john@example.com", uid: "U84X9A1", provider: "Email", created: "2026-06-01", signedIn: "2 mins ago", status: "Active" },
    { email: "sarah.connor@sky.net", uid: "U11Z0B2", provider: "Google", created: "2026-06-15", signedIn: "1 hour ago", status: "Active" },
    { email: "hacker99@evil.org", uid: "U99H9X9", provider: "Email", created: "2026-06-20", signedIn: "Never", status: "Disabled" },
  ];

  return (
    <div className="space-y-12 pb-32">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Auth</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-1">Identity & Access Management</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        {[
          { id: "users", label: "Users" },
          { id: "providers", label: "Sign-in Method" },
          { id: "templates", label: "Templates" },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <Card className="glass-card rounded-[3rem] p-10 border-2 border-white/5 bg-black/40 space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input placeholder="Search by email address, phone number, or user UID" className="pl-12 h-14 bg-black/50 border-white/10 rounded-2xl text-white italic" />
            </div>
            <Button className="h-14 px-8 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-xs rounded-2xl">
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="p-4">Identifier</th>
                  <th className="p-4">Providers</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Signed In</th>
                  <th className="p-4">User UID</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-zinc-300">
                {mockUsers.map((u, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4 flex items-center gap-3">
                      {u.status === "Disabled" ? <XCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      <span className={u.status === "Disabled" ? "text-zinc-500 line-through" : "text-white"}>{u.email}</span>
                    </td>
                    <td className="p-4"><Badge className="bg-white/10 text-zinc-300 border-none">{u.provider}</Badge></td>
                    <td className="p-4 text-zinc-500">{u.created}</td>
                    <td className="p-4 text-zinc-500">{u.signedIn}</td>
                    <td className="p-4 font-mono text-[10px] text-zinc-500">{u.uid}</td>
                    <td className="p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"><UserX className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "providers" && (
        <div className="space-y-6">
          {[
            { name: "Email/Password", icon: Mail, enabled: true },
            { name: "Google", icon: Key, enabled: false },
            { name: "Xakteir SSO", icon: ShieldAlert, enabled: true, color: "text-blue-500" },
          ].map(p => (
            <Card key={p.name} className="p-8 rounded-[2rem] border-2 border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${p.color || "text-zinc-400"}`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">{p.name}</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Authentication Provider</p>
                </div>
              </div>
              <Badge className={p.enabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border-zinc-700"}>
                {p.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "templates" && (
        <Card className="p-10 rounded-[3rem] border-2 border-white/5 bg-black/40 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Mail className="w-16 h-16 text-zinc-600 mx-auto" />
            <h3 className="text-2xl font-black uppercase text-zinc-400">Email Templates</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">Configure custom password reset, email verification, and magic link templates. (Premium Feature)</p>
          </div>
        </Card>
      )}

    </div>
  );
}
