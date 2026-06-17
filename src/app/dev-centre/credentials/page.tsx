"use client";

import { useState } from "react";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Copy, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CredentialsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [appName, setAppName] = useState("");
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  const [oauthName, setOauthName] = useState("");
  const [oauthRedirect, setOauthRedirect] = useState("");
  const [oauthCreds, setOauthCreds] = useState<{clientId: string, clientSecret: string} | null>(null);

  const generateApiKey = async () => {
    if (!user || !firestore || !appName || !domain) return;
    const newKey = "xak_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    try {
      await setDoc(doc(firestore, "dev_apps", newKey), {
        owner: user.uid,
        appName,
        domain,
        createdAt: new Date().toISOString()
      });
      setApiKey(newKey);
      toast({ title: "API Key Generated!", description: "Your XakCaptcha API key is ready." });
      setAppName("");
      setDomain("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const createOAuthApp = async () => {
    if (!user || !firestore || !oauthName || !oauthRedirect) return;
    const clientId = "xak_id_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const clientSecret = "xak_sec_" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    try {
      await setDoc(doc(firestore, "oauth_apps", clientId), {
        owner: user.uid,
        name: oauthName,
        redirectUri: oauthRedirect,
        clientSecret: clientSecret,
        createdAt: new Date().toISOString()
      });
      setOauthCreds({ clientId, clientSecret });
      toast({ title: "OAuth App Created!", description: "Your Client ID and Secret are ready." });
      setOauthName("");
      setOauthRedirect("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Key className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">App Credentials</h1>
          <p className="text-xs text-zinc-400">Generate XakCaptcha keys and OAuth client secrets.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-white">XakCaptcha Integration</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-1">Bot protection API Keys</p>
          </div>
          
          {!apiKey ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Application Name</label>
                <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder="My Forum App" className="bg-black/50 border-white/10 h-12 rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Authorized Domain</label>
                <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="forum.example.com" className="bg-black/50 border-white/10 h-12 rounded-xl font-bold" />
              </div>
              <Button onClick={generateApiKey} className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-xs tracking-widest h-12 rounded-xl">
                <Code2 className="w-4 h-4 mr-2" /> Generate API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <p className="text-xs font-bold text-orange-400">Your new API key is ready. Copy it now, it won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-black/50 rounded-lg text-xs font-mono text-zinc-300 break-all border border-white/5">{apiKey}</code>
                <Button onClick={() => copyToClipboard(apiKey)} size="icon" className="shrink-0 h-[46px] w-[46px] bg-white/5 hover:bg-white/10 text-white rounded-lg">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={() => setApiKey(null)} variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 text-xs font-bold rounded-lg h-10">
                Create Another Key
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-white">OAuth App Registration</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-1">Xakteir Sign-In SSO</p>
          </div>
          
          {!oauthCreds ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">App Name</label>
                <Input value={oauthName} onChange={e => setOauthName(e.target.value)} placeholder="My SaaS" className="bg-black/50 border-white/10 h-12 rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Redirect URI</label>
                <Input value={oauthRedirect} onChange={e => setOauthRedirect(e.target.value)} placeholder="https://app.com/api/auth/callback" className="bg-black/50 border-white/10 h-12 rounded-xl font-bold" />
              </div>
              <Button onClick={createOAuthApp} className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase text-xs tracking-widest h-12 rounded-xl">
                Register Application
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xs font-bold text-white">Application registered successfully. Save these credentials securely.</p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Client ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-black/50 rounded-lg text-xs font-mono text-zinc-300 border border-white/5 truncate">{oauthCreds.clientId}</code>
                  <Button onClick={() => copyToClipboard(oauthCreds.clientId)} size="icon" className="shrink-0 h-[34px] w-[34px] bg-white/5 hover:bg-white/10 text-white rounded-lg"><Copy className="w-3 h-3" /></Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Client Secret</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-black/50 rounded-lg text-xs font-mono text-zinc-300 border border-white/5 truncate">{oauthCreds.clientSecret}</code>
                  <Button onClick={() => copyToClipboard(oauthCreds.clientSecret)} size="icon" className="shrink-0 h-[34px] w-[34px] bg-white/5 hover:bg-white/10 text-white rounded-lg"><Copy className="w-3 h-3" /></Button>
                </div>
              </div>
              
              <Button onClick={() => setOauthCreds(null)} variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 text-xs font-bold rounded-lg h-10 mt-2">
                Done
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
