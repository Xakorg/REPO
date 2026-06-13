"use client";

import { useState, useMemo, useEffect, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Loader2, 
  BookOpen
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
}

export default function ClassSubmissionsPage({
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
  const [activeSubForGrading, setActiveSubForGrading] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Fetch Class details & Assignments
  const assignmentsQuery = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return query(collection(firestore, "classrooms", classId, "assignments"));
  }, [firestore, classId]);
  const { data: assignments } = useCollection(assignmentsQuery);

  // Fetch user role
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);
  const role = userData?.classroomRole || 'student';

  // Query student submissions
  const submissionsQuery = useMemoFirebase(() => {
    if (!firestore || !classId || role !== 'teacher') return null;
    return query(collection(firestore, "classrooms", classId, "submissions"), orderBy("timestamp", "desc"));
  }, [firestore, classId, role]);
  const { data: dbSubmissions, isLoading: loadingSubmissions } = useCollection(submissionsQuery);

  const submissions = useMemo(() => {
    return dbSubmissions || [];
  }, [dbSubmissions]);

  const handleGradeSubmission = async () => {
    if (!firestore || !classId || !activeSubForGrading || !gradeInput.trim()) return;
    try {
      const subRef = doc(firestore, "classrooms", classId, "submissions", activeSubForGrading.id);
      await updateDoc(subRef, {
        grade: gradeInput,
        gradedAt: serverTimestamp()
      });
      toast({ title: "Grade Registered!", description: `Score of ${gradeInput} saved.` });
      setGradeInput("");
      setActiveSubForGrading(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save grade." });
    }
  };

  if (!mounted) return null;

  if (role !== 'teacher') {
    return (
      <div className="py-20 text-center text-rose-500 font-black uppercase tracking-widest text-sm">
        Access Denied. Teacher authorization required.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="space-y-1">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Submitted Student Work</h2>
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Evaluate and register scores for class nodes</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Area: Submissions List */}
        <div className="lg:col-span-8 space-y-6">
          {loadingSubmissions ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : submissions.map((sub: any) => {
            const matchedAsg = assignments?.find(a => a.id === sub.assignmentId);
            return (
              <Card key={sub.id} className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-4 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest italic">{matchedAsg?.title || "Class Assignment"}</span>
                    <h4 className="text-xl font-black uppercase italic tracking-tight text-white mt-1">Submitted by: @{sub.studentName}</h4>
                  </div>
                  {sub.grade ? (
                    <Badge className="bg-emerald-600 border-none text-white font-black text-[9px] px-3 py-1 uppercase rounded-full">
                      Graded: {sub.grade}/{matchedAsg?.points || 100}
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-600 border-none text-white font-black text-[9px] px-3 py-1 uppercase rounded-full">
                      Needs Grading
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-zinc-300 font-bold leading-relaxed italic bg-zinc-950/45 p-6 rounded-2xl border border-white/5">{sub.content}</p>

                {!sub.grade && (
                  <div className="pt-2">
                    {activeSubForGrading?.id === sub.id ? (
                      <div className="flex items-center gap-3">
                        <Input 
                          value={gradeInput} 
                          onChange={(e) => setGradeInput(e.target.value)} 
                          placeholder="Enter score (e.g. 90)..." 
                          className="bg-zinc-900 border-white/5 h-10 rounded-xl text-xs font-bold w-48 text-white"
                        />
                        <Button onClick={handleGradeSubmission} className="h-10 px-6 bg-primary text-white rounded-xl font-black uppercase text-[10px] border-none">
                          Submit Score
                        </Button>
                        <Button variant="ghost" onClick={() => setActiveSubForGrading(null)} className="h-10 px-6 rounded-xl font-black uppercase text-[10px] text-zinc-500 hover:text-white">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => { setActiveSubForGrading(sub); setGradeInput(""); }} className="h-10 px-6 bg-primary text-white rounded-xl font-black uppercase text-[10px] border-none">
                        <Award className="w-4 h-4 mr-2" /> Grade Work
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          {submissions.length === 0 && !loadingSubmissions && (
            <div className="py-20 text-center opacity-20 border border-dashed border-white/5 rounded-3xl space-y-6">
              <BookOpen className="w-16 h-16 mx-auto text-zinc-500" />
              <p className="text-sm font-black uppercase tracking-widest text-zinc-500">No submission files received.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
