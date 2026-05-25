
"use client";

import { useState } from "react";
import { 
  GraduationCap, 
  Plus, 
  School, 
  User, 
  Baby, 
  Loader2, 
  PlusCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ClassroomRole = 'teacher' | 'student' | 'parent' | null;

export default function ClassroomPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: loadingProfile } = useDoc(userRef);

  const [newClassData, setNewClassData] = useState({ name: "", school: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const role: ClassroomRole = userData?.classroomRole || null;

  const handleCreateClass = async () => {
    if (!firestore || !user || isProcessing || !newClassData.name) return;
    setIsProcessing(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const docRef = await addDoc(collection(firestore, "classrooms"), {
        name: newClassData.name,
        school: newClassData.school,
        teacherId: user.uid,
        teacherName: user.displayName || "Teacher",
        joinCode: code,
        students: [],
        createdAt: serverTimestamp()
      });
      setActiveClassId(docRef.id);
      toast({ title: "Class Created!", description: `Join Code: ${code}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create class." });
    } finally {
      setIsProcessing(false);
    }
  };

  const setRole = async (selectedRole: ClassroomRole) => {
    if (!firestore || !user) return;
    await updateDoc(doc(firestore, "users", user.uid), { classroomRole: selectedRole });
  };

  if (loadingProfile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary" /></div>;

  if (!role) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center space-y-16 animate-fade-in px-6">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter text-white">Select Role</h1>
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Identify yourself in the classroom station.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: 'teacher', label: 'Teacher', icon: User },
            { id: 'student', label: 'Student', icon: School },
            { id: 'parent', label: 'Parent', icon: Baby }
          ].map(r => (
            <Card key={r.id} onClick={() => setRole(r.id as ClassroomRole)} className="p-12 glass-card rounded-[3rem] border-white/5 hover:border-primary transition-all cursor-pointer group">
              <r.icon className="w-12 h-12 mx-auto mb-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="text-2xl font-black uppercase italic">{r.label}</h3>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto py-10 space-y-12 animate-fade-in px-6 text-foreground">
      <header className="flex justify-between items-center glass-card p-10 rounded-[3rem] border-white/20 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center"><GraduationCap className="w-8 h-8 text-primary" /></div>
          <div><h1 className="text-5xl font-black uppercase italic tracking-tighter">{role.toUpperCase()} HUB</h1><p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1">Registry Operational</p></div>
        </div>
        <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase text-[10px]" onClick={() => setRole(null)}>Reset Role</Button>
      </header>

      {role === 'teacher' && !activeClassId && (
        <Card className="max-w-xl mx-auto glass-card rounded-[4rem] p-16 border-white/10 shadow-2xl space-y-10 bg-zinc-950">
           <h2 className="text-4xl font-black uppercase italic tracking-tighter text-center">New Class</h2>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">School Name</label>
                 <Input value={newClassData.school} onChange={(e) => setNewClassData({...newClassData, school: e.target.value})} placeholder="Xakteir High" className="bg-secondary/30 h-14 rounded-xl border-white/5" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Subject Name</label>
                 <Input value={newClassData.name} onChange={(e) => setNewClassData({...newClassData, name: e.target.value})} placeholder="Physics Node 4" className="bg-secondary/30 h-14 rounded-xl border-white/5" />
              </div>
              <Button onClick={handleCreateClass} disabled={isProcessing || !newClassData.name} className="w-full h-18 bg-primary rounded-3xl font-black uppercase text-lg shadow-xl">
                 {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : "Initialize Zone"}
              </Button>
           </div>
        </Card>
      )}

      {activeClassId && (
        <div className="text-center py-20 animate-in zoom-in-95 space-y-10">
           <div className="w-32 h-32 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center mx-auto shadow-2xl"><PlusCircle className="w-16 h-16 text-green-500" /></div>
           <h2 className="text-6xl font-black italic uppercase tracking-tighter">Zone Ready</h2>
           <p className="text-xl font-bold text-muted-foreground uppercase">Invite students with code:</p>
           <div className="p-10 bg-black/60 rounded-[3rem] border-4 border-primary/20 max-w-sm mx-auto shadow-2xl"><span className="text-8xl font-black text-white italic tracking-widest">{activeClassId.slice(0,6).toUpperCase()}</span></div>
           <Button onClick={() => window.location.reload()} className="h-16 px-16 bg-primary rounded-full font-black uppercase text-xs">Enter Dashboard</Button>
        </div>
      )}
    </div>
  );
}
