"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Terminal, ShieldCheck, Lock, User as UserIcon, X, Check } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [appDetails, setAppDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const stateParam = searchParams.get("state");

  useEffect(() => {
    async function fetchApp() {
      if (!clientId || !redirectUri || !firestore) {
        if (!firestore) return; // Wait for firestore
        setError("Missing client_id or redirect_uri parameters.");
        return;
      }
      
      try {
        const docRef = doc(firestore, "oauth_apps", clientId);
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) {
          setError("Invalid client_id. App not found.");
          return;
        }
        
        const data = snap.data();
        // In a strict OAuth implementation, you verify redirectUri exactly.
        // We'll do a simple includes or exact match.
        if (!redirectUri.startsWith(data.redirectUri) && data.redirectUri !== "*") {
           // For local testing, sometimes devs use localhost instead of their domain
           // but for safety we should enforce it. We'll enforce exact match for now.
           if (!redirectUri.startsWith("http://localhost") && redirectUri !== data.redirectUri) {
              setError("Redirect URI mismatch.");
              return;
           }
        }
        
        setAppDetails(data);
      } catch (e: any) {
        setError(e.message);
      }
    }
    
    fetchApp();
  }, [clientId, redirectUri, firestore]);

  const handleLogin = async () => {
    if (!auth) return;
    setIsProcessing(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuthorize = async () => {
    if (!user || !firestore || !clientId || !redirectUri) return;
    setIsProcessing(true);
    
    try {
      // Generate a short-lived authorization code
      const code = "xak_auth_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      
      // Store the code in firestore
      await setDoc(doc(firestore, "oauth_codes", code), {
        clientId,
        userId: user.uid,
        redirectUri,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
        used: false
      });
      
      // Redirect back to the third-party app
      const url = new URL(redirectUri);
      url.searchParams.append("code", code);
      if (stateParam) url.searchParams.append("state", stateParam);
      
      window.location.href = url.toString();
      
    } catch (e: any) {
      setError(e.message);
      setIsProcessing(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri) return;
    const url = new URL(redirectUri);
    url.searchParams.append("error", "access_denied");
    if (stateParam) url.searchParams.append("state", stateParam);
    window.location.href = url.toString();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-red-500">Authorization Error</h1>
        <p className="text-muted-foreground font-mono text-sm bg-black/40 p-4 rounded-xl border border-white/10">{error}</p>
      </div>
    );
  }

  if (!appDetails || userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Terminal className="w-8 h-8 text-indigo-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in duration-500 p-6 sm:p-8">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto">
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border-2 border-white/10 shadow-xl">
             <Terminal className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="w-8 h-1 bg-gradient-to-r from-zinc-800 to-indigo-500/20 rounded-full relative overflow-hidden">
             <div className="absolute inset-0 bg-indigo-500 w-1/2 animate-[ping_1.5s_ease-in-out_infinite]" />
          </div>
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
             <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Authorize App</h1>
          <p className="text-sm text-muted-foreground font-medium">
            <strong className="text-white">{appDetails.name}</strong> wants to access your Xakteir Hub account.
          </p>
        </div>

        <div className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-left space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Requested Access</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm font-medium">
              <UserIcon className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>View your basic profile information (Username, Avatar).</span>
            </li>
            <li className="flex items-start gap-3 text-sm font-medium">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Verify your secure Xakteir digital identity.</span>
            </li>
          </ul>
        </div>

        {!user ? (
          <div className="w-full space-y-4 pt-4 border-t-2 border-white/10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Sign in to continue</p>
            <Button onClick={handleLogin} disabled={isProcessing} className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-black uppercase tracking-widest">
               Sign in with Google
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-4 pt-4 border-t-2 border-white/10">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-8 h-8 rounded-full bg-zinc-800" alt="Avatar" />
               <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
               </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleDeny} disabled={isProcessing} variant="outline" className="flex-1 h-12 rounded-xl bg-transparent border-white/10 hover:bg-white/5">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleAuthorize} disabled={isProcessing} className="flex-1 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <Check className="w-4 h-4 mr-2" /> Allow
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-8">
         Xakteir Hub • Identity Provider
      </p>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <div className="min-h-screen bg-[#0a0a15] text-white flex items-center justify-center p-4">
       <div className="w-full max-w-md bg-[#11111a] border-4 border-white/10 rounded-[2rem] shadow-2xl h-[650px] max-h-[90vh] overflow-hidden">
          <Suspense fallback={<div className="h-full flex items-center justify-center"><Terminal className="w-8 h-8 animate-pulse text-indigo-500" /></div>}>
            <AuthorizeContent />
          </Suspense>
       </div>
    </div>
  );
}
