"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, Sparkles, User, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContactPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [xakId, setXakId] = useState(user?.displayName?.replace(/^@+/, "") || "");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xakId.trim() || !message.trim() || !firestore) return;

    setLoading(true);
    try {
      await addDoc(collection(firestore, "contact_messages"), {
        xakId: xakId.trim(),
        userId: user?.uid || "anonymous",
        message: message.trim(),
        timestamp: serverTimestamp(),
        status: 'new'
      });
      
      toast({ title: "Message Sent", description: "Your message has been added to our support registry." });
      setMessage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not send message at this time." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-20 space-y-16 animate-fade-in px-6 text-foreground">
      <header className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none text-foreground">Contact Us</h1>
        <p className="text-sm font-bold uppercase tracking-[0.4em] text-muted-foreground/60">Connect with the App Admins</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <Card className="glass-card rounded-[4rem] p-12 border-white/10 shadow-2xl bg-black/40">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Your XakID</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <Input 
                    value={xakId}
                    onChange={(e) => setXakId(e.target.value)}
                    placeholder="Enter your XakID" 
                    className="bg-secondary/30 border-white/5 pl-14 h-16 rounded-[1.5rem] font-bold text-white" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Message</label>
                <Textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..." 
                  className="bg-secondary/30 border-white/5 rounded-[2.5rem] min-h-[250px] p-8 text-lg font-medium italic text-white" 
                  required 
                />
              </div>

              <Button disabled={loading || !message.trim()} className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase text-lg tracking-[0.3em] shadow-2xl text-white transition-all border-b-8 border-primary/20 active:border-b-0 active:translate-y-1">
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <span className="flex items-center gap-4">Send Message <Send className="w-6 h-6" /></span>}
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 bg-gradient-to-br from-primary/10 to-transparent shadow-xl">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8 text-white">Support Registry</h3>
            <div className="space-y-8">
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary transition-all">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Admin Team</p>
                  <p className="text-sm font-bold text-foreground italic">Professional Support</p>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary transition-all">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Response Method</p>
                  <p className="text-sm font-bold text-foreground italic">In-App Notifications</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card rounded-[3.5rem] p-10 border-white/10 shadow-xl text-center space-y-4 bg-black/40">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Response Speed</p>
            <p className="text-4xl font-black text-white italic tracking-tighter leading-none">~24h</p>
            <p className="text-xs font-bold text-primary uppercase">Direct Message</p>
          </Card>
        </div>
      </div>
    </div>
  );
}