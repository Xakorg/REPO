"use client";
 
import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
 
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
 
    // Draw background/gradient inside shape using canvas operations
    ctx.clearRect(0, 0, 64, 64);
    
    // Scale and position the drawing context for sharp SVG path rendering
    ctx.save();
    ctx.translate(8, 8); // Padding
    ctx.scale(2, 2);     // scale 24x24 path to 48x48 viewport
 
    // Drawing functions
    const drawEnvelope = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(2, 4, 20, 16, 2);
      c.stroke();
      c.beginPath();
      c.moveTo(2, 6);
      c.lineTo(12, 13);
      c.lineTo(22, 6);
      c.stroke();
    };
 
    const drawChat = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(21, 15);
      c.arcTo(21, 17, 19, 17, 2);
      c.lineTo(7, 17);
      c.lineTo(3, 21);
      c.lineTo(3, 5);
      c.arcTo(3, 3, 5, 3, 2);
      c.lineTo(19, 3);
      c.arcTo(21, 3, 21, 5, 2);
      c.closePath();
      c.stroke();
    };
 
    const drawGamepad = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(2, 6, 20, 12, 3);
      c.stroke();
      c.beginPath(); c.moveTo(6, 12); c.lineTo(10, 12); c.stroke();
      c.beginPath(); c.moveTo(8, 10); c.lineTo(8, 14); c.stroke();
      c.beginPath(); c.arc(15, 13, 0.5, 0, 2*Math.PI); c.stroke();
      c.beginPath(); c.arc(18, 11, 0.5, 0, 2*Math.PI); c.stroke();
    };
 
    const drawLayers = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(12, 2); c.lineTo(22, 7); c.lineTo(12, 12); c.lineTo(2, 7); c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(2, 12); c.lineTo(12, 17); c.lineTo(22, 12);
      c.stroke();
      c.beginPath();
      c.moveTo(2, 17); c.lineTo(12, 22); c.lineTo(22, 17);
      c.stroke();
    };
 
    const drawXakteirX = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 3.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(6, 6);
      c.bezierCurveTo(8.4, 6, 15.6, 18, 18, 18);
      c.stroke();
      c.beginPath();
      c.moveTo(18, 6);
      c.bezierCurveTo(15.6, 6, 8.4, 18, 6, 18);
      c.stroke();
    };
 
    const drawCalculator = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(4, 3, 16, 18, 2);
      c.stroke();
      c.beginPath();
      c.moveTo(4, 9); c.lineTo(20, 9);
      c.moveTo(12, 9); c.lineTo(12, 21);
      c.stroke();
    };
 
    const drawNotes = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(4, 2); c.lineTo(15, 2); c.lineTo(20, 7); c.lineTo(20, 22); c.lineTo(4, 22);
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(15, 2); c.lineTo(15, 7); c.lineTo(20, 7);
      c.stroke();
    };
 
    const drawSocial = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.2;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.arc(9, 8, 2.5, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(9, 18, 5, Math.PI, 0); c.stroke();
      c.beginPath(); c.arc(15, 8, 2.5, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(15, 18, 5, Math.PI, 0); c.stroke();
    };
 
    const drawShop = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(4, 8, 16, 13, 2);
      c.stroke();
      c.beginPath();
      c.arc(12, 8, 4, Math.PI, 0);
      c.stroke();
    };
 
    const drawDevCentre = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(8, 7); c.lineTo(3, 12); c.lineTo(8, 17);
      c.stroke();
      c.beginPath();
      c.moveTo(16, 7); c.lineTo(21, 12); c.lineTo(16, 17);
      c.stroke();
    };
 
    const drawArt = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.arc(12, 12, 8, 0, Math.PI*2);
      c.stroke();
      c.beginPath();
      c.arc(9, 13, 1.5, 0, Math.PI*2);
      c.stroke();
    };
 
    const drawApps = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.2;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(3, 3, 7, 7, 1);
      c.roundRect(14, 3, 7, 7, 1);
      c.roundRect(3, 14, 7, 7, 1);
      c.roundRect(14, 14, 7, 7, 1);
      c.stroke();
    };
 
    const drawArchive = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(3, 7, 18, 14, 2);
      c.stroke();
      c.beginPath(); c.moveTo(3, 7); c.lineTo(21, 7); c.stroke();
      c.beginPath(); c.moveTo(10, 11); c.lineTo(14, 11); c.stroke();
    };
 
    const drawAuthenticator = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(12, 3); c.lineTo(20, 6); c.lineTo(20, 13);
      c.bezierCurveTo(20, 18, 16, 21, 12, 22);
      c.bezierCurveTo(8, 21, 4, 18, 4, 13);
      c.lineTo(4, 6);
      c.closePath();
      c.stroke();
    };
 
    const drawBuddy = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(12, 7);
      c.bezierCurveTo(12, 3, 6, 2, 6, 8);
      c.bezierCurveTo(6, 14, 12, 19, 12, 21);
      c.bezierCurveTo(12, 19, 18, 14, 18, 8);
      c.bezierCurveTo(18, 2, 12, 3, 12, 7);
      c.closePath();
      c.stroke();
    };
 
    const drawInstaller = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(12, 3); c.lineTo(12, 15);
      c.moveTo(8, 11); c.lineTo(12, 15); c.lineTo(16, 11);
      c.moveTo(4, 20); c.lineTo(20, 20);
      c.stroke();
    };
 
    const drawMap = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.arc(12, 8, 4.5, 0, Math.PI*2);
      c.stroke();
      c.beginPath();
      c.moveTo(12, 12.5); c.lineTo(12, 21);
      c.stroke();
    };
 
    const drawNews = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(3, 4, 18, 16, 2);
      c.stroke();
      c.beginPath();
      c.moveTo(6, 8); c.lineTo(18, 8);
      c.moveTo(6, 12); c.lineTo(14, 12);
      c.moveTo(6, 16); c.lineTo(18, 16);
      c.stroke();
    };
 
    const drawSearch = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.arc(10, 10, 5.5, 0, Math.PI*2);
      c.stroke();
      c.beginPath();
      c.moveTo(14, 14); c.lineTo(20, 20);
      c.stroke();
    };
 
    const drawSign = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.roundRect(3, 3, 18, 18, 2);
      c.stroke();
      c.beginPath();
      c.moveTo(7, 12); c.lineTo(10, 15); c.lineTo(17, 8);
      c.stroke();
    };
 
    const drawStream = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.arc(12, 12, 2, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(12, 12, 5.5, Math.PI, 0); c.stroke();
      c.beginPath(); c.arc(12, 12, 9, Math.PI, 0); c.stroke();
    };
 
    const drawTasks = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.2;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.roundRect(3, 4, 4, 4, 1); c.stroke();
      c.beginPath(); c.moveTo(9, 6); c.lineTo(20, 6); c.stroke();
      c.beginPath(); c.roundRect(3, 11, 4, 4, 1); c.stroke();
      c.beginPath(); c.moveTo(9, 13); c.lineTo(20, 13); c.stroke();
      c.beginPath(); c.roundRect(3, 18, 4, 4, 1); c.stroke();
      c.beginPath(); c.moveTo(9, 20); c.lineTo(20, 20); c.stroke();
    };
 
    const drawWeather = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.beginPath(); c.arc(12, 12, 4.5, 0, Math.PI*2); c.stroke();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = 12 + Math.cos(angle) * 6.5;
        const y1 = 12 + Math.sin(angle) * 6.5;
        const x2 = 12 + Math.cos(angle) * 8.5;
        const y2 = 12 + Math.sin(angle) * 8.5;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      }
    };
 
    const drawSupport = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.arc(12, 12, 9, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(12, 8, 2.5, Math.PI, 0); c.stroke();
      c.beginPath(); c.moveTo(14.5, 8); c.lineTo(12, 11); c.lineTo(12, 14); c.stroke();
      c.beginPath(); c.arc(12, 17, 0.4, 0, Math.PI*2); c.stroke();
    };
 
    const drawProfile = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.arc(12, 7, 3.5, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(12, 20, 7, Math.PI, 0); c.stroke();
    };
 
    const drawAbout = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.arc(12, 12, 9, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.arc(12, 7, 0.5, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(12, 10); c.lineTo(12, 17); c.stroke();
    };
 
    const drawAIChat = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.roundRect(4, 7, 16, 12, 2); c.stroke();
      c.beginPath(); c.moveTo(4, 13); c.lineTo(2, 13); c.moveTo(20, 13); c.lineTo(22, 13); c.stroke();
      c.beginPath(); c.arc(9, 12, 0.8, 0, Math.PI*2); c.arc(15, 12, 0.8, 0, Math.PI*2); c.stroke();
    };
 
    const drawClassroom = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(12, 4); c.lineTo(22, 9); c.lineTo(12, 14); c.lineTo(2, 9); c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(6, 12); c.lineTo(6, 16);
      c.bezierCurveTo(6, 18, 18, 18, 18, 16);
      c.lineTo(18, 12);
      c.stroke();
    };
 
    const drawMeet = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.roundRect(3, 6, 11, 12, 2); c.stroke();
      c.beginPath();
      c.moveTo(14, 9); c.lineTo(20, 5); c.lineTo(20, 19); c.lineTo(14, 15);
      c.closePath();
      c.stroke();
    };
 
    const drawDrive = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(12, 4); c.lineTo(20, 19); c.lineTo(4, 19); c.closePath();
      c.stroke();
    };
 
    const drawWhiteboard = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath(); c.roundRect(3, 5, 18, 11, 1); c.stroke();
      c.beginPath();
      c.moveTo(12, 16); c.lineTo(12, 20);
      c.moveTo(12, 20); c.lineTo(8, 23);
      c.moveTo(12, 20); c.lineTo(16, 23);
      c.stroke();
    };
 
    const drawSettings = (c: CanvasRenderingContext2D) => {
      c.lineWidth = 2.5;
      c.lineCap = "round";
      c.beginPath(); c.arc(12, 12, 3.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(12, 12, 7.5, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x1 = 12 + Math.cos(angle) * 7.5;
        const y1 = 12 + Math.sin(angle) * 7.5;
        const x2 = 12 + Math.cos(angle) * 9.5;
        const y2 = 12 + Math.sin(angle) * 9.5;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      }
    };
 
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
      // Draw dynamic favicon
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "none";
      if (activeApp.icon === "mail") drawEnvelope(ctx);
      else if (activeApp.icon === "chat") drawChat(ctx);
      else if (activeApp.icon === "games") drawGamepad(ctx);
      else if (activeApp.icon === "suite") drawLayers(ctx);
      else if (activeApp.icon === "calculator") drawCalculator(ctx);
      else if (activeApp.icon === "notes") drawNotes(ctx);
      else if (activeApp.icon === "social") drawSocial(ctx);
      else if (activeApp.icon === "shop") drawShop(ctx);
      else if (activeApp.icon === "dev-centre") drawDevCentre(ctx);
      else if (activeApp.icon === "art") drawArt(ctx);
      else if (activeApp.icon === "apps") drawApps(ctx);
      else if (activeApp.icon === "archive") drawArchive(ctx);
      else if (activeApp.icon === "authenticator") drawAuthenticator(ctx);
      else if (activeApp.icon === "buddy") drawBuddy(ctx);
      else if (activeApp.icon === "installer") drawInstaller(ctx);
      else if (activeApp.icon === "map") drawMap(ctx);
      else if (activeApp.icon === "news") drawNews(ctx);
      else if (activeApp.icon === "search-console" || activeApp.icon === "search") drawSearch(ctx);
      else if (activeApp.icon === "sign") drawSign(ctx);
      else if (activeApp.icon === "stream") drawStream(ctx);
      else if (activeApp.icon === "tasks") drawTasks(ctx);
      else if (activeApp.icon === "weather") drawWeather(ctx);
      else if (activeApp.icon === "support") drawSupport(ctx);
      else if (activeApp.icon === "profile") drawProfile(ctx);
      else if (activeApp.icon === "about") drawAbout(ctx);
      else if (activeApp.icon === "ai-chat") drawAIChat(ctx);
      else if (activeApp.icon === "classroom") drawClassroom(ctx);
      else if (activeApp.icon === "meet") drawMeet(ctx);
      else if (activeApp.icon === "drive") drawDrive(ctx);
      else if (activeApp.icon === "whiteboard") drawWhiteboard(ctx);
      else if (activeApp.icon === "settings") drawSettings(ctx);
      else drawXakteirX(ctx);

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
