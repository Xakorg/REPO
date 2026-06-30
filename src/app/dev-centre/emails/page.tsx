"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Globe2, Send, CheckCircle2, Copy, Trash2, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function EmailsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [domainInput, setDomainInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Send Email State
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Load Domains
  const domainsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/email_domains`);
  }, [user, firestore]);
  const { data: domains } = useCollection(domainsRef);

  // Load Outbox
  const outboxRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `dev_accounts/${user.uid}/emails_outbox`);
  }, [user, firestore]);
  const { data: outbox } = useCollection(outboxRef);

  const handleAddDomain = async () => {
    if (!user || !firestore || !domainInput.trim()) return;
    
    setIsAdding(true);
    try {
      const cleanDomain = domainInput.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const domainId = cleanDomain.replace(/\./g, "-").toLowerCase();
      
      const verifyRecord = `xak-verify-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

      await setDoc(doc(firestore, `dev_accounts/${user.uid}/email_domains`, domainId), {
        id: domainId,
        domain: cleanDomain,
        verifyRecord,
        status: "Pending",
        createdAt: new Date().toISOString()
      });

      toast({ title: "Domain Added", description: "Add the TXT record to verify ownership." });
      setDomainInput("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerify = async (domainObj: any) => {
    if (!user) return;
    setVerifyingId(domainObj.id);
    
    try {
      const res = await fetch("/api/dns/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          domainId: domainObj.id,
          domainName: domainObj.domain,
          verifyRecord: domainObj.verifyRecord
        })
      });

      const data = await res.json();
      
      if (data.verified) {
        toast({ title: "Domain Verified!", description: "You can now send emails from this domain." });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Verification Failed", 
          description: data.message || "TXT record not found. DNS changes can take up to 48 hours to propagate globally." 
        });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSendEmail = async () => {
    if (!user || !sendTo || !sendSubject || !sendBody || !selectedDomain) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Fill out all fields and select a verified domain." });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          to: sendTo,
          fromDomain: selectedDomain,
          subject: sendSubject,
          body: sendBody
        })
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "Email Sent", description: `Successfully dispatched to ${sendTo}` });
        setSendTo("");
        setSendSubject("");
        setSendBody("");
      } else {
        throw new Error(data.error || "Failed to send email");
      }

    } catch (e: any) {
      toast({ variant: "destructive", title: "Dispatch Failed", description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/email_domains`, domainId));
      if (selectedDomain === domainId) setSelectedDomain("");
      toast({ title: "Domain Removed", description: "Domain disconnected successfully." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const verifiedDomains = domains?.filter((d: any) => d.status === "Verified") || [];

  return (
    <div className="space-y-12 pb-32">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border-2 border-teal-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)]">
            <Mail className="w-8 h-8 text-teal-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Custom Domains</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-1">DNS Routing & Transactional Emails</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
        
        {/* Left Column: Domains & Settings */}
        <div className="space-y-8">
          
          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 space-y-8 shadow-2xl">
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                <Globe2 className="w-6 h-6 text-teal-400" /> Register Domain
              </h3>
            </div>
            
            <div className="flex gap-4">
              <Input 
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                placeholder="e.g. acmecorp.com" 
                className="flex-1 bg-black/50 border-white/10 h-14 rounded-2xl text-white font-bold italic px-5"
              />
              <Button 
                onClick={handleAddDomain} 
                disabled={isAdding}
                className="h-14 px-8 bg-teal-500 hover:bg-teal-600 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:scale-[1.02]"
              >
                {isAdding ? "Adding..." : "Add Domain"}
              </Button>
            </div>
          </Card>

          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 shadow-2xl min-h-[400px]">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-8">Connected Domains</h3>
            
            <div className="space-y-6">
              {domains?.map((d: any) => (
                <div key={d.id} className="p-6 bg-zinc-950/60 border-2 border-white/5 rounded-2xl hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group flex flex-col gap-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {d.status === "Verified" ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      )}
                      <div>
                        <h4 className="font-black text-white text-xl tracking-tight">{d.domain}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Status: <span className={d.status === "Verified" ? "text-emerald-400" : "text-amber-400"}>{d.status}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {d.status !== "Verified" && (
                        <Button 
                          onClick={() => handleVerify(d)}
                          disabled={verifyingId === d.id}
                          className="h-10 px-6 font-black uppercase tracking-widest text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-black"
                        >
                          {verifyingId === d.id ? "Verifying..." : "Verify DNS"}
                        </Button>
                      )}
                      <Button onClick={() => handleDeleteDomain(d.id)} variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {d.status !== "Verified" && (
                    <div className="bg-black/80 rounded-xl border border-white/10 p-5 space-y-4">
                      <p className="text-xs font-bold text-zinc-400">Add this TXT record to your DNS provider to verify ownership:</p>
                      <div className="grid grid-cols-[1fr_3fr] gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Type / Host</label>
                          <div className="h-10 bg-zinc-900 border border-white/5 rounded-lg flex items-center px-4 text-xs font-mono text-zinc-300">TXT &nbsp;&nbsp; @</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Value</label>
                          <div className="h-10 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-between px-4">
                            <span className="text-xs font-mono text-amber-400 truncate">{d.verifyRecord}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6 hover:bg-white/10"
                              onClick={() => {
                                navigator.clipboard.writeText(d.verifyRecord);
                                toast({ description: "Copied to clipboard" });
                              }}
                            >
                              <Copy className="w-3 h-3 text-zinc-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {(!domains || domains.length === 0) && (
                <div className="h-48 flex flex-col items-center justify-center space-y-4 text-zinc-500 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                  <Globe2 className="w-12 h-12 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest">No domains connected.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Send Email API Simulator */}
        <div className="space-y-8 sticky top-8">
          <Card className="glass-card rounded-[2rem] p-10 border-2 border-teal-500/30 bg-[#050505] shadow-[0_0_50px_rgba(20,184,166,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2 relative z-10">Transactional API</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-8 relative z-10 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Dispatch Test Email
            </p>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">From Domain</label>
                <select 
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 h-14 rounded-2xl px-5 text-white font-bold outline-none focus:border-teal-500/50 transition-colors"
                >
                  <option value="" disabled>Select a verified domain...</option>
                  {verifiedDomains.map((d: any) => (
                    <option key={d.id} value={d.domain}>{d.domain}</option>
                  ))}
                </select>
                {verifiedDomains.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1 font-bold">You must verify a domain first.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">To Email</label>
                <Input 
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  placeholder="user@example.com" 
                  className="bg-black/50 border-white/10 h-14 rounded-2xl text-white font-bold px-5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subject</label>
                <Input 
                  value={sendSubject}
                  onChange={e => setSendSubject(e.target.value)}
                  placeholder="Welcome to our app!" 
                  className="bg-black/50 border-white/10 h-14 rounded-2xl text-white font-bold px-5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">HTML Body</label>
                <textarea 
                  value={sendBody}
                  onChange={e => setSendBody(e.target.value)}
                  placeholder="<h1>Hello World</h1>"
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-5 text-white font-mono text-xs resize-none focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>

              <Button 
                onClick={handleSendEmail} 
                disabled={isSending || verifiedDomains.length === 0}
                className="w-full bg-teal-500 hover:bg-teal-600 text-black font-black uppercase text-xs tracking-widest h-14 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:scale-[1.02]"
              >
                <Send className="w-5 h-5 mr-3" /> {isSending ? "Dispatching..." : "Send via Xakteir"}
              </Button>
            </div>
          </Card>
          
          {/* OUTBOX */}
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Outbox Logs</h3>
            <div className="space-y-3">
              {outbox?.map((email: any) => (
                <div key={email.id} className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white truncate max-w-[200px]">{email.subject}</span>
                    <span className="text-zinc-500">{new Date(email.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-zinc-400">To: {email.to}</div>
                  <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 py-0">via {email.senderDomain}</Badge>
                </div>
              ))}
              {(!outbox || outbox.length === 0) && (
                <p className="text-xs text-zinc-500 text-center py-4">No emails sent yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
