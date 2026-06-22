"use client";

import { useState, useEffect } from "react";
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
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  Lock,
  AtSign,
  ShieldCheck,
  Chrome,
  HelpCircle,
  ArrowRight,
  Zap,
  Globe,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuthStep = "email" | "password" | "verify-2fa" | "forgot" | "terms";

const FEATURES = [
  { icon: Zap, label: "AI-Powered Suite", desc: "10+ built-in AI tools" },
  { icon: Globe, label: "Web & Games", desc: "Create, play, and share" },
  { icon: Layers, label: "All-in-one", desc: "Work, chat, and build" },
];

export default function AuthPage() {
  const { user: existingUser } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>("email");

  const [email, setEmail] = useState("");
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
    if (existingUser && step !== "verify-2fa") {
      router.replace("/");
    }
  }, [existingUser, router, step]);

  const handleGoogleAuth = () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(firestore, "users", user.uid), {
            id: user.uid,
            username: user.email?.split("@")[0],
            email: user.email?.toLowerCase(),
            displayName: user.displayName || user.email?.split("@")[0],
            registrationDateTime: new Date().toISOString(),
            role: "user",
            currencyBalance: 1000,
            agreedToTerms: true,
            twoFactorEnabled: false,
            photoURL:
              user.photoURL ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          });
        }
        toast({
          title: "Signed In",
          description: `Welcome, ${user.displayName}!`,
        });
      })
      .catch((error) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message,
        });
      });
  };

  const handleInitialAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const userDoc = await getDoc(
          doc(firestore, "users", userCredential.user.uid)
        );
        if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
          setStep("verify-2fa");
          setIsLoading(false);
          toast({
            title: "Verification Required",
            description: "Please enter your security code.",
          });
        } else {
          toast({ title: "Success", description: "You have been signed in." });
        }
      })
      .catch(() => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Incorrect email or password.",
        });
      });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore || !agreed) return;
    if (email.toLowerCase().endsWith("@xakteir.com")) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description:
          "Registration with @xakteir.com is reserved. Please use a standard email provider.",
      });
      return;
    }
    setIsLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const username = email.split("@")[0];
        await updateProfile(user, { displayName: username });
        await setDoc(doc(firestore, "users", user.uid), {
          id: user.uid,
          username,
          email: email.toLowerCase(),
          displayName: username,
          registrationDateTime: new Date().toISOString(),
          role: "user",
          currencyBalance: 1000,
          agreedToTerms: true,
          twoFactorEnabled: false,
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        });
        toast({ title: "Account Created", description: `Welcome, ${username}!` });
      })
      .catch((error) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: error.message,
        });
      });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) return;
    setIsLoading(true);
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setIsLoading(false);
        toast({
          title: "Email Sent",
          description: "Check your inbox for a password reset link.",
        });
        setStep("email");
      })
      .catch((error) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-stretch">
      {/* ── LEFT PANEL (brand/info) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden border-r border-white/5">
        {/* Ambient glow blobs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-60 h-60 rounded-full bg-accent/15 blur-[100px] pointer-events-none" />

        {/* Top: logo + wordmark */}
        <div className="flex items-center gap-4 relative z-10">
          <GlitchLogo className="scale-75 origin-left" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">
              Xakteir
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
              Platform
            </p>
          </div>
        </div>

        {/* Center: headline */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-primary">
              — Your Digital Universe
            </p>
            <h1 className="text-5xl font-black italic uppercase leading-[0.9] tracking-tighter text-white text-balance">
              Create.
              <br />
              <span className="text-primary">Play.</span>
              <br />
              Build.
            </h1>
          </div>
          <p className="text-sm text-white/40 leading-relaxed max-w-xs">
            One account unlocks the entire Xakteir suite — AI tools, games,
            collaboration, finance, and more.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white/90">
                    {label}
                  </p>
                  <p className="text-[10px] text-white/35 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: status bar */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25">
            Systems Online · All services running
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative">
        {/* subtle inner glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[160px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile-only logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <GlitchLogo />
          </div>

          {/* Step: 2FA */}
          {step === "verify-2fa" ? (
            <div className="space-y-8 animate-in zoom-in-95">
              <div className="space-y-1">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
                  Two-Factor
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Verify your identity
                </p>
              </div>

              <div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  6-Digit Code
                </label>
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000 000"
                  className="h-16 bg-white/[0.04] border-white/8 rounded-2xl text-center text-3xl font-black tracking-widest text-primary focus:border-primary/50 focus:ring-primary/20"
                />
              </div>

              <Button
                onClick={() => router.push("/")}
                disabled={otpCode.length < 6}
                className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest gap-2"
              >
                Confirm <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : step === "forgot" ? (
            /* Step: Forgot Password */
            <form
              onSubmit={handleForgotPassword}
              className="space-y-8 animate-in slide-in-from-top-4"
            >
              <div className="space-y-1">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
                  Reset Password
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  We&apos;ll send a link to your inbox
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="bg-white/[0.04] border-white/8 pl-12 h-14 rounded-2xl font-medium focus:border-primary/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
              >
                ← Back to Sign In
              </button>
            </form>
          ) : (
            /* Step: Sign In / Sign Up */
            <div className="space-y-8">
              {/* Heading */}
              <div className="space-y-1">
                <h2 className="text-4xl font-black italic uppercase tracking-tight text-white">
                  {isLogin ? "Welcome Back" : "Join Xakteir"}
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {isLogin
                    ? "Sign in to your account"
                    : "Create your free account"}
                </p>
              </div>

              {/* Google */}
              <Button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                variant="outline"
                className="w-full h-13 rounded-2xl border-white/10 bg-white/[0.04] hover:bg-white/[0.08] font-black uppercase text-[10px] tracking-widest gap-3 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Chrome className="w-4 h-4 text-primary" />
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/25 whitespace-nowrap">
                  or with email
                </span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Login Form */}
              {isLogin ? (
                <form
                  onSubmit={handleInitialAuth}
                  className="space-y-5 animate-in fade-in slide-in-from-bottom-4"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="bg-white/[0.04] border-white/8 pl-12 h-13 rounded-2xl font-medium focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setStep("forgot")}
                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 flex items-center gap-1 transition-colors"
                      >
                        <HelpCircle className="w-3 h-3" /> Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/[0.04] border-white/8 pl-12 h-13 rounded-2xl font-medium focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest gap-2 mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Sign In <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                /* Sign Up Form */
                <form
                  onSubmit={handleSignup}
                  className="space-y-5 animate-in slide-in-from-right-4"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="bg-white/[0.04] border-white/8 pl-12 h-13 rounded-2xl font-medium focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a strong password"
                        className="bg-white/[0.04] border-white/8 pl-12 h-13 rounded-2xl font-medium focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <Checkbox
                      id="agreed"
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(!!v)}
                      className="mt-0.5 w-5 h-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="agreed"
                      className="text-[10px] font-bold uppercase tracking-widest text-white/40 cursor-pointer leading-relaxed"
                    >
                      I agree to the{" "}
                      <span className="text-primary">Terms of Service</span>{" "}
                      and{" "}
                      <span className="text-primary">Privacy Policy</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !agreed || !email || !password}
                    className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase text-xs tracking-widest gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Create Account <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Toggle */}
              <div className="pt-4 border-t border-white/5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setStep("email");
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 hover:text-primary transition-colors"
                >
                  {isLogin
                    ? "New here? Create an account →"
                    : "Already a member? Sign in →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
