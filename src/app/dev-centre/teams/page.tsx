"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, UserCheck, ShieldAlert, BadgeInfo, Mail, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function TeamsBlade() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [teamName, setTeamName] = useState("");
  const [teamMemberEmail, setTeamMemberEmail] = useState("");

  const devAccountRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "dev_accounts", user.uid);
  }, [firestore, user]);
  
  const { data: devAccount } = useDoc(devAccountRef);

  const handleCreateTeam = async () => {
    if (!firestore || !user || !teamName.trim() || !devAccountRef) return;
    try {
      const newTeam = {
        id: "team_" + Math.random().toString(36).substring(2, 7),
        name: teamName,
        role: "Owner",
        members: 1
      };
      await updateDoc(devAccountRef, {
        teams: arrayUnion(newTeam)
      });
      setTeamName("");
      toast({ title: "Team Created", description: `Team "${newTeam.name}" is now active.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleInviteMember = async () => {
    if (!teamMemberEmail.trim()) return;
    toast({ title: "Invitation Sent", description: `Invited ${teamMemberEmail} to your dev team.` });
    setTeamMemberEmail("");
  };

  if (!devAccount) return null;

  return (
    <div className="space-y-12 pb-32">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Users className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Teams</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-1">Identity & Access Management</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-start">
        
        <div className="space-y-8 sticky top-8">
          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 space-y-8 shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Create Workgroup</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Team Name</label>
                <Input 
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="e.g. Core Backend Team" 
                  className="bg-black/50 border-white/10 h-14 rounded-2xl text-white font-bold italic px-5"
                />
              </div>
              <Button onClick={handleCreateTeam} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-xs tracking-widest h-14 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02]">
                <Plus className="w-5 h-5 mr-3" /> Initialize Team
              </Button>
            </div>
          </Card>

          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 space-y-8 shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Invite Members</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Developer Email</label>
                <Input 
                  value={teamMemberEmail}
                  onChange={e => setTeamMemberEmail(e.target.value)}
                  placeholder="dev@example.com" 
                  className="bg-black/50 border-white/10 h-14 rounded-2xl text-white font-bold px-5"
                />
              </div>
              <Button onClick={handleInviteMember} variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white font-black uppercase text-xs tracking-widest h-14 rounded-2xl transition-all">
                <UserCheck className="w-5 h-5 mr-3 text-indigo-400" /> Send Invite
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 shadow-2xl min-h-[500px]">
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Your Organizations</h3>
              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-black px-4 py-1">{devAccount.teams?.length || 0} Teams</Badge>
            </div>
            
            <div className="space-y-4">
              {devAccount.teams?.map((team: any, i: number) => (
                <div key={i} className="p-6 bg-zinc-950/60 border-2 border-white/5 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group flex flex-col gap-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <Users className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xl uppercase tracking-tight">{team.name}</h4>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-1">
                          {team.members} Members • ID: {team.id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 font-black uppercase">
                        {team.role}
                      </Badge>
                      <Button variant="ghost" size="icon" className="w-10 h-10 text-zinc-500 hover:text-white rounded-xl">
                        <ExternalLink className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!devAccount.teams || devAccount.teams.length === 0) && (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 text-zinc-500 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                  <ShieldAlert className="w-16 h-16 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest">You are not part of any teams.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
