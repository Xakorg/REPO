"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  Bot,
  Mail,
  Gamepad2,
  Video,
  Code2,
  Users,
  VideoIcon,
  Layers,
  Search as SearchIcon,
  Command as CommandIcon,
  ShoppingBag,
  MessageCircle,
  LogOut,
  User as UserIcon,
  HardDrive,
  ClipboardList,
  Calculator,
  GraduationCap,
  Zap,
  Bell,
  CheckCircle2,
  Presentation,
  Menu,
  Maximize,
  Minimize
} from "lucide-react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUser, useAuth, useMemoFirebase, useFirestore, useCollection, useDoc } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signOut } from "firebase/auth";
import { collection, query, where, doc } from "firebase/firestore";
import { triggerCommandCenter } from "@/components/CommandCenter";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RenderHat } from "@/components/RenderHat";

const APPS = [
  { name: "Search", icon: SearchIcon, href: "/search", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Chat", icon: MessageCircle, href: "/chat", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { name: "Xak AI", icon: Bot, href: "/ai-chat", color: "text-primary", bg: "bg-primary/10" },
  { name: "Whiteboard", icon: Presentation, href: "/whiteboard", color: "text-amber-400", bg: "bg-amber-400/10" },
  { name: "Suite", icon: Layers, href: "/suite", color: "text-primary", bg: "bg-primary/10" },
  { name: "Forms", icon: ClipboardList, href: "/forms", color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Mail", icon: Mail, href: "/mail", color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Drive", icon: HardDrive, href: "/drive", color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Games", icon: Gamepad2, href: "/games", color: "text-purple-400", bg: "bg-purple-500/10" },
  { name: "XakCode", icon: Code2, href: "/xakcode", color: "text-sky-400", bg: "bg-sky-500/10" },
  { name: "Meet", icon: VideoIcon, href: "/meet", color: "text-rose-400", bg: "bg-rose-400/10" },
  { name: "Translate", icon: Zap, href: "/translate", color: "text-blue-300", bg: "bg-blue-300/10" },
  { name: "Calculator", icon: Calculator, href: "/calculator", color: "text-zinc-400", bg: "bg-zinc-400/10" },
  { name: "Learn", icon: GraduationCap, href: "/learn", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Notes", icon: Code2, href: "/notes", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { name: "Social", icon: Users, href: "/social", color: "text-pink-500", bg: "bg-pink-500/10" },
  { name: "Shop", icon: ShoppingBag, href: "/shop", color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const unreadCountQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "notifications"), where("read", "==", false));
  }, [firestore, user]);

  const { data: unreadNotifs } = useCollection(unreadCountQuery);
  const totalUnreadCount = unreadNotifs?.length || 0;

  const filteredApps = APPS.filter(app => app.name.toLowerCase().includes(appSearch.toLowerCase()));
  const cleanDisplayName = user?.displayName?.replace(/^@+/, "") || "User";

  const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc(adminRoleRef);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");
  const isAdmin = isSuperAdmin || !!adminRole;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  if (!mounted) return null;

  const AppsList = () => (
    <div className="flex flex-col h-full bg-[#0a0a15] text-white">
      <div className="p-5 border-b-2 border-white/10 flex items-center justify-between bg-black/40">
        <h3 className="text-lg font-black uppercase italic tracking-tighter text-primary leading-none">Apps</h3>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={appSearch} onChange={(e) => setAppSearch(e.target.value)} placeholder="Search apps..." className="h-9 w-36 rounded-xl bg-secondary/30 border-white/10 pl-9 text-[9px] font-black italic" />
        </div>
      </div>
      <ScrollArea className="flex-1 max-h-[380px]">
        <div className="p-5 grid grid-cols-3 gap-3">
          {filteredApps.map(app => (
            <button 
              key={app.name}
              onClick={() => { router.push(app.href); }} 
              className={cn(
                "p-3 rounded-2xl flex flex-col items-center gap-2 transition-all hover:bg-white/5 hover:scale-105 group/btn border-2 border-transparent hover:border-white/5 shadow-md", 
                app.bg
              )}
            >
              <app.icon className={cn("w-6 h-6", app.color)} />
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground group-hover/btn:text-white truncate w-full text-center">{app.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <header className="h-20 bg-black/40 backdrop-blur-2xl sticky top-0 z-[100] px-10 border-b-2 border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.4)]">
      <div className="max-w-[1800px] mx-auto h-full flex items-center justify-between relative">
        <div className="flex items-center gap-6 z-20">
          <div className="hidden lg:block">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-12 px-8 bg-zinc-900/60 border-2 border-white/10 rounded-2xl transition-all flex items-center gap-4 shadow-xl">
                  <LayoutGrid className="w-6 h-6 text-white/60" />
                  <span className="text-[12px] font-black uppercase tracking-widest text-white/90">Apps</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0 glass-card rounded-[2rem] mt-6 border-4 border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]" align="start">
                <AppsList />
              </PopoverContent>
            </Popover>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl shadow-xl">
                   <Menu className="w-6 h-6 text-white/60" />
                 </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0a0a15] border-white/10 p-0 w-[400px] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                 <SheetHeader className="sr-only">
                    <SheetTitle>App Launcher</SheetTitle>
                 </SheetHeader>
                 <AppsList />
              </SheetContent>
            </Sheet>
          </div>

          <Button onClick={() => triggerCommandCenter()} variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl shadow-xl hidden sm:flex"><CommandIcon className="w-6 h-6 text-white/40" /></Button>
          
          <Button onClick={toggleFullscreen} variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl shadow-xl flex">
            {isFullscreen ? <Minimize className="w-6 h-6 text-white/40" /> : <Maximize className="w-6 h-6 text-white/40" />}
          </Button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Link href="/" className="pointer-events-auto group flex items-center gap-3">
            <span className="text-[2.5rem] font-black tracking-tighter text-white uppercase italic leading-none transition-all group-hover:text-primary drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Xakteir
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-6 z-20">
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl relative group shadow-xl">
                  <Bell className={cn("w-6 h-6", totalUnreadCount > 0 ? "text-primary animate-pulse" : "text-white/40 group-hover:text-primary")} />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-black text-[10px] font-black flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(var(--primary),0.6)] border-2 border-black">
                      {totalUnreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 glass-card rounded-[2.5rem] mt-6 border-4 border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden" align="end">
                <div className="p-6 border-b-2 border-white/5 bg-black/40 flex justify-between items-center text-white">
                  <p className="text-[12px] font-black uppercase tracking-widest text-primary italic">Alerts</p>
                  <Link href="/notifications"><button className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors">View All</button></Link>
                </div>
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y-2 divide-white/5">
                    {totalUnreadCount === 0 ? (
                      <div className="p-16 text-center opacity-20 text-white">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[12px] font-black uppercase tracking-[0.4em]">No alerts</p>
                      </div>
                    ) : (
                      unreadNotifs?.slice(0, 5).map(notif => (
                        <div key={notif.id} className="p-6 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden text-white">
                          <h4 className="text-[13px] font-black uppercase italic text-white line-clamp-1">{notif.title}</h4>
                          <p className="text-[11px] text-white/40 mt-1.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}

          {isAdmin && (
            <Button onClick={() => router.push('/admin')} variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl relative group shadow-xl">
              <Crown className="w-6 h-6 text-yellow-400" />
            </Button>
          )}

          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-[13px] font-black uppercase italic text-white group-hover:text-primary transition-colors">{cleanDisplayName}</span>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="relative shrink-0">
                    <RenderHat hatKey={userData?.hat} />
                    <Avatar className="w-12 h-12 rounded-[1.2rem] bg-zinc-900 border-2 border-white/10 shadow-2xl transition-transform active:scale-95 group-hover:border-primary/50">
                      <AvatarImage src={user.photoURL || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary text-white font-black text-xl">{cleanDisplayName?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2 glass-card rounded-[2.5rem] mt-6 border-4 border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden" align="end">
                <div className="p-6 border-b-2 border-white/5 bg-black/40 mb-3 rounded-t-[1.5rem] text-white text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Account</p>
                   <p className="text-[13px] font-bold text-white mt-2 truncate italic">{user.email}</p>
                </div>
                <div className="space-y-1.5 p-1.5 text-white">
                   <button onClick={() => router.push('/profile')} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all text-left">
                      <UserIcon className="w-5 h-5 text-primary" /> Profile
                   </button>
                   <div className="h-0.5 bg-white/5 my-3" />
                   <button onClick={() => { auth && signOut(auth); router.push('/'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-500/10 text-[11px] font-black uppercase tracking-widest text-rose-500 transition-all text-left">
                      <LogOut className="w-5 h-5" /> Sign Out
                   </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link href="/auth"><Button className="bg-primary hover:bg-primary/90 h-14 px-12 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] text-white shadow-2xl border-b-8 border-primary/20 active:border-b-0 transition-all">Sign In</Button></Link>
          )}
        </div>
      </div>
    </header>
  );
}
