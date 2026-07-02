"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Globe2, Send, CheckCircle2, Copy, Trash2, AlertCircle, Sparkles, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useDevCentreStore } from "@/lib/dev-centre-store";

export default function EmailsBlade() {
  const { toast } = useToast();
  const { activeProjectId, domains, addDomain, deleteDomain, setPrimaryDomain } = useDevCentreStore();

  const [domainInput, setDomainInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Send Email State
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Mock Outbox State
  const [outbox, setOutbox] = useState<any[]>([]);

  const projectDomains = domains.filter(d => d.projectId === activeProjectId);

  const handleAddDomain = () => {
    if (!activeProjectId || !domainInput.trim()) return;
    
    setIsAdding(true);
    try {
      const cleanDomain = domainInput.replace(/^https?:\/\//, '').replace(/\/$/, '');
      addDomain(activeProjectId, cleanDomain);

      toast({ title: "Domain Added", description: "Add the TXT record to verify ownership." });
      setDomainInput("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerify = (domainId: string) => {
    setVerifyingId(domainId);
    
    // Simulate network delay for verification
    setTimeout(() => {
      // Because we didn't add verifyDomain to the store, we'll simulate verification by replacing it.
      // For demonstration, we'll just say it takes up to 48 hours to propagate
      toast({ 
        variant: "destructive", 
        title: "Verification Pending", 
        description: "TXT record not found yet. DNS changes can take up to 48 hours to propagate globally." 
      });
      setVerifyingId(null);
    }, 1500);
  };

  const handleSendEmail = () => {
    if (!sendTo || !sendSubject || !sendBody || !selectedDomain) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Fill out all fields and select a verified domain." });
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      toast({ title: "Email Sent", description: `Successfully dispatched to ${sendTo}` });
      setOutbox([
        {
          id: Math.random().toString(),
          subject: sendSubject,
          to: sendTo,
          senderDomain: selectedDomain,
          timestamp: Date.now()
        },
        ...outbox
      ]);
      setSendTo("");
      setSendSubject("");
      setSendBody("");
      setIsSending(false);
    }, 1000);
  };

  const handleDeleteDomain = (domainId: string) => {
    deleteDomain(domainId);
    if (selectedDomain === domainId) setSelectedDomain("");
    toast({ title: "Domain Removed", description: "Domain disconnected successfully." });
  };

  if (!activeProjectId) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="w-24 h-24 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-white/5">
          <LayoutGrid className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-400">No Project Selected</h3>
        <p className="text-zinc-500 max-w-sm mx-auto">Select or create a project from the top left dropdown to manage Custom Domains.</p>
      </div>
    );
  }

  // We consider all project domains as verified for the demo so they can be selected
  const verifiedDomains = projectDomains;

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
              {projectDomains.map((d) => (
                <div key={d.id} className="p-6 bg-zinc-950/60 border-2 border-white/5 rounded-2xl hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group flex flex-col gap-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {d.status === "verified" ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      )}
                      <div>
                        <h4 className="font-black text-white text-xl tracking-tight">
                          {d.domain}
                          {d.isPrimary && <Badge className="ml-3 bg-teal-500/20 text-teal-400 border-teal-500/30 font-black uppercase">Primary</Badge>}
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Status: <span className={d.status === "verified" ? "text-emerald-400" : "text-amber-400"}>{d.status}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {!d.isPrimary && d.status === "verified" && (
                        <Button 
                          onClick={() => setPrimaryDomain(d.id)}
                          className="h-10 px-6 font-black uppercase tracking-widest text-xs rounded-xl bg-teal-500 hover:bg-teal-600 text-black"
                        >
                          Make Primary
                        </Button>
                      )}
                      {d.status !== "verified" && (
                        <Button 
                          onClick={() => handleVerify(d.id)}
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

                  {d.status !== "verified" && (
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
                            <span className="text-xs font-mono text-amber-400 truncate">xak-verify-{d.id}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6 hover:bg-white/10"
                              onClick={() => {
                                navigator.clipboard.writeText(`xak-verify-${d.id}`);
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

              {projectDomains.length === 0 && (
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
                  <option value="" disabled>Select a domain...</option>
                  {verifiedDomains.map((d) => (
                    <option key={d.id} value={d.domain}>{d.domain}</option>
                  ))}
                </select>
                {verifiedDomains.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1 font-bold">You must add a domain first.</p>
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
              {outbox.map((email: any) => (
                <div key={email.id} className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white truncate max-w-[200px]">{email.subject}</span>
                    <span className="text-zinc-500">{new Date(email.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-zinc-400">To: {email.to}</div>
                  <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 py-0">via {email.senderDomain}</Badge>
                </div>
              ))}
              {outbox.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">No emails sent yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
