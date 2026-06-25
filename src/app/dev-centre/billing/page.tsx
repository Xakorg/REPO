"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Zap, ArrowRight, ShieldCheck, ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function BillingBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  
  const { data: devAccount } = useDoc(devAccountRef);

  const handleUpgrade = async (tier: string) => {
    toast({ 
      title: "Coming Soon!", 
      description: `XakPay integration for ${tier} is currently under development.` 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Billing & Subscriptions</h1>
          <p className="text-xs text-zinc-400">Manage your Dev Centre quota, payment methods, and XakPay integration.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Free / Developer Tier */}
        <Card className="p-8 bg-zinc-950/40 border-2 border-white/5 rounded-3xl flex flex-col relative overflow-hidden">
          {devAccount?.tier === "Standard Developer" && (
            <div className="absolute top-0 right-0 bg-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 px-4 py-1 rounded-bl-xl">
              Current Plan
            </div>
          )}
          <div className="mb-6 space-y-2">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Developer</h3>
            <p className="text-xs text-zinc-400 h-8">Perfect for prototyping and personal projects.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-white">$0</span>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest ml-2">/ month</span>
          </div>
          <div className="space-y-4 flex-1">
            <FeatureItem text="100 Concurrent Socket Connections" />
            <FeatureItem text="5 Xakteir Edge Functions" />
            <FeatureItem text="1 GB Cloud Storage" />
            <FeatureItem text="Basic Email Routing" />
            <FeatureItem text="Community Support" />
          </div>
          <Button 
            disabled={devAccount?.tier === "Standard Developer"}
            className="w-full mt-8 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl"
          >
            {devAccount?.tier === "Standard Developer" ? "Active" : "Downgrade"}
          </Button>
        </Card>

        {/* Pro Tier */}
        <Card className="p-8 bg-purple-500/5 border-2 border-purple-500/30 rounded-3xl flex flex-col relative overflow-hidden shadow-2xl shadow-purple-500/10 scale-[1.02]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-sky-500" />
          <div className="absolute top-0 right-0 bg-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-400 px-4 py-1 rounded-bl-xl border-b border-l border-purple-500/20">
            Recommended
          </div>
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2">
              <ZapIcon className="w-5 h-5 text-purple-400 fill-purple-400/20" />
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Pro</h3>
            </div>
            <p className="text-xs text-purple-200/60 h-8">For production apps with active users.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-white">$29</span>
            <span className="text-xs text-purple-500/80 font-bold uppercase tracking-widest ml-2">/ month</span>
          </div>
          <div className="space-y-4 flex-1">
            <FeatureItem text="1,000 Concurrent Connections" highlight />
            <FeatureItem text="Unlimited Edge Functions" highlight />
            <FeatureItem text="50 GB Cloud Storage" highlight />
            <FeatureItem text="Advanced Analytics & Webhooks" />
            <FeatureItem text="Priority Email Support" />
          </div>
          <Button 
            disabled={devAccount?.tier === "Xakteir Dev Pro"}
            onClick={() => handleUpgrade("Xakteir Dev Pro")}
            className="w-full mt-8 bg-purple-500 hover:bg-purple-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl group"
          >
            {devAccount?.tier === "Xakteir Dev Pro" ? "Active" : "Upgrade to Pro"} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Card>

        {/* Enterprise Tier */}
        <Card className="p-8 bg-zinc-950/40 border-2 border-white/5 rounded-3xl flex flex-col relative overflow-hidden">
          <div className="mb-6 space-y-2">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Enterprise</h3>
            <p className="text-xs text-zinc-400 h-8">Custom infrastructure for massive scale.</p>
          </div>
          <div className="mb-8">
            <span className="text-4xl font-black text-white">Custom</span>
          </div>
          <div className="space-y-4 flex-1">
            <FeatureItem text="10,000+ Concurrent Connections" />
            <FeatureItem text="Dedicated Servers" />
            <FeatureItem text="Multi-region Active-Active DBs" />
            <FeatureItem text="24/7 Phone Support & SLA" />
            <FeatureItem text="SSO / SAML Integrations" />
          </div>
          <Button 
            onClick={() => toast({ title: "Contact Sales", description: "An account executive will reach out." })}
            className="w-full mt-8 bg-white text-black hover:bg-zinc-200 font-black uppercase text-xs tracking-widest h-12 rounded-xl"
          >
            Contact Sales
          </Button>
        </Card>

      </div>

      <div className="pt-8">
        <Card className="p-6 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Secure Payments by XakPay</p>
              <p className="text-xs text-zinc-500 mt-1">Your billing information is encrypted and securely processed by Stripe.</p>
            </div>
          </div>
          <Button variant="outline" className="border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest">
            Manage Payment Methods
          </Button>
        </Card>
      </div>

    </div>
  );
}

function FeatureItem({ text, highlight = false }: { text: string, highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 shrink-0 rounded-full p-0.5 ${highlight ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-zinc-400'}`}>
        <Check className="w-3 h-3" strokeWidth={3} />
      </div>
      <span className={`text-sm ${highlight ? 'text-zinc-200 font-bold' : 'text-zinc-400'}`}>{text}</span>
    </div>
  );
}
