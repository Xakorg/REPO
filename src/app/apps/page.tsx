"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Mail, 
  Gamepad2, 
  MessageSquare, 
  Video, 
  FileText, 
  ImageIcon, 
  LayoutGrid,
  Calendar,
  Code2,
  Lock,
  Map,
  Users,
  GraduationCap,
  Palette,
  Languages,
  VideoIcon,
  Bot,
  Layers,
  HardDrive,
  ClipboardList,
  ArrowRight,
  Search,
  MessageCircle,
  Presentation,
  Calculator,
  Bell
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const ALL_APPS = [
  { name: "Search", description: "Search the web and platform.", icon: Search, color: "text-blue-400", href: "/search", features: ["Fast", "AI Power"] },
  { name: "Chat", description: "Global messaging and community servers.", icon: MessageCircle, color: "text-emerald-400", href: "/chat", features: ["Servers", "Extensions", "AI"] },
  { name: "Xak AI", description: "Smart assistant for code and tasks.", icon: Bot, color: "text-primary", href: "/ai-chat", features: ["Memory", "Context"] },
  { name: "Whiteboard", description: "Collaborative drawing and planning.", icon: Presentation, color: "text-amber-400", href: "/whiteboard", features: ["Live", "Tools"] },
  { name: "Suite", description: "Documents, spreadsheets, and forms.", icon: Layers, color: "text-primary", href: "/suite", features: ["Work", "Cloud"] },
  { name: "Mail", description: "Email service for members.", icon: Mail, color: "text-blue-400", href: "/mail", features: ["Inbox", "Direct"] },
  { name: "Drive", description: "Cloud storage for your files.", icon: HardDrive, color: "text-amber-500", href: "/drive", features: ["Secure", "Storage"] },
  { name: "Games", description: "Play built-in and community games.", icon: Gamepad2, color: "text-purple-400", href: "/games", features: ["Arcade", "Multiplayer"] },
  { name: "XakCode", description: "AI-powered IDE with project hosting and deployment controls.", icon: Code2, color: "text-sky-400", href: "/xakcode", features: ["IDE", "AI", "Hosting"] },
  { name: "XakView", description: "Watch videos, livestreams, and follow creators.", icon: Video, color: "text-rose-500", href: "/xakview", features: ["Videos", "Livestreams", "Creators"] },
  { name: "Xakteir Plan", description: "Plan calendar and define goals with tracking milestones.", icon: Calendar, color: "text-amber-500", href: "/calendar", features: ["Calendar", "Goals", "Milestones"] },
  { name: "XakPicks", description: "Share public photos and manage personal albums.", icon: ImageIcon, color: "text-pink-500", href: "/pics", features: ["Albums", "Photos", "Uploads"] },
  { name: "Xakteir Classroom", description: "Educational portal for assignments, submissions, and grades.", icon: GraduationCap, color: "text-indigo-400", href: "/classroom", features: ["Assignments", "Submissions", "Grades"] },
  { name: "Art Studio", description: "Generate images with AI.", icon: Palette, color: "text-rose-500", href: "/art", features: ["AI Art", "Creative"] },
  { name: "Social", description: "Connect with the community.", icon: Users, color: "text-pink-500", href: "/social", features: ["Feed", "Profile"] },
  { name: "Calculator", description: "Math and logic tool.", icon: Calculator, color: "text-blue-500", href: "/calculator", features: ["Math", "History"] },
  { name: "Translate", description: "Language translation service.", icon: Languages, color: "text-blue-300", href: "/translate", features: ["Global", "Speech"] },
  { name: "Notifications", description: "Manage alerts and messages.", icon: Bell, color: "text-primary", href: "/notifications", features: ["Updates", "Alerts"] },
];

export default function AppsPage() {
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "system", "config");
  }, [firestore]);
  const { data: config } = useDoc(configRef);
  
  const lockedApps = config?.lockedApps || [];

  return (
    <div className="max-w-7xl mx-auto space-y-12 md:space-y-16 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-6 text-white pb-32">
      <header className="text-center space-y-6 md:space-y-8">
        <div className="flex justify-center mb-4 md:mb-6 animate-float">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] md:rounded-[3rem] bg-zinc-900 flex items-center justify-center shadow-2xl border-4 border-white/20">
            <svg className="w-8 h-8 md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="5" height="5" rx="1.5" fill="#818cf8" />
              <rect x="9.5" y="3" width="5" height="5" rx="1.5" fill="#22d3ee" />
              <rect x="16" y="3" width="5" height="5" rx="1.5" fill="#c084fc" />
              <rect x="3" y="9.5" width="5" height="5" rx="1.5" fill="#fbbf24" />
              <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" fill="#f43f5e" />
              <rect x="16" y="9.5" width="5" height="5" rx="1.5" fill="#34d399" />
              <rect x="3" y="16" width="5" height="5" rx="1.5" fill="#3b82f6" />
              <rect x="9.5" y="16" width="5" height="5" rx="1.5" fill="#ec4899" />
              <rect x="16" y="16" width="5" height="5" rx="1.5" fill="#2dd4bf" />
            </svg>
          </div>
        </div>
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">Apps</h1>
          <p className="text-base md:text-2xl text-muted-foreground max-w-2xl mx-auto font-bold uppercase tracking-widest italic opacity-60 px-4">
            Ecosystem for creators and builders.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {ALL_APPS.map((app) => {
          const isLocked = lockedApps.includes(app.name);
          const hasError = imgError[app.name];
          return (
            <div key={app.name} className={cn("group animate-in fade-in duration-500", isLocked && "cursor-not-allowed")}>
                <Link href={isLocked ? "#" : app.href}>
                  <Card className={cn("h-full glass-card border-4 border-white/10 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden transition-all duration-500 shadow-2xl flex flex-col hover:border-primary/50 hover:-translate-y-2 md:hover:-translate-y-4 bg-zinc-950/40", isLocked && "opacity-50 grayscale")}>
                    <CardHeader className="p-8 md:p-10 pb-0 flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2.5rem] bg-secondary/50 flex items-center justify-center mb-6 md:mb-8 group-hover:bg-primary transition-all duration-500 border-4 border-white/10 shadow-xl overflow-hidden">
                        <app.icon className={cn("w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110 duration-500", app.color, "group-hover:text-white")} />
                      </div>
                      <CardTitle className="text-2xl md:text-3xl font-black text-white group-hover:text-primary transition-colors uppercase italic tracking-tighter leading-none">{app.name}</CardTitle>
                      <CardDescription className="text-sm md:text-lg font-bold leading-relaxed mt-3 md:mt-4 line-clamp-2 italic opacity-60 text-white">
                        {isLocked ? "Maintenance mode." : app.description}
                      </CardDescription>
                    </CardHeader>
                    <div className="p-8 md:p-10 pt-4 md:pt-6">
                      <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
                        {app.features.map(feat => (
                          <span key={feat} className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-secondary/50 px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/5 shadow-sm">{feat}</span>
                        ))}
                      </div>
                      {!isLocked && (
                        <div className="flex items-center text-primary font-black text-[10px] md:text-sm uppercase tracking-[0.2em] gap-2 md:gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                          <span className="flex items-center gap-2">Launch <ArrowRight className="w-4 h-4 md:w-5 md:h-5" /></span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
