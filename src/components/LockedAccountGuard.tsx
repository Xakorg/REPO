"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useAuth } from "@/firebase";
import { ShieldAlert, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

export function LockedAccountGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);

  if (!mounted) return null;

  if (user && userData?.isBanned) {
    if (userData.bannedUntil && Date.now() > userData.bannedUntil) {
      // Unban automatically if the time has passed
      return <>{children}</>;
    }

    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden flex flex-col items-center justify-center p-6 text-foreground">
        {/* VIBRANT COLOUR CHANGING BACKGROUND */}
        <div className="mesh-background absolute inset-0 !opacity-100" />
        <div className="absolute inset-0 arcade-grid opacity-20 pointer-events-none" />

        <Card className="w-full max-w-2xl glass-card rounded-[4rem] p-12 md:p-24 border-8 border-white/20 shadow-[0_50px_150px_rgba(0,0,0,0.8)] relative z-10 text-center space-y-12 bg-black/40 backdrop-blur-3xl animate-in zoom-in-95 duration-700">
           <div className="space-y-8">
              <div className="relative w-full flex items-center justify-center mb-10 overflow-hidden py-10">
                 {/* THE CHAIN */}
                 <div className="absolute inset-x-0 h-1 flex items-center justify-center opacity-30">
                    <div className="w-full h-8 flex gap-3 items-center justify-center">
                       {Array.from({ length: 20 }).map((_, i) => (
                         <div key={i} className="w-12 h-6 border-4 border-white rounded-full shrink-0 shadow-lg" />
                       ))}
                    </div>
                 </div>

                 {/* THE LOCK */}
                 <div className="relative">
                    <div className="absolute -inset-14 bg-rose-500/40 blur-[50px] animate-pulse rounded-full" />
                    <div className="w-40 h-40 rounded-[3rem] bg-black border-4 border-rose-500/40 flex flex-col items-center justify-center shadow-2xl relative z-10 transition-transform hover:scale-105 duration-700">
                       <Lock className="w-16 h-16 text-rose-500 mb-2" />
                       <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/40">
                          <div className="w-2 h-3 bg-rose-500 rounded-full" />
                       </div>
                    </div>
                 </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">
                your identity <br /> is locked ({userData.banReason || "Protocol Violation"})
              </h1>
              <p className="text-lg text-white/80 font-bold italic leading-relaxed opacity-90 max-w-md mx-auto">
                 Access to the Xakteir Hub has been terminated for this account. 
                 <br /><br />
                 {userData.bannedUntil ? (
                   <>
                     Your account will automatically unlock on:<br/>
                     <span className="text-rose-400 font-black">{new Date(userData.bannedUntil).toLocaleString()}</span>
                   </>
                 ) : (
                   "This ban is permanent."
                 )}
                 <br /><br />
                 If you believe this is an error, contact a Hub Administrator immediately.
              </p>
           </div>

           <div className="pt-6">
              <Button 
                onClick={() => auth && signOut(auth)}
                className="h-20 px-16 bg-white text-black hover:bg-rose-500 hover:text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all active:scale-95 border-b-8 border-zinc-200 hover:border-rose-900 active:border-b-0"
              >
                 <LogOut className="w-6 h-6 mr-4" /> Terminate Link
              </Button>
           </div>

           <div className="flex flex-col items-center gap-2 opacity-40">
              <ShieldAlert className="w-6 h-6 text-white" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Registry Suspension Protocol v4.2.8</p>
           </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
