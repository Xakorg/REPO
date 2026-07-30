"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  LayoutGrid, 
  Gamepad2, 
  MessageCircle, 
  User as UserIcon,
  Bot,
  Mail,
  Video,
  Code2,
  Users,
  VideoIcon,
  Layers,
  Search as SearchIcon,
  Command as CommandIcon,
  ShoppingBag,
  LogOut,
  HardDrive,
  ClipboardList,
  Calculator,
  GraduationCap,
  Zap,
  Swords,
  Bell,
  CheckCircle2,
  Presentation,
  Menu,
  Maximize,
  Minimize,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Info,
  TrendingUp,
  Archive,
  Palette,
  ShieldCheck,
  Heart,
  Hammer,
  Globe,
  HelpCircle,
  Download,
  Coins,
  Dumbbell,
  Award,
  Link2,
  Map,
  Newspaper,
  FileText,
  Music,
  Radio,
  CheckSquare,
  Lock,
  Sun,
  PenTool,
  PlaySquare,
  Settings,
  Sparkles,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { navigateTo } from "@/lib/navigation";
import { Input } from "@/components/ui/input";

// Define the apps specifically for the mobile app launcher sheet
const APPS = [
  // Main Apps
  { name: "Mail", icon: Mail, href: "/mail", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Chat", icon: MessageCircle, href: "/chat", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Xak AI", icon: Bot, href: "/ai-chat", color: "text-primary", bg: "bg-primary/10" },
  { name: "Drive", icon: HardDrive, href: "https://drive.xakteir.com", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Games", icon: Gamepad2, href: "/games", color: "text-purple-400", bg: "bg-purple-400/10" },
  { name: "Maps", icon: Map, href: "/map", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Apps", icon: LayoutGrid, href: "/apps", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  
  // Other Apps
  { name: "Search", icon: SearchIcon, href: "/search", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Whiteboard", icon: Presentation, href: "/whiteboard", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Studio", icon: Sparkles, href: "/studio", color: "text-purple-500", bg: "bg-purple-500/10" },
  { name: "Premium", icon: Award, href: "/premium", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Settings", icon: Settings, href: "/settings", color: "text-zinc-500", bg: "bg-zinc-500/10" },
  { name: "XakSports", icon: Gamepad2, href: "/xaksports", color: "text-orange-400", bg: "bg-orange-400/10" },
  { name: "XakArena", icon: Swords, href: "/xakarena", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "XakCode", icon: Code2, href: "/xakcode", color: "text-sky-400", bg: "bg-sky-500/10" },
  { name: "XakView", icon: Video, href: "/xakview", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Xakteir Plan", icon: CalendarIcon, href: "/calendar", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "XakPicks", icon: ImageIcon, href: "/pics", color: "text-pink-500", bg: "bg-pink-500/10" },
  { name: "Classroom", icon: GraduationCap, href: "/classroom", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { name: "Meet", icon: VideoIcon, href: "https://meet.xakteir.com", color: "text-rose-400", bg: "bg-rose-400/10" },
  { name: "Translate", icon: Zap, href: "/translate", color: "text-blue-300", bg: "bg-blue-300/10" },
  { name: "Calculator", icon: Calculator, href: "/calculator", color: "text-zinc-400", bg: "bg-zinc-400/10" },
  { name: "Notes", icon: Code2, href: "/notes", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { name: "Social", icon: Users, href: "/social", color: "text-pink-500", bg: "bg-pink-500/10" },
  { name: "Shop", icon: ShoppingBag, href: "/shop", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Dev Centre", icon: Code2, href: "https://dev.xakteir.com", color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Art Studio", icon: Palette, href: "/art", color: "text-pink-400", bg: "bg-pink-400/10" },
  { name: "Archive", icon: Archive, href: "/archive", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Authenticator", icon: ShieldCheck, href: "/authenticator", color: "text-teal-400", bg: "bg-teal-400/10" },
  { name: "XakBuddy", icon: Heart, href: "/buddy", color: "text-rose-400", bg: "bg-rose-400/10" },
  { name: "XakInstaller", icon: Download, href: "/installer", color: "text-sky-500", bg: "bg-sky-500/10" },
  { name: "Forms", icon: FileText, href: "/forms", color: "text-purple-400", bg: "bg-purple-400/10" },
  { name: "Write", icon: PenTool, href: "/write", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Slides", icon: Presentation, href: "/slides", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Voltra", icon: Zap, href: "/voltra", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { name: "VoltraMax", icon: Zap, href: "/voltramax", color: "text-orange-500", bg: "bg-orange-500/10" },
  { name: "News", icon: Newspaper, href: "/news", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Search Console", icon: SearchIcon, href: "/search-console", color: "text-teal-400", bg: "bg-teal-400/10" },
  { name: "XakSign", icon: CheckSquare, href: "/sign", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Stream Feed", icon: Radio, href: "/stream", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Tasks Tracker", icon: CheckSquare, href: "/tasks", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Weather", icon: Sun, href: "/weather", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Support", icon: HelpCircle, href: "/contact", color: "text-zinc-400", bg: "bg-zinc-400/10" },
  { name: "Profile", icon: UserIcon, href: "https://account.xakteir.com", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { name: "About", icon: Info, href: "/about", color: "text-zinc-400", bg: "bg-zinc-400/10" }
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
