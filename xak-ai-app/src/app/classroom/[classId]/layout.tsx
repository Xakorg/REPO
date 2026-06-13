"use client";

import { ReactNode, useState, useEffect, use } from "react";
import { 
  GraduationCap, 
  Loader2, 
  School, 
  ArrowLeft,
  BookOpen
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function ClassroomLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);
  const classId = resolvedParams.classId;
  
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch Class details
  const classRef = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return doc(firestore, "classrooms", classId);
  }, [firestore, classId]);
  const { data: classroom, isLoading: loadingClass } = useDoc(classRef);

  // Fetch user role
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userRef);
  const role = userData?.classroomRole || 'student';

  if (!mounted) return null;

  if (loadingClass) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  // Fallback if class not found in Firestore (so defaults work)
  const isDemo = classId.startsWith("demo-") || !classroom;
  const className = classroom?.name || (classId.startsWith("demo-") ? "Physics Node 4" : "Virtual Classroom");
  const schoolName = classroom?.school || "Xakteir Academy";
  const teacherName = classroom?.teacherName || "Instructor Alpha";
  const joinCode = classroom?.joinCode || "984320";

  const tabs = [
    { name: "Class Home", href: `/classroom/${classId}` },
    { name: "Assignments", href: `/classroom/${classId}/assignments` },
    { name: "Roster", href: `/classroom/${classId}/roster` },
  ];

  if (role === 'teacher') {
    tabs.push({ name: "Submissions & Grading", href: `/classroom/${classId}/submissions` });
  }

  return (
    <div className="max-w-[1600px] mx-auto py-6 space-y-8 animate-fade-in px-4 text-foreground pb-20">
      {/* Return Button */}
      <div className="flex items-center justify-between">
        <Link href="/classroom">
          <Button variant="ghost" className="h-10 px-4 rounded-xl text-xs font-black uppercase text-zinc-400 hover:text-white flex items-center gap-2 bg-white/5 border border-white/5">
            <ArrowLeft className="w-4 h-4" /> Back to Classes
          </Button>
        </Link>
        {isDemo && (
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-full">
            Simulation Mode
          </span>
        )}
      </div>

      {/* Class Banner Card */}
      <Card className="p-8 bg-zinc-950/80 border-4 border-white/10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <School className="w-56 h-56 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="text-[10px] font-black text-primary uppercase tracking-widest italic">{schoolName}</div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white mt-1">{className}</h2>
          <div className="text-xs font-bold text-zinc-400 mt-2">Instructor: {teacherName}</div>
        </div>
        
        {role === 'teacher' && (
          <div className="px-6 py-3 bg-black/60 rounded-2xl border border-white/10 text-center shadow-md relative z-10">
            <div className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Class Join Code</div>
            <div className="text-3xl font-black text-primary italic tracking-widest mt-1">{joinCode}</div>
          </div>
        )}
      </Card>

      {/* Subroutes Navigation Bar */}
      <div className="flex bg-zinc-950 border border-white/5 rounded-2xl h-14 p-1 max-w-2xl overflow-x-auto no-scrollbar shadow-inner">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "rounded-xl px-6 h-full font-black uppercase text-[9px] tracking-widest transition-all",
                isActive ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Renders children sub-pages */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
