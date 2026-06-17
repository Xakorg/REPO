"use client";

import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Globe2, Send, CheckCircle2, Copy, Trash2, AlertCircle } from "lucide-react";
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

  const handleRemoveDomain = async (domainId: string) => {
    if (!user || !firestore) return;
    await deleteDoc(doc(firestore, `dev_accounts/${user.uid}/email_domains`, domainId));
    toast({ title: "Removed", description: "Domain has been removed." });
  };

  const handleSendEmail = async () => {
    if (!user || !sendTo || !sendSubject || !sendBody || !selectedDomain) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all fields and select a verified domain." });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          to: sendTo,
          subject: sendSubject,
          body: sendBody,
          senderName: "Xakteir Dev",
          senderDomain: selectedDomain
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      toast({ title: "Email Sent!", description: "Message delivered successfully." });
      setSendTo("");
      setSendSubject("");
      setSendBody("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Send Failed", description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const verifiedDomains = domains?.filter((d: any) => d.status === "Verified") || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Mail className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Emails</h1>
          <p className="text-xs text-zinc-400">Verify domains and send transactional emails instantly.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* DOMAINS SECTION */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl h-fit space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Add Sender Domain</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Domain Name</label>
                <div className="relative">
                  <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    value={domainInput}
                    onChange={e => setDomainInput(e.target.value)}
                    placeholder="example.com" 
                    className="bg-black/50 border-white/10 h-12 rounded-xl pl-10 text-white font-bold"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleAddDomain} 
                disabled={isAdding}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-2"
              >
                {isAdding ? "Adding..." : "Add Domain"}
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            {domains?.map((domain: any) => (
              <Card key={domain.id} className="p-5 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-white text-base">{domain.domain}</h4>
                    <Badge className={domain.status === "Verified" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mt-1" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 mt-1"}>
                      {domain.status}
                    </Badge>
                  </div>
                  <Button onClick={() => handleRemoveDomain(domain.id)} variant="ghost" size="icon" className="w-8 h-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {domain.status === "Pending" && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-200">Add this TXT record to your DNS provider (Cloudflare, GoDaddy, etc.) to verify ownership.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500">Type</label>
                          <div className="text-xs font-mono text-white bg-black/50 p-2 rounded-lg border border-white/5">TXT</div>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500">Name</label>
                          <div className="text-xs font-mono text-white bg-black/50 p-2 rounded-lg border border-white/5">@</div>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                            Value <button onClick={() => copyToClipboard(domain.verifyRecord)} className="hover:text-white"><Copy className="w-3 h-3"/></button>
                          </label>
                          <div className="text-xs font-mono text-white bg-black/50 p-2 rounded-lg border border-white/5 break-all">
                            {domain.verifyRecord}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleVerify(domain)}
                        disabled={verifyingId === domain.id}
                        className="w-full bg-white/5 hover:bg-white/10 text-white text-xs h-10 mt-2"
                      >
                        {verifyingId === domain.id ? "Querying Global DNS..." : "Verify Record"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* SEND EMAIL SECTION */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Test Email API</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">From Domain</label>
                <select 
                  className="w-full bg-black/50 border border-white/10 h-12 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-orange-500/50 appearance-none"
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value)}
                >
                  <option value="" disabled>Select a verified domain</option>
                  {verifiedDomains.map((d: any) => (
                    <option key={d.id} value={d.domain}>{d.domain}</option>
                  ))}
                </select>
                {verifiedDomains.length === 0 && (
                  <p className="text-[10px] text-rose-400 mt-1">You must verify a domain first.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">To Address</label>
                <Input 
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  placeholder="user@example.com" 
                  className="bg-black/50 border-white/10 h-12 rounded-xl text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subject</label>
                <Input 
                  value={sendSubject}
                  onChange={e => setSendSubject(e.target.value)}
                  placeholder="Hello from Xakteir!" 
                  className="bg-black/50 border-white/10 h-12 rounded-xl text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Body (HTML)</label>
                <textarea 
                  value={sendBody}
                  onChange={e => setSendBody(e.target.value)}
                  placeholder="<h1>It works!</h1>" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white h-32 resize-none focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <Button 
                onClick={handleSendEmail}
                disabled={isSending || verifiedDomains.length === 0}
                className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase text-xs tracking-widest h-12 rounded-xl mt-4"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Sending..." : "Send Request"}
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
