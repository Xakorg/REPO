"use client";

import React, { useState } from "react";
import { useXakCode } from "../context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  ShieldCheck, 
  Check, 
  Server, 
  Info,
  Layers,
  ArrowUpRight
} from "lucide-react";

export default function HostingPage() {
  const { toast } = useToast();
  const {
    activeProject,
    liveNameservers,
    checkingNS,
    checkNameservers,
    customDomain,
    setCustomDomain,
    handleAddDomain,
    handleRemoveDomain,
    verifyDNS,
    isVerifyingDNS,
    handleAddDnsRecord,
    handleDeleteDnsRecord
  } = useXakCode();

  const [newRecordType, setNewRecordType] = useState<'A' | 'CNAME' | 'TXT' | 'MX'>('A');
  const [newRecordName, setNewRecordName] = useState("");
  const [newRecordValue, setNewRecordValue] = useState("");
  const [newRecordTTL, setNewRecordTTL] = useState(3600);

  const onSubmitDnsRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordName.trim() || !newRecordValue.trim()) return;
    await handleAddDnsRecord(newRecordType, newRecordName, newRecordValue, newRecordTTL);
    setNewRecordName("");
    setNewRecordValue("");
  };

  const isDelegated = liveNameservers.includes('ns1.xakteir.com');
  const domains = activeProject?.deployment?.domains || [];
  // Migrate on the fly if customDomain string exists but domains array doesn't
  if (activeProject?.deployment?.customDomain && !domains.includes(activeProject.deployment.customDomain)) {
    domains.push(activeProject.deployment.customDomain);
  }
  const hasCustomDomains = domains.some((d: string) => !d.endsWith('.code.xakteir.com'));

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-6 text-left">
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">DNS Hosting Console</h2>
          <p className="text-[10px] text-muted-foreground italic leading-relaxed">Route domains and edit zone files. Link custom domains to your published applications.</p>
        </div>

        {/* 1. Target Custom Domain setup */}
        <section className="bg-zinc-900/40 border border-white/5 rounded-2.5xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest">
            <Globe className="w-4.5 h-4.5" /> 1. Connected Domains
          </div>
          <p className="text-[10px] text-white/40 italic font-medium leading-normal">Your project automatically receives a free subdomain. You can add additional custom domains below.</p>
          
          <div className="flex gap-2 max-w-md">
            <Input 
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="e.g. app.myportfolio.com" 
              className="bg-black border-white/10 h-10 text-xs font-bold text-white focus:border-sky-500" 
            />
            <Button onClick={handleAddDomain} disabled={!customDomain.trim()} className="bg-sky-600 hover:bg-sky-500 rounded-xl h-10 px-5 font-black uppercase text-[10px] text-white shrink-0">Add Domain</Button>
          </div>

          {domains.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {domains.map((domain: string) => {
                const isDefault = domain.endsWith('.code.xakteir.com');
                return (
                  <div key={domain} className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-3 text-[10px] font-mono flex items-center justify-between text-sky-300">
                    <span className="flex items-center gap-2">
                      <strong className="text-white">{domain}</strong>
                      {isDefault && <Badge variant="outline" className="border-sky-500/30 text-sky-400 text-[7px] px-1 font-mono">DEFAULT</Badge>}
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-sky-500/30 text-sky-400 text-[8px] font-mono">ACTIVE</Badge>
                      {!isDefault && (
                        <button onClick={() => handleRemoveDomain(domain)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {hasCustomDomains && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 2. Nameservers Delegation */}
            <section className="bg-zinc-900/40 border border-white/5 rounded-2.5xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest"><Server className="w-4.5 h-4.5" /> 2. Nameservers Delegation</span>
                  <Badge className={`text-[7px] px-2 font-black border-none ${isDelegated ? "bg-green-500 text-white" : "bg-amber-500 text-black"}`}>
                    {isDelegated ? "DELEGATED ACTIVE" : "PENDING DELEGATION"}
                  </Badge>
                </div>
                <p className="text-[10px] text-white/40 italic font-medium leading-relaxed">
                  Go to your domain registrar (Namecheap, GoDaddy, Hover, etc.) and replace your current nameservers with:
                </p>
                <div className="font-mono text-[9.5px] bg-black/50 p-3 rounded-xl border border-white/5 space-y-1.5 select-all">
                  <div className="flex justify-between text-white"><span>ns1.xakteir.com</span><span className="text-[7.5px] text-white/20">PRIMARY NS</span></div>
                  <div className="flex justify-between text-white"><span>ns2.xakteir.com</span><span className="text-[7.5px] text-white/20">SECONDARY NS</span></div>
                </div>

                {liveNameservers.length > 0 && (
                  <div className="pt-2 font-mono text-[9px] text-white/50">
                    <span className="font-black uppercase text-white/30 block mb-1">Current Resolved Nameservers:</span>
                    {liveNameservers.join(', ')}
                  </div>
                )}
              </div>

              <Button 
                onClick={checkNameservers} 
                disabled={checkingNS}
                variant="outline" 
                className="w-full h-9 text-[9px] font-black uppercase border-white/10 hover:bg-white/5 text-white rounded-xl"
              >
                {checkingNS ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />} Query Registrar Live Delegation
              </Button>
            </section>

            {/* 3. TXT Backup challenge */}
            <section className="bg-zinc-900/40 border border-white/5 rounded-2.5xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest"><ShieldCheck className="w-4.5 h-4.5" /> 3. Ownership Challenge</span>
                  <Badge className={`text-[7px] px-2 font-black border-none ${activeProject.deployment.isVerified ? "bg-green-500 text-white" : "bg-amber-500 text-black"}`}>
                    {activeProject.deployment.isVerified ? "VERIFIED" : "TXT PENDING"}
                  </Badge>
                </div>
                <p className="text-[10px] text-white/40 italic font-medium leading-relaxed">
                  As an alternative to nameserver delegation, create a TXT verification record at your domain host:
                </p>
                <div className="space-y-2.5 font-mono text-[9px]">
                  <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                    <span className="text-white/30 block text-[7px] uppercase font-sans mb-0.5">TXT Hostname</span>
                    <span className="text-white select-all">_xakteir-challenge.{activeProject.deployment.customDomain}</span>
                  </div>
                  <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                    <span className="text-white/30 block text-[7px] uppercase font-sans mb-0.5">TXT Value / Key</span>
                    <span className="text-white select-all">{activeProject.deployment.verificationCode || `xak-verify-${activeProject.id}`}</span>
                  </div>
                </div>
              </div>

              {!activeProject.deployment.isVerified ? (
                <Button 
                  onClick={verifyDNS} 
                  disabled={isVerifyingDNS} 
                  className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[9px] rounded-xl flex items-center justify-center gap-1.5 shadow-xl shadow-amber-900/10"
                >
                  {isVerifyingDNS ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verify Ownership Challenge
                </Button>
              ) : (
                <div className="flex gap-2 items-center bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl text-green-400 text-[10px] font-black justify-center">
                  <Check className="w-4.5 h-4.5 text-green-500" /> DNS Domain Active & Secure!
                </div>
              )}
            </section>

          </div>
        )}

        {/* 4. Custom Zone Editor table */}
        {activeProject?.deployment?.customDomain && (
          <section className="bg-zinc-900/40 border border-white/5 rounded-2.5xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sky-400 font-bold uppercase text-xs tracking-widest"><Layers className="w-4.5 h-4.5" /> 4. Custom DNS Zone Records</span>
              <Badge variant="outline" className="border-white/10 text-[8px] font-mono">XAK DNS ZONE</Badge>
            </div>

            {/* Active Records List */}
            <div className="space-y-2">
              {(activeProject.dnsRecords || []).length === 0 ? (
                <p className="text-[10px] text-white/20 italic text-center py-6">No custom records configured in this zone file.</p>
              ) : (
                (activeProject.dnsRecords || []).map((rec: any) => (
                  <div key={rec.id} className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-[10px] font-mono">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-sky-500/15 text-sky-400 text-[8px] px-1.5 py-0 border border-sky-500/10 font-mono">{rec.type}</Badge>
                        <span className="font-black text-white">{rec.name}</span>
                      </div>
                      <p className="text-white/40 truncate w-96">{rec.value}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] text-white/30 font-bold">{rec.ttl}s TTL</span>
                      <button 
                        onClick={() => handleDeleteDnsRecord(rec.id)}
                        className="text-rose-500 hover:text-rose-400 p-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Record Form */}
            <form onSubmit={onSubmitDnsRecord} className="border-t border-white/5 pt-4 space-y-4 text-left">
              <span className="text-[9px] font-black uppercase text-white/40 ml-1 block">Add Zone Record</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select 
                  value={newRecordType}
                  onChange={(e: any) => setNewRecordType(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl text-[10px] p-2.5 h-10 text-white font-bold outline-none cursor-pointer"
                >
                  <option value="A">A</option>
                  <option value="CNAME">CNAME</option>
                  <option value="TXT">TXT</option>
                  <option value="MX">MX</option>
                </select>
                
                <Input 
                  value={newRecordName}
                  onChange={(e) => setNewRecordName(e.target.value)}
                  placeholder="HostName (@, www, api)" 
                  className="bg-black border-white/10 h-10 text-[10px] font-bold text-white sm:col-span-2 focus:border-sky-500"
                />

                <Input 
                  value={newRecordTTL}
                  onChange={(e) => setNewRecordTTL(Number(e.target.value) || 3600)}
                  placeholder="TTL (3600)"
                  type="number"
                  className="bg-black border-white/10 h-10 text-[10px] font-bold text-white focus:border-sky-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Input 
                  value={newRecordValue}
                  onChange={(e) => setNewRecordValue(e.target.value)}
                  placeholder="Points to value (IPv4 target or domain name canonical)" 
                  className="bg-black border-white/10 h-10 text-[10px] font-bold text-white flex-1 focus:border-sky-500"
                />
                <Button 
                  type="submit" 
                  disabled={!newRecordName.trim() || !newRecordValue.trim()}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-black uppercase text-[10px] h-10 px-5 rounded-xl shrink-0"
                >
                  Commit Record
                </Button>
              </div>
            </form>
          </section>
        )}

      </div>
    </div>
  );
}
