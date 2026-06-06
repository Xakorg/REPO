"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Q = [
  { q: "What powers Xakteir?", a: ["AI Logic", "Magic", "Steam", "Hamsters"], c: 0 },
  { q: "Latest Hub Build?", a: ["v1.0", "v4.2.8", "v10.0", "Beta"], c: 1 }
];

export function TriviaGame({ onExit }: { onExit: () => void }) {
  const { toast } = useToast();
  const [curr, setCurr] = useState(0);
  const [score, setScore] = useState(0);

  const check = (i: number) => {
    if (i === Q[curr].c) setScore(s => s + 100);
    if (curr < Q.length - 1) setCurr(c => c + 1);
    else toast({ title: "Master Player!", description: `Score: ${score + (i === Q[curr].c ? 100 : 0)}` });
  };

  return (
    <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[4rem] border-4 border-blue-500/30 bg-background/90 max-w-md w-full relative">
      <div className="flex justify-between w-full items-center">
        <h2 className="text-3xl font-black italic uppercase">Hub_Master</h2>
        <Button size="icon" variant="ghost" onClick={onExit}><X className="w-8 h-8" /></Button>
      </div>
      <div className="text-center space-y-6">
        <Globe className="w-12 h-12 text-primary mx-auto" />
        <h3 className="text-xl font-bold italic">"{Q[curr].q}"</h3>
        <div className="grid grid-cols-1 gap-3">
          {Q[curr].a.map((opt, i) => (
            <Button key={i} onClick={() => check(i)} variant="outline" className="h-14 font-black uppercase">{opt}</Button>
          ))}
        </div>
      </div>
    </div>
  );
}
