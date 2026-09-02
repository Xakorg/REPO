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
import { AnimatedAppIcon } from "@/components/ui/AnimatedAppIcon";
import { Input } from "@/components/ui/input";

// Define the apps specifically for the mobile app launcher sheet
const APPS = [
  // Main Apps
  { name: "Mail", iconName: "mail", href: "/mail", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Chat", iconName: "chat", href: "/chat", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Xak AI", iconName: "ai-chat", href: "/ai-chat", color: "text-primary", bg: "bg-primary/10" },
  { name: "Drive", iconName: "drive", href: "https://drive.xakteir.com", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Games", iconName: "games", href: "/games", color: "text-purple-400", bg: "bg-purple-400/10" },
  { name: "Maps", iconName: "map", href: "/map", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Apps", iconName: "apps", href: "/apps", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  
  // Other Apps
  { name: "Search", iconName: "search", href: "/search", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Whiteboard", iconName: "whiteboard", href: "/whiteboard", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Studio", iconName: "default", href: "/studio", color: "text-purple-500", bg: "bg-purple-500/10" },
  { name: "Premium", iconName: "default", href: "/premium", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Settings", iconName: "settings", href: "/settings", color: "text-zinc-500", bg: "bg-zinc-500/10" },
  { name: "XakSports", iconName: "xaksports", href: "/xaksports", color: "text-orange-400", bg: "bg-orange-400/10" },
  { name: "XakArena", iconName: "default", href: "/xakarena", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "XakCode", iconName: "code", href: "/xakcode", color: "text-sky-400", bg: "bg-sky-500/10" },
  { name: "XakView", iconName: "default", href: "/xakview", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Xakteir Plan", iconName: "default", href: "/calendar", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "XakPicks", iconName: "default", href: "/pics", color: "text-pink-500", bg: "bg-pink-500/10" },
  { name: "Classroom", iconName: "classroom", href: "/classroom", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { name: "Meet", iconName: "meet", href: "https://meet.xakteir.com", color: "text-rose-400", bg: "bg-rose-400/10" },
  { name: "Translate", iconName: "default", href: "/translate", color: "text-blue-300", bg: "bg-blue-300/10" },
  { name: "Calculator", iconName: "calculator", href: "/calculator", color: "text-zinc-400", bg: "bg-zinc-400/10" },
  { name: "Notes", iconName: "notes", href: "/notes", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { name: "Social", iconName: "social", href: "/social", color: "text-pink-500", bg: "bg-pink-500/10" },
  { name: "Shop", iconName: "shop", href: "/shop", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Dev Centre", iconName: "dev-centre", href: "https://dev.xakteir.com", color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Art Studio", iconName: "art", href: "/art", color: "text-pink-400", bg: "bg-pink-400/10" },
  { name: "Archive", iconName: "archive", href: "/archive", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Authenticator", iconName: "authenticator", href: "/authenticator", color: "text-teal-400", bg: "bg-teal-400/10" },
  { name: "XakBuddy", iconName: "buddy", href: "/buddy", color: "text-rose-400", bg: "bg-rose-400/10" },
  { name: "XakInstaller", iconName: "installer", href: "/installer", color: "text-sky-500", bg: "bg-sky-500/10" },
  { name: "Forms", iconName: "suite", href: "/forms", color: "text-purple-400", bg: "bg-purple-400/10" },
  { name: "Write", iconName: "suite", href: "/write", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Slides", iconName: "suite", href: "/slides", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Voltra", iconName: "default", href: "/voltra", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { name: "VoltraMax", iconName: "default", href: "/voltramax", color: "text-orange-500", bg: "bg-orange-500/10" },
  { name: "News", iconName: "news", href: "/news", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Search Console", iconName: "search-console", href: "/search-console", color: "text-teal-400", bg: "bg-teal-400/10" },
  { name: "XakSign", iconName: "sign", href: "/sign", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Stream Feed", iconName: "stream", href: "/stream", color: "text-rose-500", bg: "bg-rose-500/10" },
  { name: "Tasks Tracker", iconName: "tasks", href: "/tasks", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Weather", iconName: "weather", href: "/weather", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Support", iconName: "support", href: "/contact", color: "text-zinc-400", bg: "bg-zinc-400/10" },
  { name: "Profile", iconName: "profile", href: "https://account.xakteir.com", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { name: "About", iconName: "about", href: "/about", color: "text-zinc-400", bg: "bg-zinc-400/10" }
];

function MobileAppLauncher({ router, setIsSheetOpen }: { router: any, setIsSheetOpen: (open: boolean) => void }) {
  const [appSearch, setAppSearch] = useState("");
  const filteredApps = APPS.filter(app => app.name.toLowerCase().includes(appSearch.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-[#0a0a15] text-white">
      <div className="p-4 lg:p-5 border-b-2 border-white/10 flex items-center justify-between bg-black/40 pt-6 lg:pt-10 sticky top-0 z-10">
        <h3 className="text-base lg:text-lg font-black uppercase italic tracking-tighter text-primary leading-none">Apps</h3>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input autoFocus value={appSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppSearch(e.target.value)} placeholder="Search..." className="h-10 lg:h-9 w-32 lg:w-32 rounded-xl bg-secondary/30 border-white/10 pl-9 text-xs lg:text-[9px] font-black italic min-h-[44px]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 lg:gap-4 pb-24">
          {filteredApps.map((app) => (
            <button
              key={app.name}
              onClick={() => {
                navigateTo(app.href, router);
                setIsSheetOpen(false);
              }}
              className="flex flex-col items-center gap-2 group p-2 hover:bg-white/5 active:bg-white/10 rounded-2xl transition-all min-h-[80px] active:scale-95"
            >
              <AnimatedAppIcon iconName={app.iconName} className="w-12 h-12 bg-white rounded-xl shadow-lg shadow-white/20" size={48} />
              <span className="text-[10px] font-medium text-white/70 group-hover:text-white text-center leading-tight line-clamp-2">
                {app.name}
              </span>
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Games", href: "/games", icon: Gamepad2 },
    { name: "Chat", href: "/chat", icon: MessageCircle },
    { name: "Profile", href: "https://account.xakteir.com", icon: UserIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around min-h-[60px] px-2">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1 p-2 min-h-[44px] active:scale-95 transition-transform">
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-white/40")} />
              <span className={cn("text-[9px] font-bold tracking-widest uppercase", isActive ? "text-primary" : "text-white/40")}>{item.name}</span>
            </Link>
          );
        })}

        {/* Center App Launcher Button */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full gap-1 relative -top-3 p-2 min-h-[44px] active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)] border-4 border-[#05030d]">
                <LayoutGrid className="w-5 h-5 text-black" />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] bg-[#0a0a15] border-t border-white/10 p-0 shadow-[0_-20px_100px_rgba(0,0,0,0.8)]">
            <MobileAppLauncher router={router} setIsSheetOpen={setIsSheetOpen} />
          </SheetContent>
        </Sheet>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1 p-2 min-h-[44px] active:scale-95 transition-transform">
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-white/40")} />
              <span className={cn("text-[9px] font-bold tracking-widest uppercase", isActive ? "text-primary" : "text-white/40")}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
