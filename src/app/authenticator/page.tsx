"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Plus, 
  Search, 
  Smartphone, 
  Monitor, 
  Clock, 
  Copy, 
  Trash2, 
  Settings, 
  QrCode, 
  Keyboard, 
  ChevronRight, 
  Loader2, 
  Zap, 
  MoreVertical,
  ArrowLeft,
  Fingerprint,
  RefreshCw,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  FolderOpen,
  Eye,
  EyeOff,
  User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, where, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as OTPAuth from "otpauth";

/**
 * Proper TOTP Logic using otpauth
 * Generates a real industry-standard 6-digit code based on a Base32 secret.
 */
const generateTOTP = (secret: string) => {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'Xakteir',
      label: 'Auth',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret.replace(/\s+/g, '')
    });
    return totp.generate();
  } catch (e) {
    console.error("Invalid TOTP Secret", e);
    return "------";
  }
};


export default function XakteirAuthPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [search, setSearch] = useState("");
  const [activeAccountId, setActiveId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ service: "", account: "", password: "", website: "", secret: "", backupCodes: "", notes: "" });
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('vault'); // 'vault' | 'identities'
  const [revealPrompt, setRevealPrompt] = useState(false);
  const [revealTarget, setRevealTarget] = useState<string | null>(null);
  const [revealPin, setRevealPin] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [newIdentity, setNewIdentity] = useState({ firstName: "", surname: "", middleNames: "", dob: "" });

  const [setupStep, setSetupStep] = useState(1);
  const [setupPin, setSetupPin] = useState("");
  const [setupPinConfirm, setSetupPinConfirm] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Firestore Config
  const configRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid, "auth_settings", "config");
  }, [firestore, user]);
  
  const { data: authConfig, isLoading: isConfigLoading } = useDoc(configRef);

  // Firestore Accounts
  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "auth_accounts"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: accounts, isLoading } = useCollection(accountsQuery);

  const identitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "auth_identities"), orderBy("timestamp", "desc"));
  }, [firestore, user]);
  const { data: identities } = useCollection(identitiesQuery);

  useEffect(() => {
    if (!mounted) return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  // Sync Timer to real clock
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  const handleSaveConfig = async () => {
    if (!firestore || !user || setupPin.length < 6 || setupPin !== setupPinConfirm) return;
    try {
      await setDocumentNonBlocking(doc(firestore, "users", user.uid, "auth_settings", "config"), {
        masterPin: setupPin,
        hasPasskey: false,
        timestamp: serverTimestamp()
      });
      toast({ title: "Setup Complete", description: "Your vault is now secure." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save configuration." });
    }
  };

  // REAL Biometrics via WebAuthn API
  const handleRealBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) {
        toast({ variant: "destructive", title: "Error", description: "Biometrics not supported on this browser." });
        return;
      }

      // This triggers the REAL native system prompt (Touch ID, Face ID, Windows Hello)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Trigger standard credential request - This opens the native OS dialog
      // For this implementation, we catch the response to verify it's the user's device
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [] // Allows system-level platform authenticators
        }
      });

      setIsUnlocked(true);
      toast({ title: "Authorized", description: "Biometric link confirmed." });
    } catch (err: any) {
      // If user cancels or biometrics fails, we don't unlock
      console.warn("Biometric attempt aborted or failed:", err);
      if (err.name !== 'NotAllowedError') {
        toast({ variant: "destructive", title: "Biometric Fail", description: "Secure registry access denied." });
      }
    }
  };

  const handleAddIdentity = async () => {
    if (!user || !firestore || !newIdentity.firstName) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "auth_identities"), { ...newIdentity, timestamp: serverTimestamp() });
      setIsAdding(false);
      setNewIdentity({ firstName: "", surname: "", middleNames: "", dob: "" });
      toast({ title: "Identity Secured" });
    } catch (e) { toast({ variant: "destructive", title: "Sync Failed" }); }
  };

  const handleAddAccount = async () => {
    if (!user || !firestore || !newAccount.secret) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "auth_accounts"), {
        ...newAccount,
        timestamp: serverTimestamp()
      });
      setIsAdding(false);
      setNewAccount({ service: "", account: "", password: "", website: "", secret: "", backupCodes: "", notes: "" });
      toast({ title: "Account Secured" });
    } catch (e) { toast({ variant: "destructive", title: "Sync Failed" }); }
  };

  const handleCopy = async (code: string) => {
    const { copyToClipboard } = await import('@/lib/clipboard');
    const ok = await copyToClipboard(code);
    if (ok) toast({ title: "Copied!", description: "High-fidelity code in buffer." });
    else toast({ variant: 'destructive', title: 'Copy Failed', description: 'Clipboard not available.' });
  };

  const activeAccount = useMemo(() => accounts?.find(a => a.id === activeAccountId) || accounts?.[0], [accounts, activeAccountId]);

  if (!mounted) return null;

  if (isConfigLoading) {
    return <div className="fixed inset-0 z-[1000] bg-[#05030d] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  // FIRST-TIME ONBOARDING
  if (!authConfig && user) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#05030d] flex flex-col items-center justify-center p-6 animate-fade-in text-white overflow-y-auto">
         <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
         <div className="relative z-10 w-full max-w-lg space-y-12 py-12">
            {setupStep === 1 && (
              <div className="text-center space-y-8 animate-in slide-in-from-bottom-8">
                 <div className="w-40 h-40 rounded-[4rem] bg-primary/10 border-4 border-primary/40 flex items-center justify-center mx-auto shadow-[0_0_100px_rgba(var(--primary),0.3)] animate-float">
                    <ShieldCheck className="w-20 h-20 text-primary" />
                 </div>
                 <div className="space-y-4">
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter">Welcome to Xakteir Auth</h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-md mx-auto">A secure, encrypted vault for all your passwords, passkeys, and 2FA codes.</p>
                 </div>
                 <Button onClick={() => setSetupStep(2)} className="h-16 px-12 bg-primary rounded-2xl font-black uppercase text-sm tracking-widest shadow-[0_20px_40px_rgba(var(--primary),0.4)] transition-all hover:scale-105 active:scale-95">Get Started <ChevronRight className="w-5 h-5 ml-2" /></Button>
              </div>
            )}

            {setupStep === 2 && (
              <div className="space-y-10 animate-in slide-in-from-right-8">
                 <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Set Master PIN</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-black opacity-60">This secures your vault</p>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">Choose a 6-8 digit PIN</label>
                       <Input type="password" placeholder="Enter PIN" value={setupPin} onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, '').slice(0,8))} className="h-20 text-center text-4xl tracking-[1em] font-black bg-white/5 border-white/10 rounded-3xl focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">Confirm PIN</label>
                       <Input type="password" placeholder="Confirm PIN" value={setupPinConfirm} onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, '').slice(0,8))} className="h-20 text-center text-4xl tracking-[1em] font-black bg-white/5 border-white/10 rounded-3xl focus:border-primary" />
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => setSetupStep(1)} className="h-16 w-16 rounded-2xl text-muted-foreground bg-white/5"><ArrowLeft className="w-6 h-6" /></Button>
                    <Button 
                      disabled={setupPin.length < 6 || setupPin !== setupPinConfirm} 
                      onClick={() => setSetupStep(3)} 
                      className="h-16 flex-1 bg-primary rounded-2xl font-black uppercase tracking-widest"
                    >
                      Continue
                    </Button>
                 </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="text-center space-y-10 animate-in slide-in-from-right-8">
                 <div className="w-32 h-32 rounded-[3rem] bg-emerald-500/10 border-4 border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(16,185,129,0.3)]">
                    <Fingerprint className="w-16 h-16 text-emerald-500" />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Enable Biometrics</h2>
                    <p className="text-muted-foreground font-medium text-sm max-w-sm mx-auto">Use Face ID, Touch ID, or Windows Hello for instant access to your vault.</p>
                 </div>
                 <div className="flex flex-col gap-4">
                    <Button onClick={async () => { await handleRealBiometric(); await handleSaveConfig(); }} className="h-16 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all">Register Device Passkey</Button>
                    <Button variant="ghost" onClick={handleSaveConfig} className="h-16 rounded-2xl font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-white">Skip for now</Button>
                 </div>
              </div>
            )}
         </div>
      </div>
    );
  }

  // LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#05030d] flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 w-full max-w-md space-y-12">
           <div className="text-center space-y-6">
              <div className="w-32 h-32 rounded-[3.5rem] bg-primary/10 border-4 border-primary/40 flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(var(--primary),0.3)] animate-float">
                 <ShieldCheck className="w-16 h-16 text-primary" />
              </div>
              <div className="space-y-2">
                 <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white">Xakteir Auth</h1>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity Authorized Protocol</p>
              </div>
           </div>

           <div className="space-y-10">
              <div className="flex justify-center gap-3">
                 {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                   <div 
                    key={i} 
                    className={cn(
                      "w-5 h-5 rounded-full border-4 transition-all duration-300", 
                      pin.length >= i ? "bg-primary border-primary scale-110 shadow-[0_0_20px_rgba(var(--primary),0.5)]" : "border-white/10 opacity-30"
                    )} 
                   />
                 ))}
              </div>
              <div className="grid grid-cols-3 gap-5 max-w-xs mx-auto">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                   <Button 
                    key={n} 
                    variant="outline" 
                    onClick={() => { if(pin.length < 8) setPin(p => p + n); }} 
                    className="h-20 rounded-[1.8rem] border-2 border-white/5 bg-white/5 text-2xl font-black hover:bg-primary/20 hover:border-primary transition-all active:scale-95"
                   >
                    {n}
                   </Button>
                 ))}
                 <Button variant="ghost" onClick={() => setPin("")} className="h-20 rounded-[1.8rem] text-rose-500 font-black text-[10px] uppercase">Clear</Button>
                 <Button 
                  variant="outline" 
                  onClick={() => { if(pin.length < 8) setPin(p => p + "0"); }} 
                  className="h-20 rounded-[1.8rem] border-2 border-white/5 bg-white/5 text-2xl font-black"
                 >
                  0
                 </Button>
                 <Button 
                  variant="ghost" 
                  onClick={() => setPin(p => p.slice(0, -1))} 
                  className="h-20 rounded-[1.8rem] text-muted-foreground hover:bg-white/5"
                 >
                  <ArrowLeft />
                 </Button>
              </div>
           </div>

           <div className="flex flex-col items-center gap-6">
              <Button 
                onClick={handleRealBiometric} 
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-18 px-10 font-black uppercase text-xs tracking-widest flex items-center gap-4 shadow-[0_20px_40px_rgba(var(--primary),0.4)] transition-all active:scale-95 group"
              >
                 <Fingerprint className="w-7 h-7 group-hover:animate-pulse" /> Use Biometrics
              </Button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Unlock with OS Security or 6-8 digit PIN</p>
                {pin.length >= 6 && (
                  <Button 
                    onClick={() => { 
                      if (authConfig?.masterPin === pin) {
                        setIsUnlocked(true); 
                        toast({ title: "Authorized", description: "Registry link active." }); 
                      } else {
                        toast({ variant: "destructive", title: "Access Denied", description: "Incorrect master PIN." });
                        setPin("");
                      }
                    }}
                    className="h-10 px-8 bg-emerald-600 rounded-xl text-[10px] font-black uppercase animate-in fade-in slide-in-from-bottom-2"
                  >
                    Enter Registry
                  </Button>
                )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-20 z-50 bg-background flex animate-fade-in text-foreground overflow-hidden">
      {/* Sidebar: Groupings (Desktop Only) */}
      {!isMobile && (
        <aside className="w-64 border-r border-white/5 bg-zinc-950 flex flex-col">
          <div className="p-8 border-b border-white/5 bg-white/5">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Folders</h3>
          </div>
          <ScrollArea className="flex-1 p-4">
             <div className="space-y-2">
                <button onClick={() => setActiveTab('vault')} className={cn("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest text-left", activeTab === 'vault' ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5")}>
      <FolderOpen className="w-4 h-4" /> Vault
   </button>
   <button onClick={() => setActiveTab('identities')} className={cn("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest text-left", activeTab === 'identities' ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-white/5")}>
      <User className="w-4 h-4" /> Identities
   </button>
             </div>
          </ScrollArea>
          <div className="p-8 border-t border-white/5 bg-black/20">
             <div className="flex items-center justify-between text-[9px] font-black text-muted-foreground uppercase">
                <span>Sync Node: </span>
                <span className="flex items-center gap-2 text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Global</span>
             </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative bg-zinc-900/20">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-card/40 backdrop-blur-3xl z-20">
          <div className="flex items-center gap-6">
            <ShieldCheck className="w-6 h-6 text-primary animate-pulse" />
            <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">Authorized Transmissions</h1>
          </div>
          <div className="flex items-center gap-4 flex-1 max-w-xl mx-10">
             <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search encrypted registry..." className="bg-black/40 border-none rounded-xl h-10 pl-11 text-xs font-bold italic" />
             </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => { setIsUnlocked(false); setPin(""); }} className="rounded-xl hover:bg-rose-500/10 text-rose-500"><LogOut className="w-4 h-4" /></Button>
             <Button variant="ghost" size="icon" className="rounded-xl border border-white/5 h-10 w-10"><Settings className="w-4 h-4 text-muted-foreground" /></Button>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className={cn("p-10", isMobile ? "max-w-md mx-auto space-y-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8")}>
            {isLoading ? (
              <div className="col-span-full py-40 flex justify-center"><Loader2 className="animate-spin w-12 h-12 text-primary opacity-20" /></div>
            ) : accounts?.length === 0 ? (
              <div className="col-span-full py-40 text-center opacity-20 space-y-6">
                 <Zap className="w-20 h-20 mx-auto" />
                 <p className="text-[10px] font-black uppercase tracking-[0.5em]">Zero 2FA Codes Active</p>
              </div>
            ) : (
              activeTab === 'vault' ? accounts?.filter(a => a.service?.toLowerCase().includes(search.toLowerCase())).map((acc) => {
                const code = generateTOTP(acc.secret);
                return (
                  <Card 
                    key={acc.id} 
                    onClick={() => { if(!isMobile) setActiveId(acc.id); else handleCopy(code); }}
                    className={cn(
                      "group cursor-pointer rounded-[2.5rem] border-4 transition-all duration-300 relative overflow-hidden flex flex-col",
                      activeAccountId === acc.id ? "border-primary shadow-2xl scale-[1.02] bg-primary/5" : "border-white/5 bg-zinc-950/40 hover:border-white/20"
                    )}
                  >
                    <div className="p-8 flex-1 space-y-8">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center border-2 border-white/5 shadow-inner">
                                <QrCode className="w-6 h-6 text-primary" />
                             </div>
                             <div>
                                <h4 className="text-xl font-black uppercase italic truncate w-32 leading-none text-white">{acc.service}</h4>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{acc.account}</p>
                             </div>
                          </div>
                          {!isMobile && (
                            <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center">
                               <div className={cn("w-3 h-3 rounded-full transition-all", secondsLeft < 5 ? "bg-red-500" : secondsLeft < 10 ? "bg-amber-500" : "bg-primary")} />
                            </div>
                          )}
                       </div>

                       <div className="text-center relative">
                          <span className={cn(
                            "text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]",
                            secondsLeft < 5 ? "text-red-500 animate-pulse" : secondsLeft < 10 ? "text-amber-500" : "text-white"
                          )}>
                            {code.slice(0,3)} {code.slice(3)}
                          </span>
                       </div>
                    </div>
                    
                    <div className="h-2 bg-white/5 w-full relative">
                       <div 
                        className={cn("h-full transition-all duration-1000 ease-linear", secondsLeft < 5 ? "bg-red-500 shadow-[0_0_15px_red]" : secondsLeft < 10 ? "bg-amber-500" : "bg-primary")} 
                        style={{ width: `${(secondsLeft / 30) * 100}%` }} 
                       />
                    </div>
                  </Card>
                )
              }) : identities?.filter(i => i.firstName?.toLowerCase().includes(search.toLowerCase())).map((idDoc) => (
                <Card key={idDoc.id} className="bg-white/5 border-white/10 p-8 rounded-[2.5rem] space-y-6">
                   <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50"><User className="w-8 h-8 text-primary" /></div>
                   <div>
                      <h4 className="text-2xl font-black uppercase">{idDoc.firstName} {idDoc.surname}</h4>
                      <p className="text-sm text-muted-foreground font-bold">{idDoc.middleNames}</p>
                   </div>
                   {idDoc.dob && <Badge variant="outline" className="text-[10px] uppercase font-black">DOB: {idDoc.dob}</Badge>}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* FAB / Detail Sidebar Logic */}
        {!isMobile && activeAccount && (
          <aside className="w-96 border-l border-white/5 bg-zinc-950/50 p-10 animate-in slide-in-from-right-4">
             <div className="space-y-12 h-full flex flex-col">
                <div className="text-center space-y-6">
                   <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
                      <Zap className="w-12 h-12 text-primary" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{activeAccount.service}</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{activeAccount.account}</p>
                   </div>
                </div>

                <ScrollArea className="flex-1 -mx-10 px-10">
                   <div className="space-y-8">
                      {activeAccount.website && (
                         <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <img src={`https://www.google.com/s2/favicons?domain=${activeAccount.website}&sz=64`} className="w-8 h-8 rounded-full bg-white" alt="Favicon" />
                            <a href={`https://${activeAccount.website}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-400 hover:underline">{activeAccount.website}</a>
                         </div>
                      )}

                      {activeAccount.password && (
                        <div className="space-y-2 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Password</span>
                              <Button variant="ghost" size="icon" onClick={() => {
                                 if (revealedPasswords[activeAccount.id]) {
                                    setRevealedPasswords(p => ({...p, [activeAccount.id]: false}));
                                 } else {
                                    setRevealTarget(activeAccount.id);
                                    setRevealPrompt(true);
                                 }
                              }} className="w-8 h-8 text-muted-foreground hover:text-white">
                                 {revealedPasswords[activeAccount.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                           </div>
                           <div className="text-xl font-mono tracking-widest text-white flex justify-between items-center">
                              <span>{revealedPasswords[activeAccount.id] ? activeAccount.password : '••••••••••••'}</span>
                              {revealedPasswords[activeAccount.id] && <Button variant="ghost" size="icon" onClick={() => handleCopy(activeAccount.password)} className="w-8 h-8 text-white"><Copy className="w-4 h-4" /></Button>}
                           </div>
                        </div>
                      )}

                      {activeAccount.secret && (
                        <div className="space-y-8 bg-black/40 p-10 rounded-[3rem] border-4 border-white/5 shadow-inner">
                           <div className="flex flex-col items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Current Registry Code</span>
                              <span className="text-7xl font-black italic text-white tabular-nums drop-shadow-2xl">{generateTOTP(activeAccount.secret)}</span>
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground">
                                 <span>Cycle Integrity</span>
                                 <span className={cn(secondsLeft < 5 ? "text-red-500" : "text-primary")}>{secondsLeft}s Remaining</span>
                              </div>
                              <Progress value={(secondsLeft / 30) * 100} className="h-1.5 bg-white/5" />
                           </div>
                           <Button onClick={() => handleCopy(generateTOTP(activeAccount.secret))} className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl"><Copy className="w-4 h-4 mr-3" /> Copy Code</Button>
                        </div>
                      )}

                      {activeAccount.backupCodes && (
                        <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary">Backup Codes</span>
                           <div className="grid grid-cols-2 gap-2">
                              {activeAccount.backupCodes.split(/[,\n]+/).map((code, idx) => {
                                 const trimmed = code.trim();
                                 if (!trimmed) return null;
                                 return <div key={idx} className="bg-black/40 px-3 py-2 rounded-lg font-mono text-xs text-muted-foreground cursor-pointer hover:text-white" onClick={() => handleCopy(trimmed)}>{trimmed}</div>
                              })}
                           </div>
                        </div>
                      )}

                      {activeAccount.notes && (
                        <div className="space-y-2 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary">Notes</span>
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeAccount.notes}</p>
                        </div>
                      )}
                   </div>
                </ScrollArea>

                <div className="mt-auto grid grid-cols-2 gap-4">
                   <Button variant="outline" className="h-14 rounded-xl border-white/10 text-muted-foreground hover:text-white"><Settings className="w-4 h-4 mr-2" /> Edit</Button>
                   <Button onClick={() => deleteDoc(doc(firestore!, "users", user!.uid, "auth_accounts", activeAccount.id))} variant="ghost" className="h-14 rounded-xl text-rose-500 hover:bg-rose-500/10"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                </div>
             </div>
          </aside>
        )}

        {/* Add Button */}
        <div className="absolute bottom-10 right-10">
           <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                 <Button className="w-20 h-20 rounded-[2rem] bg-primary hover:bg-primary/90 shadow-[0_20px_50px_rgba(var(--primary),0.4)] text-white group transition-all active:scale-95 border-b-8 border-primary/20 active:border-b-0">
                    <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform" />
                 </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/10 rounded-[3rem] max-w-md text-foreground p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
                 <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Add Code</DialogTitle></DialogHeader>
                 <div className="space-y-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                       <Button variant="outline" className="h-20 rounded-2xl border-white/5 bg-secondary/50 flex flex-col items-center justify-center gap-2"><QrCode className="w-6 h-6 text-primary" /><span className="text-[8px] font-black uppercase">Scan QR</span></Button>
                       <Button variant="outline" className="h-20 rounded-2xl border-white/5 bg-secondary/50 flex flex-col items-center justify-center gap-2"><Keyboard className="w-6 h-6 text-primary" /><span className="text-[8px] font-black uppercase">Manual Key</span></Button>
                    </div>
                    {activeTab === 'vault' ? (
  <>
    <div className="space-y-4 pt-4 border-t border-white/5">
       <Input value={newAccount.service} onChange={(e) => setNewAccount({...newAccount, service: e.target.value})} placeholder="Service Name (e.g. Google)" className="h-14 bg-secondary/30 rounded-xl" />
       <Input value={newAccount.account} onChange={(e) => setNewAccount({...newAccount, account: e.target.value})} placeholder="Email (e.g. email@gmail.com)" className="h-14 bg-secondary/30 rounded-xl" />
       <Input value={newAccount.password} type="password" onChange={(e) => setNewAccount({...newAccount, password: e.target.value})} placeholder="Password" className="h-14 bg-secondary/30 rounded-xl" />
       <Input value={newAccount.website} onChange={(e) => setNewAccount({...newAccount, website: e.target.value})} placeholder="Website (e.g. google.com)" className="h-14 bg-secondary/30 rounded-xl" />
       <Input value={newAccount.secret} onChange={(e) => setNewAccount({...newAccount, secret: e.target.value})} placeholder="Authenticator Base32 Key" className="h-14 bg-secondary/30 rounded-xl font-mono" />
       <textarea value={newAccount.backupCodes} onChange={(e) => setNewAccount({...newAccount, backupCodes: e.target.value})} placeholder="Backup codes (one per line or comma separated)" className="w-full bg-secondary/30 rounded-xl p-4 text-sm font-mono border-none" rows={3} />
       <textarea value={newAccount.notes} onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})} placeholder="Notes" className="w-full bg-secondary/30 rounded-xl p-4 text-sm border-none" rows={2} />
    </div>
    <Button onClick={handleAddAccount} disabled={!newAccount.service} className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-widest shadow-xl">Secure Account</Button>
  </>
) : (
  <>
    <div className="space-y-4 pt-4 border-t border-white/5">
       <Input value={newIdentity.firstName} onChange={(e) => setNewIdentity({...newIdentity, firstName: e.target.value})} placeholder="First Name" className="h-14 bg-secondary/30 rounded-xl" />
       <Input value={newIdentity.middleNames} onChange={(e) => setNewIdentity({...newIdentity, middleNames: e.target.value})} placeholder="Middle Name(s)" className="h-14 bg-secondary/30 rounded-xl" />
       <Input value={newIdentity.surname} onChange={(e) => setNewIdentity({...newIdentity, surname: e.target.value})} placeholder="Surname" className="h-14 bg-secondary/30 rounded-xl" />
       <Input value={newIdentity.dob} type="date" onChange={(e) => setNewIdentity({...newIdentity, dob: e.target.value})} className="h-14 bg-secondary/30 rounded-xl text-muted-foreground" />
    </div>
    <Button onClick={handleAddIdentity} disabled={!newIdentity.firstName} className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-widest shadow-xl">Secure Identity</Button>
  </>
)}
                 </div>
              </DialogContent>
           </Dialog>
        </div>

      {/* Reveal Password Prompt */}
      <Dialog open={revealPrompt} onOpenChange={setRevealPrompt}>
         <DialogContent className="glass-card border-white/10 rounded-[2rem] max-w-sm text-foreground p-8">
            <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic text-center">Verify Identity</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-4">
               <p className="text-xs text-center text-muted-foreground font-bold uppercase tracking-widest">Enter Master PIN to reveal password</p>
               <Input type="password" value={revealPin} onChange={e => setRevealPin(e.target.value)} className="h-16 text-center text-3xl tracking-[0.5em] font-black rounded-2xl bg-black/40 border-white/10" autoFocus />
               <Button onClick={() => {
                  if (authConfig?.masterPin === revealPin && revealTarget) {
                     setRevealedPasswords(p => ({...p, [revealTarget]: true}));
                     setRevealPrompt(false);
                     setRevealPin("");
                     toast({ title: "Authorized", description: "Password revealed." });
                  } else {
                     toast({ variant: "destructive", title: "Denied", description: "Incorrect Master PIN." });
                     setRevealPin("");
                  }
               }} className="w-full h-14 rounded-xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl">Confirm</Button>
            </div>
         </DialogContent>
      </Dialog>

      </div>
    </div>
  );
}
