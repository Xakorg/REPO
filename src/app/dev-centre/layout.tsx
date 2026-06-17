"use client";

import { useState, useEffect } from "react";
import { Cloud, LayoutGrid, Mail, Users, Key, Activity, Database, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/firebase";

export default function DevCentreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

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

  const navLinks = [
    { name: "Overview", path: "/dev-centre", icon: LayoutGrid },
    { name: "Dev Functions", path: "/dev-centre/functions", icon: FileCode2 },
    { name: "Dev Storage", path: "/dev-centre/storage", icon: Database },
    { name: "Custom Emails", path: "/dev-centre/emails", icon: Mail },
    { name: "Teams & IAM", path: "/dev-centre/teams", icon: Users },
    { name: "App Credentials", path: "/dev-centre/credentials", icon: Key },
    // Cloud Monitoring placeholder for phase 3
    { name: "Cloud Monitoring", path: "/dev-centre/monitoring", icon: Activity },
  ];

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#070710] text-zinc-100 flex flex-col md:flex-row pt-20">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-[#090912]/80 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">Xakteir Azure</span>
          </div>
          <Badge className="bg-sky-400/10 border-sky-400/20 text-sky-400 text-[9px] font-black uppercase">DEV</Badge>
        </div>
        
        {/* Active Account Switcher */}
        <div className="p-4 bg-black/40 border-b border-white/5 flex flex-col gap-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Active Profile</label>
          <select 
            value={activeAccountId || ""} 
            onChange={(e) => handleSwitchAccount(e.target.value)}
            className="w-full bg-zinc-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer"
          >
            {accounts.map(acc => (
              <option key={acc.uid} value={acc.uid}>{acc.displayName}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            const Icon = link.icon;
            return (
              <button 
                key={link.name}
                onClick={() => router.push(link.path)} 
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left", 
                  isActive ? "bg-white/5 text-primary" : "text-zinc-400 hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto animate-in fade-in duration-500">
        {children}
      </div>
    </div>
  );
}
