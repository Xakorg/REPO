"use client";

import { useState, useMemo, useEffect, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, updateDoc, arrayUnion, serverTimestamp, getDocs, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Loader2, 
  ClipboardList,
  Send,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
}

export default function ClassAssignmentsPage({
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Assignment publisher states
  const [asgTitle, setAsgTitle] = useState("");
  const [asgDesc, setAsgDesc] = useState("");
  const [asgPoints, setAsgPoints] = useState(100);
  const [asgDueDate, setAsgDueDate] = useState("");

  // Student submission states
  const [activeAsgIdForSubmit, setActiveAsgIdForSubmit] = useState<string | null>(null);
  const [submitContent, setSubmitContent] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Fetch user role
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);
  const role = userData?.classroomRole || 'student';

  // Query assignments for active classroom
  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return query(collection(firestore, "classrooms", classId, "assignments"), orderBy("createdAt", "desc"));
  }, [firestore, classId]);
  const { data: dbAssignments } = useCollection(assignmentsQuery);

  // Fallback demo assignments
  const fallbackAssignments: Assignment[] = useMemo(() => [
    {
      id: "demo-a1",
      title: "Quantum Architecture Shards Essay",
      description: "Analyze how microkernel designs handle multi-threaded telemetry streams in the Xakteir Hub. Write a 500-word summary.",
      dueDate: "2026-06-15",
      points: 100
    },
    {
      id: "demo-a2",
      title: "Neural Network Math Lab",
      description: "Solve backpropagation mathematical layers for nodes defined in Chapter 5. Upload your logic formulas.",
      dueDate: "2026-06-20",
      points: 50
    }
  ], []);

  const assignments = useMemo(() => {
    const list = dbAssignments || [];
    if (list.length === 0) return fallbackAssignments;
    return list as Assignment[];
  }, [dbAssignments, fallbackAssignments]);

  // Query my submissions for students
  const mySubmissionsQuery = useMemoFirebase(() => {
    if (!firestore || !classId || !user || role !== 'student') return null;
    return query(collection(firestore, "classrooms", classId, "submissions"), where("studentId", "==", user.uid));
  }, [firestore, classId, user, role]);
  const { data: dbMySubmissions } = useCollection(mySubmissionsQuery);

  const mySubmissions = useMemo(() => {
    return dbMySubmissions || [];
  }, [dbMySubmissions]);

  const handlePublishAssignment = async () => {
    if (!firestore || !classId || !asgTitle.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const assignmentsRef = collection(firestore, "classrooms", classId, "assignments");
      await addDocumentNonBlocking(assignmentsRef, {
        title: asgTitle,
        description: asgDesc,
        points: Number(asgPoints),
        dueDate: asgDueDate || format(new Date(), "yyyy-MM-dd"),
        createdAt: serverTimestamp()
      });
      toast({ title: "Assignment Published!", description: `"${asgTitle}" is live.` });
      setAsgTitle("");
      setAsgDesc("");
      setAsgPoints(100);
      setAsgDueDate("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to publish assignment." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!firestore || !classId || !user || !submitContent.trim() || !activeAsgIdForSubmit) return;
    try {
      const submissionsRef = collection(firestore, "classrooms", classId, "submissions");
      await addDocumentNonBlocking(submissionsRef, {
        assignmentId: activeAsgIdForSubmit,
        studentId: user.uid,
        studentName: user.displayName || "Student",
        content: submitContent,
        timestamp: serverTimestamp()
      });
      toast({ title: "Work Submitted!", description: "Your solution has been submitted." });
      setSubmitContent("");
      setActiveAsgIdForSubmit(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit work." });
    }
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-300">
      {/* Left Area: Assignment Feed */}
      <div className="lg:col-span-8 space-y-6">
        <header className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Class Assignments</h2>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Active assignments and project tasks</p>
        </header>

        {assignments.map((asg) => {
          const studentSub = mySubmissions.find(s => s.assignmentId === asg.id);
          return (
            <Card key={asg.id} className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-4 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{asg.title}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Due Date: {asg.dueDate} • Points: {asg.points}</p>
                </div>
                {studentSub && (
                  <Badge className="bg-emerald-600 border-none text-white font-black text-[9px] px-3 py-1 uppercase rounded-full">
                    {studentSub.grade ? `Graded: ${studentSub.grade}/${asg.points}` : "Submitted"}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-zinc-400 font-bold leading-relaxed italic">{asg.description}</p>
              
              {role === 'student' && !studentSub && (
                <div className="pt-4 border-t border-white/5">
                  {activeAsgIdForSubmit === asg.id ? (
                    <div className="space-y-4">
                      <Textarea 
                        value={submitContent} 
                        onChange={(e) => setSubmitContent(e.target.value)} 
                        placeholder="Type your submission content or upload link..." 
                        className="bg-zinc-900 border-white/5 rounded-xl text-xs font-bold text-white min-h-[100px]"
                      />
                      <div className="flex gap-3">
                        <Button onClick={handleSubmitAssignment} className="h-10 px-6 bg-primary text-white rounded-xl font-black uppercase text-[10px] border-none">
                          Submit Work
                        </Button>
                        <Button variant="ghost" onClick={() => setActiveAsgIdForSubmit(null)} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] text-zinc-500 hover:text-white">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => { setActiveAsgIdForSubmit(asg.id); setSubmitContent(""); }} className="h-10 px-6 bg-primary text-white rounded-xl font-black uppercase text-[10px] border-none">
                      <Send className="w-4 h-4 mr-2" /> Start Submission
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {assignments.length === 0 && (
          <div className="py-20 text-center opacity-20 space-y-6">
            <BookOpen className="w-16 h-16 mx-auto text-zinc-500" />
            <p className="text-sm font-black uppercase tracking-widest text-zinc-500">No active assignment nodes found.</p>
          </div>
        )}
      </div>

      {/* Right Area: Publisher (Teacher only) */}
      {role === 'teacher' && (
        <aside className="lg:col-span-4">
          <Card className="glass-card rounded-[3rem] p-10 border-4 border-white/10 bg-zinc-950/40 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Publish Assignment</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Title</label>
                <Input value={asgTitle} onChange={(e) => setAsgTitle(e.target.value)} placeholder="Homework Node 2" className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Instructions</label>
                <Textarea value={asgDesc} onChange={(e) => setAsgDesc(e.target.value)} placeholder="Provide task steps..." className="bg-zinc-900 border-white/5 rounded-xl text-xs font-bold text-white min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Max Score</label>
                  <Input type="number" value={asgPoints} onChange={(e) => setAsgPoints(Number(e.target.value))} className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Due Date</label>
                  <Input type="date" value={asgDueDate} onChange={(e) => setAsgDueDate(e.target.value)} className="bg-zinc-900 border-white/5 h-12 rounded-xl text-xs font-bold text-white" />
                </div>
              </div>
              <Button onClick={handlePublishAssignment} disabled={isProcessing || !asgTitle.trim()} className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest border-none mt-2">
                Publish Node
              </Button>
            </div>
          </Card>
        </aside>
      )}
    </div>
  );
}
