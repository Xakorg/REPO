"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, UserCheck, ShieldAlert, LayoutGrid, UserMinus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useDevCentreStore, TeamMember } from "@/lib/dev-centre-store";

export default function TeamsBlade() {
  const { toast } = useToast();
  const { activeProjectId, teamMembers, addTeamMember, removeTeamMember, updateTeamMemberRole } = useDevCentreStore();

  const [newEmail, setNewEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamMember['role']>("Viewer");

  const projectMembers = teamMembers.filter(m => m.projectId === activeProjectId);

  const handleInviteMember = () => {
    if (!activeProjectId || !newEmail.trim()) return;
    if (!newEmail.includes("@")) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }
    
    // Prevent duplicates
    if (projectMembers.find(m => m.email === newEmail.trim())) {
      toast({ variant: "destructive", title: "Already a Member", description: "This user is already in the project." });
      return;
    }

    addTeamMember(activeProjectId, newEmail.trim(), selectedRole);
    setNewEmail("");
    setSelectedRole("Viewer");
    toast({ title: "Invitation Sent", description: `Added ${newEmail} to the project.` });
  };

  if (!activeProjectId) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="w-24 h-24 mx-auto bg-zinc-900/50 rounded-full flex items-center justify-center border border-white/5">
          <LayoutGrid className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-400">No Project Selected</h3>
        <p className="text-zinc-500 max-w-sm mx-auto">Select or create a project from the top left dropdown to manage its Team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Users className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Project Team</h1>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-1">Access Management for this Sandbox</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-start">
        
        <div className="space-y-8 sticky top-8">
          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 space-y-8 shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Invite Member</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Developer Email</label>
                <Input 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="dev@example.com" 
                  className="bg-black/50 border-white/10 h-14 rounded-2xl text-white font-bold px-5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Role</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 h-14 rounded-2xl text-white font-bold px-5 appearance-none outline-none focus:border-indigo-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <Button onClick={handleInviteMember} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-xs tracking-widest h-14 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02]">
                <Plus className="w-5 h-5 mr-3" /> Add Member
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="glass-card rounded-[2rem] p-10 border-2 border-white/5 bg-black/40 shadow-2xl min-h-[500px]">
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Active Members</h3>
              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-black px-4 py-1">{projectMembers.length} Members</Badge>
            </div>
            
            <div className="space-y-4">
              {projectMembers.map((member) => (
                <div key={member.id} className="p-6 bg-zinc-950/60 border-2 border-white/5 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group flex flex-col gap-6 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <UserCheck className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xl tracking-tight">{member.email}</h4>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-1">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {member.role === 'Owner' ? (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-4 py-1 font-black uppercase flex items-center gap-2">
                          <Shield className="w-3 h-3" /> Owner
                        </Badge>
                      ) : (
                        <select 
                          value={member.role}
                          onChange={(e) => updateTeamMemberRole(member.id, e.target.value as any)}
                          className="bg-black border border-white/10 text-white font-bold text-xs px-3 py-2 rounded-lg outline-none"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Editor">Editor</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      )}
                      
                      {member.role !== 'Owner' && (
                        <Button onClick={() => removeTeamMember(member.id)} variant="ghost" size="icon" className="w-10 h-10 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                          <UserMinus className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {projectMembers.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 text-zinc-500 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
                  <ShieldAlert className="w-16 h-16 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest">No members found.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
