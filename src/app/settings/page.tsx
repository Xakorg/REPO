"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Settings, Shield, ShieldCheck, Smartphone, Mail, Key, 
  Lock, Bell, Palette, Globe, Monitor, LogOut, CheckCircle2, 
  AlertTriangle, Copy, RefreshCw, Layers, ShieldAlert, Cpu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

export default function DiscordStyleSettingsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("security");

  // 2FA Choices State
  const [totpEnabled, setTotpEnabled] = useState(true);
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [phoneNum, setPhoneNum] = useState("+1 (555) 019-2834");

  // Recovery codes
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const backupCodes = ["8A92-B7C1", "4F10-9E2A", "7C33-D11F", "2B54-A98C", "9E11-F670"];

  // Notification Toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [socialMentions, setSocialMentions] = useState(true);

  // Appearance Theme
  const [selectedTheme, setSelectedTheme] = useState("obsidian");

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-8 animate-fade-in text-foreground pb-24">
      {/* Header */}
      <header className="flex justify-between items-center glass-card p-8 rounded-[2.5rem] border-white/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic">Account Settings & Security</h1>
            <p className="text-xs text-purple-400 font-bold uppercase tracking-wider">Discord-Style Security & System Controls</p>
          </div>
        </div>
      </header>

      {/* Main Settings Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-secondary/30 p-2 rounded-[2.5rem] h-16 gap-3 border-2 border-white/10 shadow-xl w-full max-w-4xl mx-auto flex">
          <TabsTrigger value="security" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"><ShieldCheck className="w-4 h-4 mr-2" /> 2FA & Security</TabsTrigger>
          <TabsTrigger value="connections" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"><Globe className="w-4 h-4 mr-2" /> Linked Accounts</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"><Bell className="w-4 h-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 rounded-[1.5rem] h-full font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"><Palette className="w-4 h-4 mr-2" /> Appearance</TabsTrigger>
        </TabsList>

        {/* ── 2FA & SECURITY TAB ── */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass-card rounded-[2.5rem] p-6 border-white/10 bg-black/40 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" /> Two-Factor Authentication (2FA) Choices
                </h3>
                <p className="text-xs text-white/50">Protect your Xakteir account with multi-layered 2FA authentication options.</p>
              </div>
            </div>

            {/* Option 1: Authenticator App */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Authenticator App (TOTP)</h4>
                  <p className="text-[10px] text-white/50">Use Google Authenticator, Authy, or 1Password to generate 6-digit codes.</p>
                </div>
              </div>
              <Switch checked={totpEnabled} onCheckedChange={(val) => {
                setTotpEnabled(val);
                toast({ title: val ? "Authenticator App 2FA Enabled!" : "Authenticator App 2FA Disabled" });
              }} />
            </div>

            {/* Option 2: Email OTP */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Email One-Time Password (OTP)</h4>
                  <p className="text-[10px] text-white/50">Receive a security pass code directly in your email inbox during login.</p>
                </div>
              </div>
              <Switch checked={emailOtpEnabled} onCheckedChange={(val) => {
                setEmailOtpEnabled(val);
                toast({ title: val ? "Email OTP 2FA Enabled!" : "Email OTP 2FA Disabled" });
              }} />
            </div>

            {/* Option 3: SMS Phone 2FA */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">SMS Security Codes</h4>
                  <p className="text-[10px] text-white/50">Send text verification codes to your mobile phone number.</p>
                </div>
              </div>
              <Switch checked={smsEnabled} onCheckedChange={(val) => {
                setSmsEnabled(val);
                toast({ title: val ? "SMS 2FA Enabled!" : "SMS 2FA Disabled" });
              }} />
            </div>

            {/* Option 4: Backup Recovery Codes */}
            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Backup Recovery Codes</h4>
                  <p className="text-[10px] text-white/60">Generate 10 emergency codes to use if you lose access to your 2FA device.</p>
                </div>
                <Button onClick={() => setShowBackupCodes(!showBackupCodes)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl h-9 px-4">
                  {showBackupCodes ? "Hide Codes" : "Show Codes"}
                </Button>
              </div>

              {showBackupCodes && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-purple-500/20">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="p-2 rounded-lg bg-black/60 border border-white/10 text-center font-mono text-xs font-bold text-purple-300">
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ── LINKED ACCOUNTS TAB ── */}
        <TabsContent value="connections" className="space-y-6">
          <Card className="glass-card rounded-[2.5rem] p-6 border-white/10 bg-black/40 space-y-4">
            <h3 className="text-sm font-black uppercase italic text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" /> OAuth Single Sign-On Connections
            </h3>

            <div className="space-y-3">
              {[
                { name: "Google", connected: true, icon: "🌐" },
                { name: "GitHub", connected: true, icon: "💻" },
                { name: "Discord", connected: false, icon: "💬" },
                { name: "Apple ID", connected: false, icon: "🍎" },
              ].map((conn, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{conn.icon}</span>
                    <span className="text-xs font-bold text-white">{conn.name}</span>
                  </div>
                  <Button variant={conn.connected ? "outline" : "default"} className={`h-9 px-4 rounded-xl text-xs font-bold ${conn.connected ? "border-emerald-500/40 text-emerald-400" : "bg-purple-600 text-white"}`}>
                    {conn.connected ? "Connected ✓" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card rounded-[2.5rem] p-6 border-white/10 bg-black/40 space-y-4">
            <h3 className="text-sm font-black uppercase italic text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" /> Notification Preferences
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Email Digest Updates</h4>
                  <p className="text-[10px] text-white/50">Receive daily activity digests in your primary email inbox.</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Browser Push Alerts</h4>
                  <p className="text-[10px] text-white/50">Instant desktop pop-up alerts for urgent updates.</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ── APPEARANCE TAB ── */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card rounded-[2.5rem] p-6 border-white/10 bg-black/40 space-y-4">
            <h3 className="text-sm font-black uppercase italic text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" /> System Appearance & Themes
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: "obsidian", name: "Obsidian Dark", color: "bg-black border-purple-500/50" },
                { id: "cyberpunk", name: "Cyberpunk Pink", color: "bg-pink-950 border-pink-500/50" },
                { id: "matrix", name: "Matrix Green", color: "bg-emerald-950 border-emerald-500/50" },
                { id: "holographic", name: "Holographic Blue", color: "bg-blue-950 border-cyan-500/50" },
              ].map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    toast({ title: `Applied Theme: ${theme.name} ✨` });
                  }}
                  className={`p-4 rounded-2xl border ${theme.color} cursor-pointer hover:scale-105 transition-all text-center space-y-2 ${selectedTheme === theme.id ? "ring-2 ring-purple-400" : ""}`}
                >
                  <div className="h-12 rounded-xl bg-white/10 border border-white/10" />
                  <span className="text-xs font-bold text-white block">{theme.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
