"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Lock, 
  ShieldAlert, 
  ChevronLeft,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

export default function UpgradePage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");
  const hasAccess = isSuperAdmin || !!adminRole;

  // ENFORCED LOCK FOR ALL NON-ADMINS
  if (!isAdminLoading && !hasAccess) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden flex flex-col items-center justify-center p-6 text-foreground">
        <div className="mesh-background absolute inset-0 !opacity-100" />
        <div className="absolute inset-0 arcade-grid opacity-20 pointer-events-none" />

        <Card className="w-full max-w-2xl glass-card rounded-[4rem] p-12 md:p-24 border-8 border-white/20 shadow-[0_50px_150px_rgba(0,0,0,0.8)] relative z-10 text-center space-y-12 bg-black/40 backdrop-blur-3xl animate-in zoom-in-95 duration-700">
           <div className="space-y-8">
              <div className="relative w-full flex items-center justify-center mb-10 overflow-hidden py-10">
                 <div className="absolute inset-x-0 h-1 flex items-center justify-center opacity-30">
                    <div className="w-full h-8 flex gap-3 items-center justify-center">
                       {Array.from({ length: 20 }).map((_, i) => (
                         <div key={i} className="w-12 h-6 border-4 border-white rounded-full shrink-0 shadow-lg" />
                       ))}
                    </div>
                 </div>
                 <div className="relative">
                    <div className="absolute -inset-14 bg-rose-500/40 blur-[50px] animate-pulse rounded-full" />
                    <div className="w-40 h-40 rounded-[3rem] bg-black border-4 border-rose-500/40 flex flex-col items-center justify-center shadow-2xl relative z-10">
                       <Lock className="w-16 h-16 text-rose-500 mb-2" />
                       <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40">
                          <div className="w-2 h-3 bg-rose-500 rounded-full" />
                       </div>
                    </div>
                 </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">
                Access <br /> Restricted
              </h1>
              <p className="text-lg text-white/80 font-bold italic leading-relaxed opacity-90 max-w-md mx-auto">
                The Pricing station is currently undergoing a system-wide overhaul. 
                <br /><br />
                Subscriptions are currently disabled for all accounts.
              </p>
           </div>
           <div className="pt-6">
              <Link href="/">
                <Button className="h-20 px-16 bg-white text-black hover:bg-rose-500 hover:text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all border-b-8 border-zinc-200">
                   Return to Dashboard
                </Button>
              </Link>
           </div>
           <div className="flex flex-col items-center gap-2 opacity-40">
              <ShieldAlert className="w-6 h-6 text-white" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">System Restriction Protocol v4.2.8</p>
           </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-20 px-6 space-y-20 animate-fade-in text-foreground text-center">
       <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-800 border-4 border-white/10 flex items-center justify-center mx-auto shadow-2xl">
          <ShieldCheck className="w-16 h-16 text-primary" />
       </div>
       <h1 className="text-6xl font-black uppercase italic italic tracking-tighter">Admin Override Active</h1>
       <p className="text-muted-foreground font-bold">The Pricing unit is locked for standard members.</p>
       <Link href="/"><Button variant="outline" className="h-16 px-12 rounded-2xl">Return to Hub</Button></Link>
    </div>
  );
}
