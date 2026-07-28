"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  GraduationCap, 
  Plus, 
  School, 
  User, 
  Baby, 
  Loader2, 
  PlusCircle,
  ChevronRight,
  BookOpen,
  UserCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, updateDoc, arrayUnion, serverTimestamp, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ClassroomRole = 'teacher' | 'student' | 'parent' | null;

export default function ClassroomPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [newClassData, setNewClassData] = useState({ name: "", school: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Fetch User profile/role
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: loadingProfile } = useDoc(userRef);
  const role: ClassroomRole = userData?.classroomRole || null;

  // Query all classes owned by teacher
  const teacherClassesQuery = useMemoFirebase(() => {
    if (!firestore || !user || role !== 'teacher') return null;
    return query(collection(firestore, "classrooms"), where("teacherId", "==", user.uid));
  }, [firestore, user, role]);
  const { data: teacherClasses } = useCollection(teacherClassesQuery);

  // Query all classes joined by student
  const studentClassesQuery = useMemoFirebase(() => {
    if (!firestore || !user || role !== 'student') return null;
    return query(collection(firestore, "classrooms"), where("students", "array-contains", user.uid));
  }, [firestore, user, role]);
  const { data: studentClasses } = useCollection(studentClassesQuery);

  const handleCreateClass = async () => {
    if (!firestore || !user || isProcessing || !newClassData.name) return;
    setIsProcessing(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const classroomsRef = collection(firestore, "classrooms");
      await addDocumentNonBlocking(classroomsRef, {
        name: newClassData.name,
        school: newClassData.school,
        teacherId: user.uid,
        teacherName: user.displayName || "Teacher",
        joinCode: code,
        students: [],
        createdAt: serverTimestamp()
      });
      toast({ title: "Class Created!", description: `Classroom "${newClassData.name}" has been registered.` });
      setNewClassData({ name: "", school: "" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create class." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinClass = async () => {
    if (!firestore || !user || !joinCodeInput.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const classroomsRef = collection(firestore, "classrooms");
      const q = query(classroomsRef, where("joinCode", "==", joinCodeInput.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Code", description: "No class matches this join code." });
        setIsProcessing(false);
        return;
      }
      
      const classDoc = snap.docs[0];
      await updateDoc(doc(firestore, "classrooms", classDoc.id), {
        students: arrayUnion(user.uid)
      });
      
      toast({ title: "Class Joined!", description: `You have successfully entered ${classDoc.data().name}.` });
      window.location.href = `/classroom/${classDoc.id}`;
      setJoinCodeInput("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to join class." });
    } finally {
      setIsProcessing(false);
    }
  };

  const setRole = async (selectedRole: ClassroomRole) => {
    if (!firestore || !user) return;
    await updateDoc(doc(firestore, "users", user.uid), { classroomRole: selectedRole });
  };

  if (loadingProfile) return <div className="h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="animate-spin w-12 h-12 text-primary" /></div>;

  // Select Role Screen
  if (!role) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center space-y-16 animate-fade-in px-6">
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl animate-float">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter text-white">Select Hub Role</h1>
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Identify yourself in the classroom station.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: 'teacher', label: 'Teacher', icon: User, desc: "Create classes, publish assignments, grade student submissions." },
            { id: 'student', label: 'Student', icon: School, desc: "Join classes using code, submit assignment answers, view scores." },
            { id: 'parent', label: 'Parent', icon: Baby, desc: "Monitor student progress and class dashboard updates." }
          ].map(r => (
            <Card key={r.id} onClick={() => setRole(r.id as ClassroomRole)} className="p-10 bg-zinc-950/40 glass-card rounded-[3rem] border-4 border-white/10 hover:border-primary transition-all cursor-pointer group flex flex-col justify-between">
              <div>
                <r.icon className="w-12 h-12 mx-auto mb-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="text-2xl font-black uppercase italic text-white">{r.label}</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed italic mt-4">{r.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-10 space-y-10 animate-fade-in px-6 text-foreground pb-20">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden bg-black/40">
        <div className="absolute top-0 right-0 p-10 opacity-5"><School className="w-64 h-64 -rotate-12 text-primary" /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Xakteir Classroom</h1>
            <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Portal Role: {role.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase text-[10px] bg-white/5 border-white/10" onClick={() => setRole(null)}>
            Reset Role
          </Button>
        </div>
      </header>

      {/* Main Selector Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Classes List */}
        <div className="lg:col-span-7 space-y-8">
          <header className="space-y-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">My Active Classes</h2>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Select a class to open its workspace</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {role === 'teacher' && teacherClasses?.map(c => (
              <Card 
                key={c.id} 
                onClick={() => window.location.href = `/classroom/${c.id}`}
                className="glass-card p-8 border-4 border-white/10 hover:border-primary/50 transition-all rounded-[2.5rem] bg-zinc-950/40 cursor-pointer flex flex-col justify-between group h-60"
              >
                <div>
                  <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-black uppercase tracking-widest rounded-full">
                    School: {c.school || 'Unspecified'}
                  </span>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white group-hover:text-primary transition-colors mt-4">{c.name}</h3>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  <span>Code: {c.joinCode}</span>
                  <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-2 transition-transform" />
                </div>
              </Card>
            ))}

            {role === 'student' && studentClasses?.map(c => (
              <Card 
                key={c.id} 
                onClick={() => window.location.href = `/classroom/${c.id}`}
                className="glass-card p-8 border-4 border-white/10 hover:border-primary/50 transition-all rounded-[2.5rem] bg-zinc-950/40 cursor-pointer flex flex-col justify-between group h-60"
              >
                <div>
                  <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[8px] font-black uppercase tracking-widest rounded-full">
                    Instructor: {c.teacherName}
                  </span>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white group-hover:text-primary transition-colors mt-4">{c.name}</h3>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                  <span>School: {c.school}</span>
                  <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-2 transition-transform" />
                </div>
              </Card>
            ))}

            {((role === 'teacher' && !teacherClasses?.length) || (role === 'student' && !studentClasses?.length)) && (
              <div className="col-span-2 py-20 text-center opacity-20 space-y-6">
                <BookOpen className="w-16 h-16 mx-auto text-zinc-500" />
                <p className="text-sm font-black uppercase tracking-widest text-zinc-500">No active classrooms initialized.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Action Box */}
        <aside className="lg:col-span-5 space-y-8">
          {role === 'teacher' && (
            <Card className="glass-card rounded-[3rem] p-10 border-4 border-white/10 bg-zinc-950/40 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <PlusCircle className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Initialize New Class</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider ml-1">School / Academy</label>
                  <Input value={newClassData.school} onChange={(e) => setNewClassData({...newClassData, school: e.target.value})} placeholder="Xakteir High" className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider ml-1">Class / Subject Name</label>
                  <Input value={newClassData.name} onChange={(e) => setNewClassData({...newClassData, name: e.target.value})} placeholder="Physics Class 4" className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold text-white" />
                </div>
                <Button onClick={handleCreateClass} disabled={isProcessing || !newClassData.name} className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest border-none mt-2">
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : "Deploy Class Zone"}
                </Button>
              </div>
            </Card>
          )}

          {role === 'student' && (
            <Card className="glass-card rounded-[3rem] p-10 border-4 border-white/10 bg-zinc-950/40 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <PlusCircle className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Join Class Code</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider ml-1">Class Code</label>
                  <Input value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="Type 6-digit code..." className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-white" />
                </div>
                <Button onClick={handleJoinClass} disabled={isProcessing || !joinCodeInput.trim()} className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest border-none mt-2">
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : "Enter Class Zone"}
                </Button>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
