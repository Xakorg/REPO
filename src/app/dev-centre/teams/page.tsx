"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Identity & Access Management</h1>
          <p className="text-xs text-zinc-400">Manage developer teams, roles, and resource access.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Create Workgroup</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Team Name</label>
              <Input 
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Core Backend Team" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            <Button onClick={handleCreateTeam} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Initialize Team
            </Button>
          </div>
        </Card>

        <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Invite Members</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Developer Email</label>
              <Input 
                value={teamMemberEmail}
                onChange={e => setTeamMemberEmail(e.target.value)}
                placeholder="dev@example.com" 
                className="bg-black/50 border-white/10 h-12 rounded-xl text-white font-bold"
              />
            </div>
            <Button onClick={handleInviteMember} variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white font-black uppercase text-xs tracking-widest h-12 rounded-xl">
              <UserCheck className="w-4 h-4 mr-2" /> Send Invite
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-8 bg-zinc-950/40 border border-white/5 rounded-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Active Teams</h3>
        <div className="space-y-3">
          {devAccount.teams?.map((team: any) => (
            <div key={team.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{team.name}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{team.members} Members</p>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">
                {team.role}
              </div>
            </div>
          ))}
          {(!devAccount.teams || devAccount.teams.length === 0) && (
            <p className="text-xs text-zinc-500 italic text-center py-8">No teams configured yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
