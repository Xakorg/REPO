
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, AtSign, ArrowRight, Sparkles, ShieldCheck, Chrome, HelpCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOffensive } from "@/lib/username";

type AuthStep = 'email' | 'password' | 'verify-2fa' | 'forgot' | 'terms';

export default function AuthPage() {
  const { user: existingUser } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>('email');
  
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (existingUser) {
      router.push("/");
    }
  }, [existingUser, router]);

  // Central Redirection Logic: Responds instantly to Auth state changes
  useEffect(() => {
    let isMounted = true;
    if (existingUser && step !== 'verify-2fa') {
      existingUser.getIdToken().then(idToken => {
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        }).then(() => {
          if (isMounted) router.replace("/");
        }).catch(() => {
          if (isMounted) router.replace("/");
        });
      });
    }
    return () => { isMounted = false; };
  }, [existingUser, router, step]);

  const handleGoogleAuth = () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Non-blocking popup initiation
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (!userDoc.exists()) {
          const derived = user.email?.split('@')[0] || "user";
          const finalUsername = isOffensive(derived) ? `user_${user.uid.slice(0,6)}` : derived;
          await setDoc(doc(firestore, "users", user.uid), {
            id: user.uid,
            username: finalUsername,
            email: user.email?.toLowerCase(),
            displayName: user.displayName || finalUsername,
            registrationDateTime: new Date().toISOString(),
            role: 'user',
            currencyBalance: 1000,
            agreedToTerms: true,
            twoFactorEnabled: false,
            photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${finalUsername}`
          });
        }
        toast({ title: "Signed In", description: `Welcome, ${user.displayName}!` });
      })
      .catch((error) => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Authentication Error", description: error.message });
      });
  };

  const handleInitialAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    setIsLoading(true);
    // Non-blocking sign-in call
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const userDoc = await getDoc(doc(firestore, "users", userCredential.user.uid));
        if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
          setStep('verify-2fa');
          setIsLoading(false);
          toast({ title: "Verification Required", description: "Please enter your security code." });
        } else {
          toast({ title: "Success", description: "You have been signed in." });
          // Redirect handled by useEffect
        }
      })
      .catch((error) => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Access Denied", description: "Incorrect email or password." });
      });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore || !agreed) return;

    if (email.toLowerCase().endsWith("@xakteir.com")) {
      toast({ 
        variant: "destructive", 
        title: "Registration Error", 
        description: "Registration with @xakteir.com is reserved. Please use a standard email provider." 
      });
      return;
    }

    setIsLoading(true);
    // Validate username choice
    const chosen = username?.trim() || email.split('@')[0];
    if (isOffensive(chosen)) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Invalid Username", description: "That username is not allowed. Please choose another." });
      return;
    }

    // check for username collision
    try {
      const q = query(collection(firestore, "users"), where("username", "==", chosen));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsLoading(false);
        toast({ variant: "destructive", title: "Username Taken", description: "That username is already in use. Please pick a different one." });
        return;
      }
    } catch (e) {
      // ignore query errors and continue
    }

    // Non-blocking signup call
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const finalUsername = chosen;

        await updateProfile(user, { displayName: finalUsername });
        await setDoc(doc(firestore, "users", user.uid), {
          id: user.uid,
          username: finalUsername,
          email: email.toLowerCase(),
          displayName: finalUsername,
          registrationDateTime: new Date().toISOString(),
          role: 'user',
          currencyBalance: 1000,
          agreedToTerms: true,
          twoFactorEnabled: false,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${finalUsername}`
        });

        toast({ title: "Account Created", description: `Welcome, ${finalUsername}!` });
        // Redirect handled by useEffect
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

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg glass-card rounded-[4rem] border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        
        <CardHeader className="text-center space-y-8 pt-12">
          <div className="flex justify-center"><GlitchLogo className="scale-110" /></div>
          <div className="space-y-2">
            <CardTitle className="text-5xl font-black italic uppercase tracking-tighter text-white">
              {step === 'verify-2fa' ? "Verify Code" : step === 'forgot' ? "Reset Password" : isLogin ? "Sign In" : "Sign Up"}
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
                <Button onClick={() => router.push("/")} disabled={otpCode.length < 6} className="w-full h-18 bg-primary rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Confirm Code</Button>
             </div>
          ) : step === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-top-4">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold" />
                  </div>
               </div>
               <Button type="submit" disabled={isLoading || !email} className="w-full bg-primary h-20 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Send Reset Link"}
               </Button>
               <button type="button" onClick={() => setStep('email')} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all">Back to Login</button>
            </form>
          ) : (
            <div className="space-y-6">
              <Button onClick={handleGoogleAuth} disabled={isLoading} variant="outline" className="w-full h-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest gap-4 transition-all">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-primary" />} Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-[8px] font-black uppercase"><span className="bg-[#0a0a15] px-4 text-muted-foreground tracking-widest">Or use email</span></div>
              </div>

              {isLogin ? (
                <form onSubmit={handleInitialAuth} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setStep('forgot')} className="text-[10px] font-black uppercase text-primary hover:underline italic flex items-center gap-2">
                       <HelpCircle className="w-3 h-3" /> Forgot Password?
                    </button>
                  </div>
                  <Button type="submit" disabled={isLoading || !email || !password} className="w-full bg-primary hover:bg-primary/90 h-20 rounded-[2rem] font-black uppercase text-xs tracking-widest text-white shadow-xl">
                    {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold" />
                    </div>
                    <div className="relative">
                      <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose Password" className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold" />
                    </div>
                    <div className="flex items-center gap-3 px-4 pt-4">
                      <Checkbox id="agreed" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="w-6 h-6 border-white/20 data-[state=checked]:bg-primary" />
                      <label htmlFor="agreed" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Agree to Terms of Service</label>
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading || !agreed || !email || !password || !username} className="w-full bg-primary h-20 rounded-[2rem] font-black uppercase text-xs tracking-widest text-white shadow-xl">Create Account</Button>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 text-center border-t border-white/5 pt-8">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setStep('email'); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all">
              {isLogin ? "Need an account? Join Xakteir" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
