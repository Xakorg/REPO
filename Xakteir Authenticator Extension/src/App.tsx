import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useAuth } from "./firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ShieldCheck, Loader2, QrCode, Lock, Mail, ArrowRight } from "lucide-react";
import * as OTPAuth from "otpauth";
import './index.css';

const generateTOTP = (secret: string) => {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'Xakteir', label: 'Auth', algorithm: 'SHA1', digits: 6, period: 30, secret: secret.replace(/\s+/g, '')
    });
    return totp.generate();
  } catch (e) { return "------"; }
};

export default function App() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const [currentDomain, setCurrentDomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        try {
          const url = new URL(tabs[0].url);
          setCurrentDomain(url.hostname.replace('www.', ''));
        } catch (e) {}
      }
    });
  }, []);

  const accountsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "auth_accounts"), orderBy("timestamp", "desc"));
  }, [firestore, user]);

  const { data: accounts, isLoading } = useCollection(accountsQuery);

  const sortedAccounts = useMemo(() => {
    if (!accounts) return [];
    return [...accounts].sort((a, b) => {
      const aMatch = a.website?.toLowerCase().includes(currentDomain.toLowerCase()) ? 1 : 0;
      const bMatch = b.website?.toLowerCase().includes(currentDomain.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [accounts, currentDomain]);

  const handleLogin = (e: any) => {
    e.preventDefault();
    setIsLoggingIn(true);
    signInWithEmailAndPassword(auth, email, password).finally(() => setIsLoggingIn(false));
  };

  const injectCredentials = (acc: any) => {
    const totp = acc.secret ? generateTOTP(acc.secret) : "";
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "autofill",
          credentials: { email: acc.account || acc.email, password: acc.password, totp }
        });
        window.close(); // Close popup after inject
      }
    });
  };

  if (!user) {
    return (
      <div className="w-[400px] h-[600px] bg-[#05030d] text-white p-8 flex flex-col justify-center animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 arcade-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 text-center space-y-6">
           <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
           <h1 className="text-3xl font-black italic uppercase">Xakteir Auth</h1>
           <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Extension Access</p>
           
           <form onSubmit={handleLogin} className="space-y-4 pt-6 text-left">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 text-sm font-bold focus:outline-none focus:border-primary" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 text-sm font-bold focus:outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full h-12 bg-primary rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary/90 mt-4 flex justify-center items-center">
                 {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize"}
              </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[600px] bg-[#05030d] text-white flex flex-col relative">
      <header className="h-16 border-b border-white/5 flex items-center px-6 bg-black/40">
         <ShieldCheck className="w-5 h-5 text-primary mr-3" />
         <h1 className="text-lg font-black italic uppercase tracking-tighter">Vault</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}
        
        {sortedAccounts.map((acc) => {
          const isMatch = currentDomain && acc.website?.toLowerCase().includes(currentDomain.toLowerCase());
          return (
            <div key={acc.id} onClick={() => injectCredentials(acc)} className={isMatch ? "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-white/5 border-white/5 hover:border-white/20"}>
               {acc.website ? (
                 <img src={"https://www.google.com/s2/favicons?domain=" + acc.website + "&sz=64"} className="w-10 h-10 rounded-full bg-white p-1" />
               ) : (
                 <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5"><QrCode className="w-5 h-5 text-primary" /></div>
               )}
               <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-black uppercase truncate">{acc.service}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">{acc.account || acc.email}</p>
               </div>
               {isMatch && <span className="text-[8px] bg-primary text-white px-2 py-1 rounded-full font-black uppercase">Current Site</span>}
               <ArrowRight className="w-4 h-4 text-white/20" />
            </div>
          )
        })}
      </div>
    </div>
  );
}
