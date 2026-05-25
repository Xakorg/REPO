"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Mail, 
  Gamepad2, 
  Search, 
  MessageSquare, 
  Video, 
  FileText, 
  ShoppingBag, 
  ShieldAlert,
  Zap,
  Calendar,
  Code2,
  Lock,
  Map,
  Users,
  GraduationCap,
  Palette,
  Languages,
  VideoIcon,
  ImageIcon,
  Download,
  Ghost,
  Settings,
  Bell,
  Calculator,
  User,
  CloudSun,
  HardDrive,
  Layers,
  Presentation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlitchLogo } from "@/components/ui/glitch-logo";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Whiteboard", href: "/whiteboard", icon: Presentation },
  { name: "Suite", href: "/suite", icon: Layers },
  { name: "Quest Arena", href: "/learn-pro", icon: Zap },
  { name: "Mail", href: "/mail", icon: Mail },
  { name: "Drive", href: "/drive", icon: HardDrive },
  { name: "Calculator", href: "/calculator", icon: Calculator },
  { name: "Plan", href: "/calendar", icon: Calendar },
  { name: "Xak AI", href: "/ai-chat", icon: MessageSquare },
  { name: "XakView", href: "/xakview", icon: Video },
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Buddy Online", href: "/buddy", icon: Ghost },
  { name: "Maps", href: "/map", icon: Map },
  { name: "Social Space", href: "/social", icon: Users },
  { name: "Learn", href: "/learn", icon: GraduationCap },
  { name: "Art Studio", href: "/art", icon: Palette },
  { name: "Photos", icon: ImageIcon, href: "/pics" },
  { name: "Studio IDE", icon: Code2, href: "/games/studio" },
  { name: "Meet", href: "/meet", icon: VideoIcon },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Translate", icon: Languages, href: "/translate" },
  { name: "Safe", icon: Lock, href: "/vault" },
  { name: "Marketplace", icon: ShoppingBag, href: "/shop" },
  { name: "Notifications", icon: Bell, href: "/notifications" },
  { name: "Downloads", icon: Download, href: "/download" },
];

const bottomNav = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Admin Panel", href: "/admin", icon: ShieldAlert },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 h-screen border-r bg-card/30 backdrop-blur-xl">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 group">
          <GlitchLogo className="scale-50" />
          <span className="text-xl font-bold tracking-tighter text-white italic uppercase">Xakteir</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-10">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Apps
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/10" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "group-hover:text-primary transition-colors")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1">
        {bottomNav.map((item) => (
          <Link key={item.name} href={item.href}>
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:bg-white/5 hover:text-white">
              <item.icon className="w-4 h-4" />
              {item.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
