"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Bug, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from "lucide-react";

export default function XakCaptchaChallenge() {
  const searchParams = useSearchParams();
  const sitekey = searchParams.get("sitekey");
  const [icons, setIcons] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Generate 8 random bot/bug icons and 1 Xakteir Sparkles icon
    const iconTypes = [Bot, Bug, ShieldAlert, Cpu];
    let newIcons = Array(8).fill(null).map(() => ({
      Icon: iconTypes[Math.floor(Math.random() * iconTypes.length)],
      isTarget: false,
      id: Math.random().toString()
    }));
    
    // Add the target
    newIcons.push({ Icon: Sparkles, isTarget: true, id: "target" });
    
    // Shuffle
    newIcons.sort(() => Math.random() - 0.5);
    setIcons(newIcons);
  }, [failed]); // Re-roll on fail

  const handleClick = (isTarget: boolean) => {
    if (isTarget) {
      setSuccess(true);
      // Send success message to parent window with a mock verification token
      const token = "xak_token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      setTimeout(() => {
        window.opener?.postMessage({ type: 'XAKCAPTCHA_SUCCESS', token }, '*');
        window.close();
      }, 1500);
    } else {
      setFailed(true);
      setTimeout(() => setFailed(false), 1000);
    }
  };

  if (!sitekey) {
    return (
      <div className="min-h-screen bg-[#0a0a15] text-white flex items-center justify-center p-8 text-center font-black uppercase tracking-widest text-red-500">
        Missing Sitekey
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a15] text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm glass-card border-4 border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-20 h-20 text-emerald-400 mb-4" />
            <h2 className="text-2xl font-black uppercase tracking-tighter text-emerald-400">Verified</h2>
            <p className="text-xs text-muted-foreground mt-2 font-bold tracking-widest">You are human.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">XakCaptcha</h2>
              <p className="text-sm font-bold text-muted-foreground">Prove you are human by clicking the <strong className="text-primary">Sparkle</strong> icon among the bots.</p>
            </div>
            
            <div className={`grid grid-cols-3 gap-4 transition-opacity ${failed ? 'opacity-50 pointer-events-none' : ''}`}>
              {icons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.isTarget)}
                  className="aspect-square bg-white/5 border-2 border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all"
                >
                  <item.Icon className={`w-8 h-8 ${item.isTarget ? 'text-primary' : 'text-muted-foreground/50'}`} />
                </button>
              ))}
            </div>

            {failed && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm animate-in fade-in">
                <span className="text-2xl font-black uppercase tracking-widest text-red-500 drop-shadow-md">Incorrect</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-8 opacity-50 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Protected by Xakteir</span>
      </div>
    </div>
  );
}
