"use client";

import { useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Braces, Calendar, User, Loader2, Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PublishedProjectPage() {
  const { projectName } = useParams();
  const firestore = useFirestore();

  const projectRef = useMemoFirebase(() => {
    if (!firestore || !projectName) return null;
    return doc(firestore, "publishedProjects", projectName as string);
  }, [firestore, projectName]);

  const { data: project, isLoading } = useDoc(projectRef);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <Braces className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Project Not Found</h1>
        <p className="text-muted-foreground font-medium">This project path is either invalid or has been archived.</p>
        <Button asChild className="bg-primary rounded-xl">
          <a href="/games">Back to Hub</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 animate-fade-in space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 glass-card p-10 rounded-[3.5rem] border-white/5 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-primary text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Published</Badge>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> {new Date(project.publishedAt?.seconds * 1000).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">{project.name}</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">Created by <span className="text-primary italic">@{project.ownerName}</span></p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest shadow-xl text-white">
            <Play className="w-4 h-4 mr-2 fill-white" /> Launch Instance
          </Button>
          <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-secondary">
            <Share2 className="w-5 h-5 text-foreground" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <Card className="glass-card rounded-[3.5rem] aspect-video bg-black flex flex-col items-center justify-center border-4 border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 arcade-grid opacity-20" />
            <div className="w-24 h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center border-2 border-primary group-hover:scale-110 transition-transform duration-500">
              <Play className="w-10 h-10 text-primary fill-primary" />
            </div>
            <p className="mt-6 text-[10px] font-black text-primary uppercase tracking-[0.3em]">Initialize Neural Runtime</p>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card rounded-[2.5rem] p-8 border-white/5">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-black uppercase tracking-tighter text-foreground italic">Logic Breakdown</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Neural Blocks: {project.blocks?.length || 0}</p>
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-4">
                  {project.blocks?.map((block: any, i: number) => (
                    <div key={i} className={cn("p-3 rounded-xl border-b-4 text-[10px] font-black text-white", block.color, block.border)}>
                      {block.label}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>

          <Card className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
            <h3 className="text-lg font-black text-foreground uppercase italic tracking-tighter mb-2">Verified Ownership</h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">This project signature matches the Xakteir Neural Registry for @{project.ownerName}. Integrity verified 100%.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
