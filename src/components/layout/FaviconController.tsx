"use client";
 
import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { drawAppIconPath } from "@/lib/icon-drawers";
 
export function FaviconController() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const [hostname, setHostname] = useState("");
  const [hueOffset, setHueOffset] = useState(0);
  const oldFaviconDrawnRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
    
    // Animation loop for the favicon
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setHueOffset(prev => (prev + 2) % 360);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);
 
  // 1. Fetch unread emails count
  const emailsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !user.email) return null;
    return query(
      collection(firestore, "emails"),
      where("recipientList", "array-contains", user.email.toLowerCase()),
      where("isRead", "==", false),
      limit(100)
    );
  }, [firestore, user]);
 
  const { data: unreadEmails } = useCollection(emailsQuery);
  const unreadEmailsCount = unreadEmails?.length || 0;
 
  // 2. Fetch unread chat notifications count
  const chatQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      where("type", "==", "xakchat"),
      where("read", "==", false),
      limit(100)
    );
  }, [firestore, user]);
 
  const { data: unreadChats } = useCollection(chatQuery);
  const unreadChatsCount = unreadChats?.length || 0;
 
  // 3. Determine active app, name, and unread count
  const activeApp = useMemo(() => {
    const isMail = hostname.startsWith("mail.") || pathname?.startsWith("/mail");
    const isChat = hostname.startsWith("chat.") || pathname?.startsWith("/chat") || pathname?.startsWith("/s/") || pathname?.startsWith("/dm");
    const isMaps = hostname.startsWith("maps.") || pathname?.startsWith("/map");
    const isCode = hostname.startsWith("code.") || pathname?.startsWith("/xakcode") || pathname?.startsWith("/code") || pathname?.startsWith("/console") || pathname?.startsWith("/hosting") || pathname?.startsWith("/utilities") || pathname?.startsWith("/git");
    const isGames = pathname?.startsWith("/games");
    const isSuite = pathname?.startsWith("/suite") || pathname?.startsWith("/write") || pathname?.startsWith("/slides") || pathname?.startsWith("/sheets") || pathname?.startsWith("/forms");
    const isAIChat = pathname?.startsWith("/ai-chat");
    const isDrive = hostname.startsWith("drive.") || pathname?.startsWith("/drive");
    const isCalculator = pathname?.startsWith("/calculator");
    const isNotes = pathname?.startsWith("/notes");
    const isSocial = pathname?.startsWith("/social");
    const isShop = pathname?.startsWith("/shop");
    const isDevCentre = hostname.startsWith("dev.") || pathname?.startsWith("/dev-centre");
    const isArt = pathname?.startsWith("/art");
    const isApps = pathname?.startsWith("/apps");
    const isArchive = pathname?.startsWith("/archive");
    const isAuthenticator = pathname?.startsWith("/authenticator");
    const isBuddy = pathname?.startsWith("/buddy");
    const isInstaller = pathname?.startsWith("/installer");
    const isNews = pathname?.startsWith("/news");
    const isSearchConsole = pathname?.startsWith("/search-console");
    const isSign = pathname?.startsWith("/sign");
    const isStream = pathname?.startsWith("/stream");
    const isTasks = pathname?.startsWith("/tasks");
    const isWeather = hostname.startsWith("weather.") || pathname?.startsWith("/weather");
    const isSupport = pathname?.startsWith("/contact") || pathname?.startsWith("/support");
    const isProfile = hostname.startsWith("account.") || hostname.startsWith("accounts.") || pathname?.startsWith("/profile");
    const isAbout = pathname?.startsWith("/about");
    const isSearch = pathname?.startsWith("/search");
    const isClassroom = pathname?.startsWith("/classroom");
    const isMeet = hostname.startsWith("meet.") || pathname?.startsWith("/meet");
    const isWhiteboard = pathname?.startsWith("/whiteboard");
    const isSettings = pathname?.startsWith("/settings");

    if (isMail) {
      return { name: "Mail", title: `Xakteir Mail${unreadEmailsCount > 0 ? ` (${unreadEmailsCount} unread)` : ""}`, icon: "mail", count: unreadEmailsCount };
    }
    if (isChat) {
      return { name: "Chat", title: `XakChat${unreadChatsCount > 0 ? ` (${unreadChatsCount} unread)` : ""}`, icon: "chat", count: unreadChatsCount };
    }
    if (isGames) {
      return { name: "Games", title: "Xakteir Games", icon: "games", count: 0 };
    }
    if (isSuite) {
      return { name: "Suite", title: "Xakteir Suite", icon: "suite", count: 0 };
    }
    if (isCalculator) {
      return { name: "Calculator", title: "Xakteir Calculator", icon: "calculator", count: 0 };
    }
    if (isNotes) {
      return { name: "Notes", title: "Xakteir Notes", icon: "notes", count: 0 };
    }
    if (isSocial) {
      return { name: "Social", title: "Xakteir Social", icon: "social", count: 0 };
    }
    if (isShop) {
      return { name: "Shop", title: "Xakteir Shop", icon: "shop", count: 0 };
    }
    if (isDevCentre) {
      return { name: "Dev Centre", title: "Xakteir Developer Centre", icon: "dev-centre", count: 0 };
    }
    if (isArt) {
      return { name: "Art Studio", title: "Xakteir Art Studio", icon: "art", count: 0 };
    }
    if (isApps) {
      return { name: "Apps", title: "Xakteir Apps", icon: "apps", count: 0 };
    }
    if (isArchive) {
      return { name: "Archive", title: "Xakteir Archive", icon: "archive", count: 0 };
    }
    if (isAuthenticator) {
      return { name: "Authenticator", title: "Xakteir Authenticator", icon: "authenticator", count: 0 };
    }
    if (isBuddy) {
      return { name: "XakBuddy", title: "XakBuddy", icon: "buddy", count: 0 };
    }
    if (isInstaller) {
      return { name: "XakInstaller", title: "XakInstaller", icon: "installer", count: 0 };
    }
    if (isMaps) {
      return { name: "Maps", title: "Xakteir Maps", icon: "map", count: 0 };
    }
    if (isNews) {
      return { name: "News", title: "Xakteir News", icon: "news", count: 0 };
    }
    if (isSearchConsole) {
      return { name: "Search Console", title: "Xakteir Search Console", icon: "search-console", count: 0 };
    }
    if (isSign) {
      return { name: "XakSign", title: "XakSign", icon: "sign", count: 0 };
    }
    if (isStream) {
      return { name: "Stream Feed", title: "Xakteir Stream Feed", icon: "stream", count: 0 };
    }
    if (isTasks) {
      return { name: "Tasks Tracker", title: "Xakteir Tasks Tracker", icon: "tasks", count: 0 };
    }
    if (isWeather) {
      return { name: "Weather", title: "Xakteir Weather", icon: "weather", count: 0 };
    }
    if (isSupport) {
      return { name: "Support", title: "Xakteir Support", icon: "support", count: 0 };
    }
    if (isProfile) {
      return { name: "Profile", title: "Xakteir Profile", icon: "profile", count: 0 };
    }
    if (isAbout) {
      return { name: "About", title: "About Xakteir", icon: "about", count: 0 };
    }
    if (isSearch) {
      return { name: "Search", title: "Xakteir Search", icon: "search", count: 0 };
    }
    if (isAIChat) {
      return { name: "Xak AI", title: "Xak AI", icon: "ai-chat", count: 0 };
    }
    if (isClassroom) {
      return { name: "Classroom", title: "Xakteir Classroom", icon: "classroom", count: 0 };
    }
    if (isMeet) {
      return { name: "Meet", title: "Xakteir Meet", icon: "meet", count: 0 };
    }
    if (isDrive) {
      return { name: "Drive", title: "Xakteir Drive", icon: "drive", count: 0 };
    }
    if (isWhiteboard) {
      return { name: "Whiteboard", title: "Xakteir Whiteboard", icon: "whiteboard", count: 0 };
    }
    if (isSettings) {
      return { name: "Settings", title: "Xakteir Settings", icon: "settings", count: 0 };
    }
    if (isCode) {
      return { name: "XakCode", title: "XakCode", icon: "code", count: 0 };
    }

    return {
      name: "Xakteir",
      title: "Xakteir",
      icon: "default",
      count: 0,
    };
  }, [pathname, hostname, unreadEmailsCount, unreadChatsCount]);
 
  // 4. Update Document Title
  useEffect(() => {
    document.title = activeApp.title;
  }, [activeApp.title]);
 
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const is404 = activeApp.name === "Xakteir" && pathname !== "/";
    const useOldFavicon = activeApp.icon === "mail" || is404;

    const setFavicon = (href: string) => {
      const existingLinks = document.querySelectorAll("link[rel~='icon'], link[rel='shortcut icon']");
      existingLinks.forEach(el => el.remove());

      const link = document.createElement("link");
      link.rel = "icon";
      link.type = href.endsWith(".ico") ? "image/x-icon" : "image/png";
      link.href = href;
      document.head.appendChild(link);
    };

    if (useOldFavicon) {
      if (oldFaviconDrawnRef.current === activeApp.count) return;
      oldFaviconDrawnRef.current = activeApp.count;
      if (activeApp.count > 0) {
        const img = new Image();
        img.src = "/favicon.ico";
        img.onload = () => {
          ctx.clearRect(0, 0, 64, 64);
          ctx.drawImage(img, 0, 0, 64, 64);

          // Draw notification badge circle and count
          const x = 50;
          const y = 14;
          const radius = 10;

          // Draw shadow
          ctx.beginPath();
          ctx.arc(x, y, radius + 1, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
          ctx.fill();

          // Draw red circle
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = "#ff2a5f";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          // Draw unread text count
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(activeApp.count.toString(), x, y);

          setFavicon(canvas.toDataURL("image/png"));
        };
      } else {
        setFavicon("/favicon.ico");
      }
    } else {
      oldFaviconDrawnRef.current = null;
      // Draw background/gradient inside shape using canvas operations
      ctx.clearRect(0, 0, 64, 64);
      
      // Scale and position the drawing context for sharp SVG path rendering
      ctx.save();
      ctx.translate(8, 8); // Padding
      ctx.scale(2, 2);     // scale 24x24 path to 48x48 viewport

      drawAppIconPath(ctx, activeApp.icon);

      ctx.restore();

      // Composite the color changing gradient into the white shape outline!
      ctx.globalCompositeOperation = "source-in";
      const gradient = ctx.createLinearGradient(0, 0, 64, 64);
      gradient.addColorStop(0, `hsl(${(hueOffset + 180) % 360}, 100%, 50%)`);
      gradient.addColorStop(0.25, `hsl(${(hueOffset + 145) % 360}, 100%, 50%)`);
      gradient.addColorStop(0.5, `hsl(${(hueOffset + 45) % 360}, 100%, 50%)`);
      gradient.addColorStop(0.75, `hsl(${(hueOffset + 340) % 360}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${(hueOffset + 270) % 360}, 100%, 50%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      // Reset composite to overlay notifications on top
      ctx.globalCompositeOperation = "source-over";

      // Draw notification badge circle and count
      if (activeApp.count > 0) {
        const x = 50;
        const y = 14;
        const radius = 10;

        // Draw shadow
        ctx.beginPath();
        ctx.arc(x, y, radius + 1, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        // Draw red circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff2a5f";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        // Draw unread text count
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(activeApp.count.toString(), x, y);
      }

      setFavicon(canvas.toDataURL("image/png"));
    }
  }, [activeApp.icon, activeApp.count, pathname, hueOffset]);
 
  return null;
}
