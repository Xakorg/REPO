"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Copy, ShieldCheck, Key, Code2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DevCentrePage() {
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
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const createOAuthApp = async () => {
    if (!user || !firestore || !oauthName || !oauthRedirect) return;
    
    // Generate OAuth Credentials
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
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  return (
    <div className="min-h-screen bg-[#0a0a15] p-10 pt-24 text-white">
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-500/10 border-2 border-blue-500/20 rounded-3xl flex items-center justify-center">
            <Code2 className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter">Xakteir Dev Centre</h1>
            <p className="text-lg text-muted-foreground font-medium mt-2">Build powerful apps using the Xakteir Ecosystem APIs.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* XakCaptcha Section */}
          <div className="glass-card rounded-[2rem] p-8 border-4 border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-32 h-32 text-emerald-400" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3" /> Anti-Bot Service
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">XakCaptcha</h2>
                <p className="text-sm text-muted-foreground font-medium">Protect your websites from bots using Xakteir's advanced behavioral analysis.</p>
              </div>

              {!apiKey ? (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">App Name</label>
                    <Input 
                      value={appName} 
                      onChange={(e) => setAppName(e.target.value)} 
                      placeholder="My Awesome App" 
                      className="h-14 rounded-2xl bg-black/40 border-white/10" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Allowed Domain</label>
                    <Input 
                      value={domain} 
                      onChange={(e) => setDomain(e.target.value)} 
                      placeholder="example.com" 
                      className="h-14 rounded-2xl bg-black/40 border-white/10" 
                    />
                  </div>
                  <Button onClick={generateApiKey} disabled={!appName || !domain} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    Generate API Key <Key className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="p-4 bg-black/40 rounded-2xl border-2 border-white/10">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Your API Key</label>
                    <div className="flex gap-2">
                      <Input readOnly value={apiKey} className="font-mono text-emerald-400 bg-black/60 border-white/5" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey)} className="shrink-0 bg-white/5 border-white/10">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-black/40 rounded-2xl border-2 border-white/10">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Embed Code</label>
                    <div className="relative">
                      <pre className="text-xs font-mono text-zinc-300 bg-black/60 p-4 rounded-xl overflow-x-auto border-2 border-white/5">
                        {`<script src="https://xakteir.com/api/xakcaptcha.js"></script>\n<div class="xak-captcha" data-sitekey="${apiKey}"></div>`}
                      </pre>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`<script src="https://xakteir.com/api/xakcaptcha.js"></script>\n<div class="xak-captcha" data-sitekey="${apiKey}"></div>`)} className="absolute top-2 right-2 hover:bg-white/10">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* OAuth Provider Section */}
          <div className="glass-card rounded-[2rem] p-8 border-4 border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Key className="w-32 h-32 text-indigo-400" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-full text-indigo-400 text-xs font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3" /> Identity Provider
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Login with Xakteir</h2>
                <p className="text-sm text-muted-foreground font-medium">Let users securely sign into your application using their Xakteir profile.</p>
              </div>
              
              {!oauthCreds ? (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">App Name</label>
                    <Input 
                      value={oauthName} 
                      onChange={(e) => setOauthName(e.target.value)} 
                      placeholder="My Web App" 
                      className="h-14 rounded-2xl bg-black/40 border-white/10" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Redirect URI</label>
                    <Input 
                      value={oauthRedirect} 
                      onChange={(e) => setOauthRedirect(e.target.value)} 
                      placeholder="https://example.com/api/auth/callback" 
                      className="h-14 rounded-2xl bg-black/40 border-white/10" 
                    />
                  </div>
                  <Button onClick={createOAuthApp} disabled={!oauthName || !oauthRedirect} className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                     Create OAuth App <Key className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground font-medium">OAuth 2.0 Credentials will be bound to your current developer account.</p>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="p-4 bg-black/40 rounded-2xl border-2 border-white/10 space-y-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Client ID</label>
                      <div className="flex gap-2">
                        <Input readOnly value={oauthCreds.clientId} className="font-mono text-indigo-400 bg-black/60 border-white/5" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(oauthCreds.clientId)} className="shrink-0 bg-white/5 border-white/10">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Client Secret <span className="text-red-400">(Secret!)</span></label>
                      <div className="flex gap-2">
                        <Input readOnly type="password" value={oauthCreds.clientSecret} className="font-mono text-indigo-400 bg-black/60 border-white/5" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(oauthCreds.clientSecret)} className="shrink-0 bg-white/5 border-white/10">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
