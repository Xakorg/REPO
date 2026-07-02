"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GlitchLogo } from "@/components/ui/glitch-logo";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, AtSign, ArrowRight, Sparkles, ShieldCheck, Chrome, HelpCircle, RefreshCw, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOffensive } from "@/lib/username";

type AuthStep = 'email' | 'password' | 'verify-2fa' | 'forgot' | 'terms' | 'google-username';

export default function AuthPage() {
  const { user: existingUser } = useUser();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<AuthStep>('email');
  
  // Wizard States
  const [wizardStep, setWizardStep] = useState(0);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [askLinkGmail, setAskLinkGmail] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

  const [usernameInput, setUsernameInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isAddAccount = pathname?.includes('/auth/add-acct');
  const { toast } = useToast();

  const saveToVault = (uid: string, provider: 'password' | 'google', userEmail: string, userPassword?: string) => {
    try {
      const vault = JSON.parse(localStorage.getItem('xakteir_vault') || '{}');
      vault[uid] = { provider, email: userEmail, password: userPassword };
      localStorage.setItem('xakteir_vault', JSON.stringify(vault));
    } catch (e) {}
  };
  
  useEffect(() => {
    setMounted(true);
    const prefilledEmail = searchParams?.get('email');
    if (prefilledEmail) {
      setEmail(prefilledEmail);
      setActiveTab('signin');
    }
  }, [searchParams]);

  useEffect(() => {
    if (existingUser && !showAnimation && !isAddAccount) {
      const source = searchParams?.get("source");
      router.push(source ? `/${source}` : "/");
    }
  }, [existingUser, router, showAnimation, isAddAccount, searchParams]);

  useEffect(() => {
    let isMounted = true;
    if (existingUser && step !== 'verify-2fa' && !showAnimation && !isAddAccount) {
      existingUser.getIdToken().then(idToken => {
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        }).then(() => {
          if (isMounted) {
            const source = searchParams?.get("source");
            router.replace(source ? `/${source}` : "/");
          }
        }).catch(() => {
          if (isMounted) {
            const source = searchParams?.get("source");
            router.replace(source ? `/${source}` : "/");
          }
        });
      });
    }
    return () => { isMounted = false; };
  }, [existingUser, router, step, showAnimation, searchParams]);

  const handleGoogleAuth = () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (!userDoc.exists()) {
          setPendingGoogleUser(user);
          setStep('google-username');
          setIsLoading(false);
          return;
        }
        
        if (activeTab === 'signup') {
           saveToVault(user.uid, 'google', user.email || "");
           finishWizard();
        } else {
           saveToVault(user.uid, 'google', user.email || "");
           toast({ title: "Signed In", description: `Welcome, ${user.displayName}!` });
           finishWizard();
        }
      })
      .catch((error) => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Authentication Error", description: error.message });
      });
  };

  const handleGoogleSignupComplete = async () => {
    if (!pendingGoogleUser || !firestore) return;
    setIsLoading(true);
    
    const chosen = usernameInput.trim().toLowerCase();
    
    if (!chosen || chosen.length < 3) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Invalid", description: "Username must be at least 3 characters." });
      return;
    }

    if (isOffensive(chosen)) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Invalid", description: "Username not allowed." });
      return;
    }

    try {
      const q = query(collection(firestore, "users"), where("username", "==", chosen));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Username Taken", description: "That username is already in use." });
        return;
      }
    } catch (e) {}

    const finalEmail = `${chosen}@mail.xakteir.com`;
    const finalUsername = chosen;

    try {
      await updateProfile(pendingGoogleUser, { displayName: finalUsername });
      await setDoc(doc(firestore, "users", pendingGoogleUser.uid), {
        id: pendingGoogleUser.uid,
        username: finalUsername,
        email: pendingGoogleUser.email?.toLowerCase(),
        xakteirEmail: finalEmail,
        displayName: pendingGoogleUser.displayName || finalUsername,
        registrationDateTime: new Date().toISOString(),
        role: 'user',
        currencyBalance: 1000,
        agreedToTerms: true,
        twoFactorEnabled: false,
        isPublic: isPublic,
        photoURL: pendingGoogleUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${finalUsername}`
      });
      
      saveToVault(pendingGoogleUser.uid, 'google', pendingGoogleUser.email || "");
      finishWizard();
    } catch (e: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Signup Failed", description: e.message });
    }
  };

  const handleInitialAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    setIsLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        saveToVault(userCredential.user.uid, 'password', email, password);
        const userDoc = await getDoc(doc(firestore, "users", userCredential.user.uid));
        if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
          setStep('verify-2fa');
          setIsLoading(false);
          toast({ title: "Verification Required", description: "Please enter your security code." });
        } else {
          toast({ title: "Success", description: "You have been signed in." });
          finishWizard();
        }
      })
      .catch((error) => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Access Denied", description: "Incorrect email or password." });
      });
  };

  const finishWizard = () => {
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
      sessionStorage.setItem("start_onboarding", "true");
      const source = searchParams?.get("source");
      router.push(source ? `/${source}` : "/");
    }, 3000);
  };

  const handleSignup = async () => {
    if (!auth || !firestore) return;

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    const chosen = usernameInput.trim().toLowerCase();
    
    if (!chosen || chosen.length < 3) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Invalid", description: "Username must be at least 3 characters." });
      return;
    }

    if (isOffensive(chosen)) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Invalid", description: "Username not allowed." });
      return;
    }

    try {
      const q = query(collection(firestore, "users"), where("username", "==", chosen));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Username Taken", description: "That username is already in use." });
        return;
      }
    } catch (e) {}

    const finalEmail = `${chosen}@mail.xakteir.com`;

    createUserWithEmailAndPassword(auth, finalEmail, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const finalUsername = chosen;

        await updateProfile(user, { displayName: finalUsername });
        await setDoc(doc(firestore, "users", user.uid), {
          id: user.uid,
          username: finalUsername,
          email: finalEmail,
          xakteirEmail: finalEmail,
          displayName: finalUsername,
          registrationDateTime: new Date().toISOString(),
          role: 'user',
          currencyBalance: 1000,
          agreedToTerms: true,
          twoFactorEnabled: false,
          isPublic: isPublic,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${finalUsername}`
        });

        saveToVault(user.uid, 'password', finalEmail, password);
        finishWizard();
      })
      .catch((error) => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Signup Failed", description: error.message });
      });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) return;
    setIsLoading(true);
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setIsLoading(false);
        toast({ title: "Email Sent", description: "Check your inbox for a password reset link." });
        setStep('email');
      })
      .catch((error) => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Error", description: error.message });
      });
  };

  if (!mounted) return null;

  if (showAnimation) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden" style={{ animation: "fadeOut 1s ease-in-out 2s forwards" }}>
        <h1 className="text-[15rem] font-black italic uppercase tracking-tighter text-primary animate-pulse" style={{ animation: "zoomIn 2s ease-in-out forwards" }}>
          XAKTEIR
        </h1>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes zoomIn { 0% { transform: scale(0.1); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
        `}} />
      </div>
    );
  }

  if (activeTab === 'signup') {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        <div className="absolute inset-0 mesh-background !z-0" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-[1]" />
        <div className="absolute inset-0 arcade-grid opacity-20 pointer-events-none z-[1]" />
        
        {wizardStep === 0 && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-12 max-w-4xl animate-in slide-in-from-bottom-8">
            <h1 className="text-5xl md:text-9xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
              Welcome To <span className="text-primary">Xakteir</span>
            </h1>
            <div className="space-y-4">
              <p className="text-lg md:text-4xl font-bold text-white/80">Your go-to place for everything fun.</p>
              <p className="text-base md:text-2xl font-bold text-primary/80 uppercase tracking-widest">Do fun the proper way.</p>
            </div>
            <Button onClick={() => setWizardStep(1)} className="h-20 px-16 text-2xl bg-white text-black hover:bg-gray-200 rounded-[3rem] font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
              Next <ArrowRight className="ml-4 w-8 h-8" />
            </Button>
            <button onClick={() => setActiveTab('signin')} className="text-white/40 font-bold hover:text-white uppercase tracking-widest text-xs pt-4">Back to Sign In</button>
          </div>
        )}

        {wizardStep === 1 && (
          <div className="relative z-10 w-full max-w-2xl flex flex-col space-y-8 animate-in slide-in-from-right-8">
            <div className="text-center space-y-4">
              <AtSign className="w-20 h-20 text-primary mx-auto opacity-80" />
              <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">Choose Your Username</h2>
              <p className="text-base sm:text-lg font-bold text-white/50">This will be your permanent Xakteir identity and email address.</p>
            </div>
            
            <div className="relative flex items-center justify-center">
              <div className="flex bg-white/5 border border-white/10 rounded-[2rem] h-20 sm:h-24 w-full overflow-hidden focus-within:border-primary transition-colors pl-12 pr-4 sm:pl-16 sm:pr-8">
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={(e) => {
                    // Only allow alphanumeric for username
                    const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
                    setUsernameInput(val);
                  }} 
                  placeholder="username" 
                  className="bg-transparent text-xl sm:text-3xl font-bold text-white text-right outline-none w-1/2" 
                  autoFocus
                />
                <div className="flex items-center text-xl sm:text-3xl font-bold text-white/40 pl-1 pointer-events-none w-1/2 text-left">
                  @mail.xakteir.com
                </div>
              </div>
              <div className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2"><Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary/50 animate-pulse" /></div>
              <div className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2"><Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary/50 animate-bounce" /></div>
            </div>

            <Button onClick={() => setWizardStep(2)} disabled={!usernameInput || usernameInput.length < 3} className="h-20 w-full text-2xl bg-primary text-black hover:bg-primary/90 rounded-[3rem] font-black uppercase tracking-widest shadow-[0_0_40px_rgba(var(--primary),0.3)] transition-all">
              Next
            </Button>
            <button onClick={() => setWizardStep(0)} className="text-white/40 font-bold hover:text-white uppercase tracking-widest text-xs pt-4">Back</button>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="relative z-10 w-full max-w-2xl flex flex-col space-y-8 animate-in slide-in-from-right-8">
            <div className="text-center space-y-4">
              <Lock className="w-20 h-20 text-primary mx-auto opacity-80" />
              <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">Secure Your Account</h2>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Password" 
                  className="h-16 sm:h-20 bg-white/5 border-white/10 text-xl sm:text-2xl font-bold rounded-[2rem] text-center px-12 text-white" 
                  autoFocus
                />
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
              </div>
              <div className="relative">
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm Password" 
                  className="h-16 sm:h-20 bg-white/5 border-white/10 text-xl sm:text-2xl font-bold rounded-[2rem] text-center px-12 text-white" 
                />
                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
              </div>

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-[2rem] p-4 px-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsPublic(!isPublic)}>
                <div className="flex-1">
                  <h4 className="text-white font-bold">Public Profile</h4>
                  <p className="text-zinc-400 text-xs mt-1">Allow others to find and view your Xakteir profile.</p>
                </div>
                <div className={cn("w-12 h-6 rounded-full transition-colors flex items-center p-1", isPublic ? "bg-primary" : "bg-white/10")}>
                  <div className={cn("w-4 h-4 rounded-full bg-black transition-transform", isPublic ? "translate-x-6" : "translate-x-0")} />
                </div>
              </div>
            </div>

            <Button onClick={handleSignup} disabled={isLoading || !password || !confirmPassword} className="h-20 w-full text-2xl bg-white text-black hover:bg-gray-200 rounded-[3rem] font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all">
              {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Finish"}
            </Button>
            <button onClick={() => setWizardStep(1)} className="text-white/40 font-bold hover:text-white uppercase tracking-widest text-xs pt-4">Back</button>
          </div>
        )}

      </div>
    );
  }

  // STANDARD SIGN IN UI
  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center p-6 relative">
      <div className="mb-8 z-10 flex bg-black/40 p-2 rounded-full border border-white/5 shadow-xl backdrop-blur-sm">
        <button 
          className="px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.5)]"
          onClick={() => setActiveTab('signin')}
        >
          Sign In
        </button>
        <button 
          className="px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all text-white/50 hover:text-white"
          onClick={() => { setActiveTab('signup'); setWizardStep(0); }}
        >
          Sign Up
        </button>
      </div>

      <Card className="w-full max-w-lg glass-card rounded-[4rem] border-white/5 shadow-2xl overflow-hidden relative z-10">
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        
        <CardHeader className="text-center space-y-8 pt-12">
          <div className="flex justify-center"><GlitchLogo className="scale-110" /></div>
          <div className="space-y-2">
            <CardTitle className="text-5xl font-black italic uppercase tracking-tighter text-white">
              {step === 'verify-2fa' ? "Verify Code" : step === 'forgot' ? "Reset Password" : "Sign In"}
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-[0.4em] text-muted-foreground opacity-60">
              Account Access
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 relative z-10 min-h-[350px] flex flex-col">
          {step === 'verify-2fa' ? (
             <div className="space-y-10 animate-in zoom-in-95">
                <div className="flex justify-center">
                   <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 border-4 border-primary/40 flex items-center justify-center animate-pulse">
                      <ShieldCheck className="w-10 h-10 text-primary" />
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-center block tracking-widest text-muted-foreground">Enter 6-Digit Code</label>
                   <Input 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000 000" 
                    className="h-20 bg-black/40 border-8 border-white/5 rounded-[2rem] text-center text-5xl font-black tracking-widest italic text-primary" 
                   />
                </div>
                <Button onClick={() => router.push("/")} disabled={otpCode.length < 6} className="w-full h-18 bg-primary text-black hover:bg-primary/90 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Confirm Code</Button>
             </div>
          ) : step === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-top-4">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold text-white" />
                  </div>
               </div>
               <Button type="submit" disabled={isLoading || !email} className="w-full bg-primary text-black hover:bg-primary/90 h-20 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Send Reset Link"}
               </Button>
               <button type="button" onClick={() => setStep('email')} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all">Back to Login</button>
            </form>
          ) : step === 'google-username' ? (
             <div className="space-y-6 animate-in slide-in-from-right-8">
                <div className="text-center space-y-4">
                  <AtSign className="w-16 h-16 text-primary mx-auto opacity-80" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Choose Your Username</h2>
                  <p className="text-xs font-bold text-white/50">This will be your permanent Xakteir identity and email address.</p>
                </div>
                
                <div className="relative flex items-center justify-center">
                  <div className="flex bg-white/5 border border-white/10 rounded-2xl h-16 w-full overflow-hidden focus-within:border-primary transition-colors pl-4 pr-4">
                    <input 
                      type="text" 
                      value={usernameInput} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
                        setUsernameInput(val);
                      }} 
                      placeholder="username" 
                      className="bg-transparent text-xl font-bold text-white text-right outline-none w-1/2" 
                      autoFocus
                    />
                    <div className="flex items-center text-xl font-bold text-white/40 pl-1 pointer-events-none w-1/2 text-left">
                      @mail.xakteir.com
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsPublic(!isPublic)}>
                  <div className="flex-1">
                    <h4 className="text-white text-xs font-bold">Public Profile</h4>
                    <p className="text-zinc-400 text-[10px] mt-1">Allow others to find and view your Xakteir profile.</p>
                  </div>
                  <div className={cn("w-10 h-5 rounded-full transition-colors flex items-center p-1", isPublic ? "bg-primary" : "bg-white/10")}>
                    <div className={cn("w-3 h-3 rounded-full bg-black transition-transform", isPublic ? "translate-x-5" : "translate-x-0")} />
                  </div>
                </div>

                <Button onClick={handleGoogleSignupComplete} disabled={isLoading || !usernameInput || usernameInput.length < 3} className="w-full bg-primary text-black hover:bg-primary/90 h-16 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Registration"}
                </Button>
             </div>
          ) : (
            <div className="space-y-6">
              <Button type="button" onClick={handleGoogleAuth} disabled={isLoading} variant="outline" className="w-full h-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest gap-4 transition-all">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-primary" />} Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-[8px] font-black uppercase"><span className="bg-[#0a0a15] px-4 text-muted-foreground tracking-widest">Or use email</span></div>
              </div>

              <form onSubmit={handleInitialAuth} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold text-white" />
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <Button type="submit" disabled={isLoading || !email || !password} className="w-full bg-primary hover:bg-primary/90 h-20 rounded-[2rem] font-black uppercase text-xs tracking-widest text-black shadow-xl">
                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Sign In"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep('forgot')} className="w-full h-16 rounded-2xl border-white/10 bg-transparent hover:bg-white/5 text-white/60 font-black uppercase text-[10px] tracking-widest transition-all">
                     <HelpCircle className="w-4 h-4 mr-2" /> Forgot Password?
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
