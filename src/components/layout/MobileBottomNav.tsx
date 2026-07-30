"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutGrid, Gamepad2, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { navigateTo } from "@/lib/navigation";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Define the apps specifically for the mobile app launcher sheet
const APPS = [
  { name: "Mail", icon: LayoutGrid, href: "/mail", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Chat", icon: MessageCircle, href: "/chat", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Games", icon: Gamepad2, href: "/games", color: "text-purple-400", bg: "bg-purple-400/10" },
];

function MobileAppLauncher({ router }: { router: any }) {
  const [appSearch, setAppSearch] = useState("");
  // In a real scenario we'd import APPS from a shared config, but keeping it simple here
  const filteredApps = APPS.filter(app => app.name.toLowerCase().includes(appSearch.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-[#0a0a15] text-white">
      <div className="p-5 border-b-2 border-white/10 flex items-center justify-between bg-black/40 pt-10">
        <h3 className="text-lg font-black uppercase italic tracking-tighter text-primary leading-none">Apps</h3>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input autoFocus value={appSearch} onChange={(e) => setAppSearch(e.target.value)} placeholder="Search..." className="h-9 w-32 rounded-xl bg-secondary/30 border-white/10 pl-9 text-[9px] font-black italic" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 grid grid-cols-4 gap-3">
          {filteredApps.map(app => (
            <button 
              key={app.name}
              onClick={() => navigateTo(app.href, router)} 
              className={cn("p-3 rounded-2xl flex flex-col items-center gap-2", app.bg)}
            >
              <app.icon className={cn("w-6 h-6", app.color)} />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/70 truncate w-full text-center">{app.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Games", href: "/games", icon: Gamepad2 },
    { name: "Chat", href: "/chat", icon: MessageCircle },
    { name: "Profile", href: "https://account.xakteir.com", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-white/40")} />
              <span className={cn("text-[9px] font-bold tracking-widest uppercase", isActive ? "text-primary" : "text-white/40")}>{item.name}</span>
            </Link>
          );
        })}

        {/* Center App Launcher Button */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full gap-1 relative -top-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)] border-4 border-[#05030d]">
                <LayoutGrid className="w-5 h-5 text-black" />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] bg-[#0a0a15] border-t border-white/10 p-0 shadow-[0_-20px_100px_rgba(0,0,0,0.8)]">
            <MobileAppLauncher router={router} />
          </SheetContent>
        </Sheet>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1">
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-white/40")} />
              <span className={cn("text-[9px] font-bold tracking-widest uppercase", isActive ? "text-primary" : "text-white/40")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
