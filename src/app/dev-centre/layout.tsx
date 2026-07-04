"use client";

import { useState, useEffect } from "react";
import { 
  Cloud, LayoutGrid, Database, Server, Box, MonitorSmartphone, 
  Network, GitBranch, Webhook, Mail, Rocket, Users, ShieldAlert,
  Activity, BarChart3, Radio, FileCode2, PlayCircle, Smartphone, 
  Bug, Gauge, TestTube, Share2, LineChart, Sliders, SplitSquareHorizontal, 
  MessageSquare, Bell, Link2, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useDevCentreStore } from "@/lib/dev-centre-store";

export default function DevCentreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { projects, activeProjectId, setActiveProject } = useDevCentreStore();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  useEffect(() => {
    const updateAccounts = () => {
      const accs = localStorage.getItem("xakteir_accounts");
      const activeId = localStorage.getItem("xakteir_active_account_id");
      if (accs) setAccounts(JSON.parse(accs));
      if (activeId) setActiveAccountId(activeId);
    };
    updateAccounts();
    window.addEventListener("xakteir-accounts-changed", updateAccounts);
    return () => window.removeEventListener("xakteir-accounts-changed", updateAccounts);
  }, []);

  const handleSwitchAccount = (uid: string) => {
    localStorage.setItem("xakteir_active_account_id", uid);
    window.dispatchEvent(new Event("xakteir-accounts-changed"));
  };

  const navGroups = [
    {
      title: "Core",
      links: [
        { name: "Project Overview", path: "/dev-centre", icon: LayoutGrid },
        { name: "Project Settings", path: "/dev-centre/settings", icon: Sliders },
      ]
    },
    {
      title: "Build",
      links: [
        { name: "Xakteir Dev Auth", path: "/dev-centre/auth", icon: Users },
        { name: "Xakteir Dev Database", path: "/dev-centre/database", icon: Database },
        { name: "Xakteir Dev Realtime Sync", path: "/dev-centre/realtime", icon: Radio },
        { name: "Xakteir Dev Storage", path: "/dev-centre/storage", icon: Box },
        { name: "Xakteir Dev Hosting", path: "/dev-centre/hosting", icon: Cloud },
        { name: "Xakteir Dev Functions", path: "/dev-centre/functions", icon: FileCode2 },
        { name: "Xakteir Dev ML", path: "/dev-centre/ml", icon: PlayCircle },
        { name: "VoltraOS App Store", path: "/dev-centre/voltra-apps", icon: Rocket },
      ]
    },
    {
      title: "Release & Monitor",
      links: [
        { name: "Xakteir Dev Crashlytics", path: "/dev-centre/crashlytics", icon: Bug },
        { name: "Xakteir Dev Performance", path: "/dev-centre/performance", icon: Gauge },
        { name: "Xakteir Dev Test Lab", path: "/dev-centre/test-lab", icon: TestTube },
        { name: "Xakteir Dev App Distro", path: "/dev-centre/distribution", icon: Share2 },
      ]
    },
    {
      title: "Analytics",
      links: [
        { name: "Xakteir Dev Analytics", path: "/dev-centre/analytics", icon: LineChart },
        { name: "Xakteir Dev Events", path: "/dev-centre/events", icon: Activity },
      ]
    },
    {
      title: "Engage",
      links: [
        { name: "Xakteir Dev Remote Config", path: "/dev-centre/remote-config", icon: Smartphone },
        { name: "Xakteir Dev A/B Testing", path: "/dev-centre/ab-testing", icon: SplitSquareHorizontal },
        { name: "Xakteir Dev Cloud Messaging", path: "/dev-centre/messaging", icon: Bell },
        { name: "Xakteir Dev In-App Messaging", path: "/dev-centre/in-app", icon: MessageSquare },
        { name: "Xakteir Dev Dynamic Links", path: "/dev-centre/dynamic-links", icon: Link2 },
      ]
    },
    {
      title: "Infrastructure",
      links: [
        { name: "Xakteir Dev VMs", path: "/dev-centre/compute/vms", icon: Server },
        { name: "Xakteir Dev Teams", path: "/dev-centre/teams", icon: ShieldAlert },
        { name: "Xakteir Dev Custom Domains", path: "/dev-centre/emails", icon: Mail },
        { name: "Xakteir Dev Webhooks", path: "/dev-centre/webhooks", icon: Webhook },
        { name: "Xakteir Dev Git", path: "/dev-centre/git", icon: GitBranch },
        { name: "Xakteir Dev Billing", path: "/dev-centre/billing", icon: DollarSign },
      ]
    },
    {
      title: "Automation & Logic",
      links: [
        { name: "Xakteir Dev Automate", path: "/dev-centre/automate", icon: Network },
      ]
    }
  ];

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#030308] text-zinc-100 flex flex-col md:flex-row pt-20 overflow-hidden font-sans">
      
      {/* Sidebar Navigation - Glassmorphism Premium */}
      <div className="w-full md:w-[320px] bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col shrink-0 shadow-2xl relative z-20 h-[calc(100vh-80px)]">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)]">
              <Cloud className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white leading-none">Xakteir Dev</h2>
              <p className="text-[10px] text-sky-400/80 font-bold uppercase tracking-wider mt-1">Console Platform</p>
            </div>
          </div>
        </div>
        
        {/* Active Account Switcher */}
        <div className="p-6 border-b border-white/5 relative z-10 bg-white/[0.02]">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">Active Profile</label>
          <select 
            value={activeAccountId || ""} 
            onChange={(e) => handleSwitchAccount(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs font-black text-white outline-none cursor-pointer hover:border-sky-500/50 transition-colors shadow-inner mb-4"
          >
            {accounts.map(acc => (
              <option key={acc.uid} value={acc.uid}>{acc.displayName}</option>
            ))}
          </select>

          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">Active Project</label>
          <select 
            value={activeProjectId || ""} 
            onChange={(e) => {
              if (e.target.value === 'new') {
                router.push('/dev-centre');
              } else {
                setActiveProject(e.target.value);
              }
            }}
            className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs font-black text-sky-400 outline-none cursor-pointer hover:border-sky-500/50 transition-colors shadow-inner"
          >
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
            <option value="new">+ Create New Project</option>
          </select>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide relative z-10 pb-20">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{group.title}</h3>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.path || (link.path !== "/dev-centre" && pathname.startsWith(link.path));
                  const Icon = link.icon;
                  return (
                    <button 
                      key={link.name}
                      onClick={() => {
                        if (link.path === "/dev-centre/compute/vms") {
                          window.location.href = link.path;
                        } else {
                          router.push(link.path);
                        }
                      }} 
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-left relative overflow-hidden group", 
                        isActive 
                          ? "bg-sky-500/10 text-sky-400 shadow-[inset_0_0_20px_rgba(14,165,233,0.1)] border border-sky-500/20" 
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.8)]"></div>}
                      <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-sky-400 drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]" : "text-zinc-500 group-hover:text-zinc-300")} />
                      {link.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 md:p-14 overflow-y-auto animate-in fade-in duration-500 h-[calc(100vh-80px)] relative" key={pathname}>
        {/* Background Ambient Glow */}
        <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="relative z-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
