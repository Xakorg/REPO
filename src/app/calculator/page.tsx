"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator as CalcIcon, 
  Delete, 
  Equal, 
  History,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CalculatorPage() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const handleInput = (val: string) => {
    setExpression((prev) => prev + val);
  };

  const calculate = () => {
    try {
      const sanitized = expression.replace(/[^-+*/0-9.]/g, '');
      if (!sanitized) return;
      const res = Function(`'use strict'; return (${sanitized})`)();
      const finalRes = res.toString();
      setResult(finalRes);
      if (expression && finalRes) {
        setHistory([`${expression} = ${finalRes}`, ...history].slice(0, 10));
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Invalid calculation logic." });
    }
  };

  const clear = () => {
    setExpression("");
    setResult("");
  };

  const backspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/[0-9]/.test(e.key)) handleInput(e.key);
      if (['+', '-', '*', '/'].includes(e.key)) handleInput(e.key);
      if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      if (e.key === 'Backspace') backspace();
      if (e.key === 'Escape') clear();
      if (e.key === '.') handleInput('.');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression]);

  useEffect(() => {
    if (expression.length > 0) {
      try {
        const lastChar = expression.slice(-1);
        if (/[0-9]/.test(lastChar)) {
          const sanitized = expression.replace(/[^-+*/0-9.]/g, '');
          const res = Function(`'use strict'; return (${sanitized})`)();
          setResult(res.toString());
        }
      } catch (e) {}
    } else {
      setResult("");
    }
  }, [expression]);

  return (
    <div className="max-w-[1400px] mx-auto py-12 animate-fade-in space-y-16 px-8 text-foreground pb-40">
      <header className="flex justify-between items-center border-b border-white/5 pb-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-xl">
            <CalcIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-white">Calculator</h1>
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-blue-400 mt-2 italic">Professional Logic Station</p>
          </div>
        </div>
        <Badge variant="outline" className="border-blue-500/20 text-blue-400 bg-blue-500/5 px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">Keyboard Active</Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <Card className="glass-card rounded-[4rem] border-4 border-white/10 overflow-hidden shadow-2xl bg-black/60 relative">
            <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
            <div className="p-12 space-y-10 relative z-10">
              <div className="space-y-4 text-right bg-zinc-950/60 p-10 rounded-[3rem] border-2 border-white/5 shadow-inner min-h-[160px] flex flex-col justify-center">
                <div className="h-10 text-muted-foreground font-black text-2xl uppercase tracking-widest overflow-hidden truncate italic opacity-40 pr-4">
                  {expression || "READY"}
                </div>
                <div className="h-24 text-7xl font-black text-white italic overflow-hidden truncate leading-none pr-4">
                  {result || "0"}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Button onClick={clear} className="h-20 rounded-[1.8rem] bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 font-black uppercase text-xl hover:bg-rose-500 hover:text-white transition-all">AC</Button>
                <Button onClick={backspace} className="h-20 rounded-[1.8rem] bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 font-black uppercase hover:bg-amber-500 hover:text-white transition-all"><Delete className="w-8 h-8" /></Button>
                <Button onClick={() => handleInput("/")} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-primary text-3xl font-black hover:bg-primary/20 transition-all">÷</Button>
                <Button onClick={() => handleInput("*")} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-primary text-3xl font-black hover:bg-primary/20 transition-all">×</Button>

                {[7, 8, 9].map(num => (
                  <Button key={num} onClick={() => handleInput(num.toString())} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-3xl font-black hover:bg-white/10 transition-all text-white">{num}</Button>
                ))}
                <Button onClick={() => handleInput("-")} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-primary text-3xl font-black hover:bg-primary/20 transition-all">−</Button>

                {[4, 5, 6].map(num => (
                  <Button key={num} onClick={() => handleInput(num.toString())} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-3xl font-black hover:bg-white/10 transition-all text-white">{num}</Button>
                ))}
                <Button onClick={() => handleInput("+")} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-primary text-3xl font-black hover:bg-primary/20 transition-all">+</Button>

                {[1, 2, 3].map(num => (
                  <Button key={num} onClick={() => handleInput(num.toString())} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-3xl font-black hover:bg-white/10 transition-all text-white">{num}</Button>
                ))}
                <Button onClick={calculate} className="h-44 row-span-2 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white shadow-2xl border-b-[12px] border-primary/20 active:border-b-0 active:translate-y-2 transition-all"><Equal className="w-12 h-12" /></Button>

                <Button onClick={() => handleInput("0")} className="h-20 col-span-2 rounded-[1.8rem] border-2 border-white/10 text-3xl font-black hover:bg-white/10 transition-all text-white">0</Button>
                <Button onClick={() => handleInput(".")} className="h-20 rounded-[1.8rem] border-2 border-white/10 text-3xl font-black hover:bg-white/10 transition-all text-white">.</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 flex flex-col h-full">
          <Card className="glass-card rounded-[4rem] p-12 border border-white/10 shadow-2xl bg-black/40 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4 text-primary"><History className="w-7 h-7" /> History</h3>
              <Button onClick={() => setHistory([])} variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-6 h-6" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {history.map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between animate-in slide-in-from-right-2">
                    <span className="text-lg font-bold text-muted-foreground italic">{item.split('=')[0]}</span>
                    <span className="text-2xl font-black text-primary italic">={item.split('=')[1]}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
