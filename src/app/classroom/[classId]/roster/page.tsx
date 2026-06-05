"use client";

import { useState, useEffect, use } from "react";
import { Card } from "@/components/ui/card";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Users as UsersIcon, BookOpen } from "lucide-react";

export default function ClassRosterPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);
  const classId = resolvedParams.classId;

  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch Class details
  const classRef = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return doc(firestore, "classrooms", classId);
  }, [firestore, classId]);
  const { data: classroom } = useDoc(classRef);

  if (!mounted) return null;

  const teacherName = classroom?.teacherName || "Instructor Alpha";
  const students = classroom?.students || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-300">
      {/* Instructor Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Class Instructor</h3>
        <Card className="p-8 bg-zinc-950/45 border-4 border-white/10 rounded-[3rem] shadow-xl flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black uppercase text-xl">
            {teacherName[0]}
          </div>
          <div>
            <div className="text-xl font-black text-white uppercase italic tracking-tight">{teacherName}</div>
            <div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mt-1">Class Architect Node</div>
          </div>
        </Card>
      </div>

      {/* Roster Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Students Roster ({students.length})</h3>
        <div className="space-y-3">
          {students.map((stuId: string, idx: number) => (
            <div key={stuId} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 font-bold uppercase">{idx + 1}</div>
              <div>
                <div className="font-bold text-white text-sm">Student Node</div>
                <div className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">ID: {stuId.slice(0, 8)}</div>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="py-20 text-center opacity-20 border border-dashed border-white/5 rounded-3xl space-y-4">
              <UsersIcon className="w-12 h-12 mx-auto text-zinc-500" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">No student nodes linked.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
