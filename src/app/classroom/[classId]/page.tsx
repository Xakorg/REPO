"use client";

import { useState, useMemo, useEffect, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, limit, doc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Bell, Megaphone, Send, Loader2 } from "lucide-react";

export default function ClassHomePage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);
  const classId = resolvedParams.classId;

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Fetch Class details
  const classRef = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return doc(firestore, "classrooms", classId);
  }, [firestore, classId]);
  const { data: classroom } = useDoc(classRef);

  // Fetch user role
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);
  const role = userData?.classroomRole || 'student';

  // Fetch class announcements
  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return query(collection(firestore, "classrooms", classId, "announcements"), orderBy("timestamp", "desc"), limit(20));
  }, [firestore, classId]);
  const { data: dbAnnouncements, isLoading: loadingAnnouncements } = useCollection(announcementsQuery);

  const announcements = useMemo(() => {
    return dbAnnouncements || [];
  }, [dbAnnouncements]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !announcementInput.trim()) return;

    try {
      const announcementsRef = collection(firestore, "classrooms", classId, "announcements");
      await addDocumentNonBlocking(announcementsRef, {
        authorId: user.uid,
        authorName: user.displayName || "Teacher",
        text: announcementInput.trim(),
        timestamp: serverTimestamp()
      });
      toast({ title: "Announcement Posted!", description: "Students will be notified." });
      setAnnouncementInput("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to post announcement." });
    }
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-300">
      {/* Left Area: Announcements feed */}
      <div className="lg:col-span-8 space-y-8">
        <header className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Stream Announcements</h2>
        </header>

        {role === 'teacher' && (
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <Textarea
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                placeholder="Share announcements or instructions with your class..."
                className="bg-zinc-900 border-white/5 rounded-xl text-xs font-bold text-white min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button type="submit" className="h-10 px-6 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest border-none">
                  <Send className="w-4 h-4 mr-2" /> Share Node
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-6">
          {loadingAnnouncements ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : announcements.length === 0 ? (
            <div className="py-20 text-center opacity-25 space-y-4 border border-dashed border-white/5 rounded-3xl">
              <Megaphone className="w-12 h-12 mx-auto text-primary animate-pulse" />
              <p className="text-sm font-black uppercase tracking-widest text-zinc-400">No announcements posted</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Your class stream is currently quiet.</p>
            </div>
          ) : announcements.map((ann: any) => (
            <Card key={ann.id} className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black uppercase text-base">
                  {ann.authorName[0]}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">@{ann.authorName}</div>
                  <div className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">
                    {ann.timestamp?.seconds ? new Date(ann.timestamp.seconds * 1000).toLocaleString() : 'Just Now'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-300 font-bold leading-relaxed italic mt-2">{ann.text}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Area: Sidebar stats */}
      <aside className="lg:col-span-4 space-y-8">
        <Card className="p-8 bg-zinc-950/40 border-4 border-white/10 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none"><Bell className="w-32 h-32" /></div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Class Information</h3>
          <div className="space-y-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Target Node ID</span>
              <p className="text-xs font-mono text-zinc-300 truncate mt-1">{classId}</p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Telemetry Status</span>
              <p className="text-xs font-bold text-green-500 uppercase mt-1">Active / Connected</p>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Assigned Role</span>
              <p className="text-xs font-bold text-primary uppercase mt-1">{role}</p>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
