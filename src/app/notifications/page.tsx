"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Bell, 
  Trash2, 
  CheckCircle2, 
  UserPlus, 
  MessageSquare, 
  Zap, 
  Trophy, 
  Star, 
  Settings, 
  MoreVertical,
  ArrowRight,
  Loader2,
  Inbox,
  Filter,
  Flame,
  Globe,
  Radio
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICONS = {
  social: { icon: UserPlus, color: 'bg-blue-500/10 text-blue-500' },
  message: { icon: MessageSquare, color: 'bg-green-500/10 text-green-500' },
  quest: { icon: Zap, color: 'bg-amber-500/10 text-amber-500' },
  system: { icon: Star, color: 'bg-primary/10 text-primary' },
  broadcast: { icon: Radio, color: 'bg-rose-500/10 text-rose-500' },
};

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => { setMounted(true); }, []);

  const notifsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
  }, [firestore, user]);

  const globalQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "global_notifications"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
  }, [firestore]);

  const { data: userNotifs, isLoading: loadingUser } = useCollection(notifsQuery);
  const { data: globalNotifs, isLoading: loadingGlobal } = useCollection(globalQuery);

  const allNotifications = useMemo(() => {
    const combined = [
      ...(userNotifs || []),
      ...(globalNotifs || []).map(n => ({ ...n, type: 'broadcast', read: false, isGlobal: true }))
    ];
    return combined.sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [userNotifs, globalNotifs]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return allNotifications;
    return allNotifications.filter(n => n.type === activeFilter);
  }, [allNotifications, activeFilter]);

  const handleDelete = async (item: any) => {
    if (!firestore || !user || item.isGlobal) return;
    await deleteDoc(doc(firestore, "users", user.uid, "notifications", item.id));
    toast({ title: "Removed" });
  };

  const handleMarkRead = async (item: any) => {
    if (!firestore || !user || item.isGlobal) return;
    await updateDoc(doc(firestore, "users", user.uid, "notifications", item.id), {
      read: true
    });
  };

  if (!user) return <div className="p-32 text-center text-4xl font-black uppercase italic text-foreground">Sign in to view notifications!</div>;
  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-12 animate-fade-in px-6 text-foreground min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 bg-card/40 backdrop-blur-3xl p-12 rounded-[4rem] border-4 border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <Bell className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-8 mb-4">
            <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
              <Bell className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-7xl font-black text-foreground tracking-tighter uppercase italic leading-none">Notifications</h1>
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-4 flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" /> Protocol Feed Active
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 relative z-10">
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 font-black uppercase text-[10px] tracking-widest text-foreground hover:bg-white/10">Archive All</Button>
          <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground"><Settings className="w-6 h-6" /></Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3 space-y-4">
          {[
            { id: 'all', label: 'All Alerts', icon: Inbox },
            { id: 'broadcast', label: 'Hub Transmissions', icon: Radio },
            { id: 'social', label: 'Members', icon: UserPlus },
            { id: 'quest', label: 'Game Logic', icon: Zap },
            { id: 'system', label: 'System', icon: Globe },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl transition-all border-4 font-black uppercase text-[10px] tracking-widest",
                activeFilter === filter.id 
                  ? "bg-primary border-white/20 text-white shadow-xl scale-105" 
                  : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
              )}
            >
              <filter.icon className="w-5 h-5" />
              {filter.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-9">
          <Card className="glass-card rounded-[4rem] border-white/10 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
            <ScrollArea className="flex-1">
              <div className="divide-y divide-white/5">
                {(loadingUser || loadingGlobal) ? (
                  <div className="py-32 flex flex-col items-center justify-center space-y-6">
                    <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Syncing feed...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-40 text-center space-y-8 opacity-20">
                    <CheckCircle2 className="w-24 h-24 mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">Zero Alerts</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">You are all caught up</p>
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const typeConfig = TYPE_ICONS[notif.type as keyof typeof TYPE_ICONS] || TYPE_ICONS.system;
                    return (
                      <div 
                        key={notif.id} 
                        className={cn(
                          "p-8 hover:bg-white/5 transition-all group flex items-start justify-between gap-8",
                          (!notif.read && !notif.isGlobal) && "bg-primary/5"
                        )}
                        onClick={() => handleMarkRead(notif)}
                      >
                        <div className="flex gap-8">
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white/10 shadow-xl", typeConfig.color)}>
                            <typeConfig.icon className="w-7 h-7" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <h4 className="text-xl font-black uppercase italic text-foreground tracking-tight">{notif.title}</h4>
                              <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">{notif.timestamp?.seconds ? new Date(notif.timestamp.seconds * 1000).toLocaleTimeString() : '...'}</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed italic text-muted-foreground line-clamp-2 max-w-2xl">{notif.message}</p>
                            <div className="flex gap-4 pt-2">
                              <Badge className="bg-white/5 border-white/10 text-[8px] font-black uppercase px-3 py-1 text-muted-foreground">{notif.isGlobal ? 'Global Broadcast' : 'Protocol Active'}</Badge>
                              {(!notif.read && !notif.isGlobal) && <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase px-3 py-1 shadow-lg">New Unit</Badge>}
                            </div>
                          </div>
                        </div>
                        {!notif.isGlobal && (
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(notif); }} className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-5 h-5" /></Button>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-white/10"><ArrowRight className="w-5 h-5" /></Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
