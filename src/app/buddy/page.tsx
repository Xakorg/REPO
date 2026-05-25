"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Pizza, 
  Gamepad2, 
  Smile, 
  Ghost,
  Cat,
  Dog,
  Rabbit,
  Loader2,
  Plus,
  Trash2,
  Zap,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, serverTimestamp, query, limit, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useOnboarding } from "@/components/OnboardingProvider";

const PET_TYPES = [
  { id: 'cat', icon: Cat, name: 'Xak-Cat', color: 'text-primary' },
  { id: 'dog', icon: Dog, name: 'Xak-Dog', color: 'text-blue-400' },
  { id: 'rabbit', icon: Rabbit, name: 'Xak-Bunny', color: 'text-pink-400' },
  { id: 'ghost', icon: Ghost, name: 'Xak-Ghost', color: 'text-emerald-400' },
];

export default function XakBuddyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { activeStep, completeAction } = useOnboarding();

  const [activeTab, setActiveTab] = useState("my-pets");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("cat");
  const [isCreating, setIsCreating] = useState(false);

  const buddiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "buddies"), limit(50));
  }, [firestore]);

  const { data: allBuddies, isLoading: isBuddiesLoading } = useCollection(buddiesQuery);
  
  const myPets = allBuddies?.filter(b => b.ownerId === user?.uid) || [];
  const onlinePets = allBuddies?.filter(b => b.ownerId !== user?.uid) || [];

  const activePet = myPets.find(p => p.id === selectedPetId) || myPets[0];

  useEffect(() => {
    if (myPets.length > 0 && !selectedPetId) {
      setSelectedPetId(myPets[0].id);
    }
  }, [myPets, selectedPetId]);

  const handleCreatePet = async () => {
    if (!user || !firestore || !newPetName.trim()) return;
    setIsCreating(true);
    try {
      const cleanOwnerName = user.displayName?.replace(/^@+/, "") || "Member";
      await addDoc(collection(firestore, "buddies"), {
        name: newPetName,
        type: newPetType,
        ownerId: user.uid,
        ownerName: cleanOwnerName,
        hunger: 50,
        happiness: 50,
        level: 1,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        posX: 10 + Math.random() * 80,
        posY: 10 + Math.random() * 80
      });
      toast({ title: "New Buddy!", description: `${newPetName} has joined your family!` });
      setNewPetName("");
      setIsCreating(false);
      completeAction('buddy');
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Oops!", description: "Could not create buddy right now." });
      setIsCreating(false);
    }
  };

  const updatePet = async (petId: string, changes: any) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "buddies", petId), {
        ...changes,
        updatedAt: serverTimestamp()
      });
      completeAction('buddy');
    } catch (e) {
      console.error(e);
    }
  };

  const handleFeed = () => {
    if (!activePet) return;
    if (activePet.hunger >= 100) {
      toast({ title: "Full!", description: `${activePet.name} is too full to eat!` });
      return;
    }
    updatePet(activePet.id, { hunger: Math.min(100, activePet.hunger + 20) });
    toast({ title: "Yum!", description: `You fed ${activePet.name}!` });
  };

  const handlePlay = () => {
    if (!activePet) return;
    updatePet(activePet.id, { 
      happiness: Math.min(100, activePet.happiness + 15), 
      hunger: Math.max(0, activePet.hunger - 10),
      level: activePet.happiness > 95 ? activePet.level + 1 : activePet.level
    });
    toast({ title: "Fun!", description: `You played with ${activePet.name}!` });
  };

  if (!user) return (
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-8 text-center animate-fade-in">
      <div className="w-32 h-32 rounded-[3rem] bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-2xl">
        <Ghost className="w-16 h-16 text-primary animate-pulse" />
      </div>
      <div className="space-y-4">
        <h1 className="text-6xl font-black uppercase italic tracking-tighter text-foreground">Meet Buddies</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-[10px]">Sign in to adopt your own magical friend!</p>
      </div>
      <Button asChild className="bg-primary hover:bg-primary/90 h-16 px-12 rounded-[2rem] font-black uppercase text-xs tracking-widest text-white shadow-xl">
        <a href="/auth">Join the Multiverse</a>
      </Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-12 animate-fade-in px-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 glass-card p-12 rounded-[4rem] border-4 border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 animate-float">
          <Heart className="w-80 h-80 -rotate-12 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-10 mb-4">
            <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-2xl animate-float">
              <Ghost className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-7xl font-black text-foreground tracking-tighter uppercase italic leading-none">XakBuddy</h1>
              <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mt-4 flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" /> Shared 3D Park Online
              </p>
            </div>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <div className="relative">
              {activeStep === 'buddy' && !activePet && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
                  <div className="flex flex-col items-center">
                    <div className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-2xl border-2 border-white/20 whitespace-nowrap">Adopt Here!</div>
                    <ArrowRight className="w-10 h-10 text-primary rotate-90 mt-2" />
                  </div>
                </div>
              )}
              <Button className="bg-primary hover:bg-primary/90 h-16 px-10 rounded-[1.8rem] font-black uppercase text-xs tracking-widest text-white shadow-xl border-4 border-white/10 relative z-10 transition-all active:scale-95">
                <Plus className="w-5 h-5 mr-3" /> Adopt Buddy
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="glass-card border-4 border-white/20 rounded-[3rem] max-w-md text-foreground shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">New Friend</DialogTitle></DialogHeader>
            <div className="space-y-8 py-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Pick a Name</label>
                <Input value={newPetName} onChange={(e) => setNewPetName(e.target.value)} placeholder="e.g. Sparky" className="h-14 rounded-2xl bg-secondary/30 border-4 border-white/10 font-bold px-6" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Buddy Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {PET_TYPES.map(type => (
                    <button key={type.id} onClick={() => setNewPetType(type.id)} className={cn("aspect-square rounded-2xl border-4 flex items-center justify-center transition-all", newPetType === type.id ? "bg-primary text-white border-primary shadow-lg scale-110" : "bg-secondary/30 border-white/5 text-muted-foreground hover:bg-white/5")}>
                      <type.icon className="w-6 h-6" />
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreatePet} disabled={isCreating || !newPetName} className="w-full h-16 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase tracking-widest text-white shadow-xl border-4 border-white/10">
                {isCreating ? <Loader2 className="animate-spin w-6 h-6" /> : "Bring Home"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-secondary/30 p-2 rounded-[2.5rem] h-20 gap-4 border-4 border-white/10 shadow-xl w-full max-w-2xl mx-auto">
          <TabsTrigger value="my-pets" className="flex-1 rounded-[1.8rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">My Buddies</TabsTrigger>
          <TabsTrigger value="online-park" className="flex-1 rounded-[1.8rem] h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Online Park</TabsTrigger>
        </TabsList>

        <TabsContent value="my-pets" className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
          <div className="lg:col-span-3 space-y-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {myPets.map(pet => {
                  const TypeIcon = PET_TYPES.find(t => t.id === pet.type)?.icon || Cat;
                  return (
                    <Card key={pet.id} onClick={() => setSelectedPetId(pet.id)} className={cn("glass-card p-6 rounded-[2.5rem] cursor-pointer transition-all border-4", selectedPetId === pet.id ? "border-primary shadow-xl scale-[1.02]" : "border-white/5 hover:bg-white/5")}>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center border-2 border-white/5 shadow-inner text-primary"><TypeIcon className="w-6 h-6" /></div>
                        <div className="overflow-hidden">
                          <h4 className="text-xl font-black uppercase italic truncate leading-none">{pet.name}</h4>
                          <p className="text-[8px] font-black text-muted-foreground uppercase mt-1">Level {pet.level}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="lg:col-span-6">
            {activePet ? (
              <Card className="glass-card rounded-[4rem] aspect-square flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl border-4 border-white/10">
                <div className="absolute inset-0 arcade-grid opacity-10" />
                <div className={cn("relative transition-all duration-500", activePet.happiness > 80 ? "animate-float" : "animate-pulse")}>
                  {(() => {
                    const ActiveIcon = PET_TYPES.find(p => p.id === activePet.type)?.icon || Cat;
                    return <ActiveIcon className="w-64 h-64 text-primary drop-shadow-[0_0_50px_rgba(251,191,36,0.6)]" />;
                  })()}
                  <div className="absolute -top-10 -right-10 bg-white rounded-full p-4 shadow-xl animate-bounce text-4xl border-4 border-primary/20">{activePet.happiness > 70 ? "😊" : activePet.hunger < 30 ? "🍕?" : "😐"}</div>
                </div>
                <div className="mt-16 text-center space-y-3 relative z-10 px-10">
                  <h2 className="text-6xl font-black uppercase italic tracking-tighter text-foreground truncate w-full">{activePet.name}</h2>
                  <div className="flex items-center justify-center gap-4">
                    <Badge className="bg-primary text-white font-black uppercase tracking-widest px-6 py-1 rounded-full text-[10px] border-none shadow-lg">Rank {activePet.level}</Badge>
                    <button onClick={() => deleteDoc(doc(firestore!, "buddies", activePet.id))} className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-full"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center glass-card rounded-[4rem] border-4 border-dashed border-white/10 opacity-30 text-center p-20">
                <Ghost className="w-32 h-32 mb-6" /><h3 className="text-4xl font-black uppercase italic tracking-tighter">Adopt a Buddy!</h3>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-8 relative">
            {activePet && (
              <>
                {activeStep === 'buddy' && (
                  <div className="absolute -left-20 top-1/2 -translate-y-1/2 z-50 animate-bounce pointer-events-none">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-10 h-10 text-primary rotate-180 drop-shadow-2xl" />
                      <div className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-2xl border-2 border-white/20 whitespace-nowrap">Try feeding!</div>
                    </div>
                  </div>
                )}
                <Card className="glass-card rounded-[3rem] p-10 space-y-10 border-4 border-white/10 shadow-2xl">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-primary"><Pizza className="w-5 h-5" /> Hunger</span>
                        <span className="text-lg font-black italic">{activePet.hunger}%</span>
                      </div>
                      <Progress value={activePet.hunger} className="h-4 bg-secondary/30 rounded-full" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-rose-500"><Smile className="w-5 h-5" /> Happy</span>
                        <span className="text-lg font-black italic">{activePet.happiness}%</span>
                      </div>
                      <Progress value={activePet.happiness} className="h-4 bg-secondary/30 rounded-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <Button onClick={handleFeed} className="h-20 bg-primary hover:bg-primary/90 rounded-[2rem] flex items-center gap-4 px-10 shadow-xl transition-all group border-4 border-white/10">
                      <Pizza className="w-8 h-8 group-hover:rotate-12 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Feed Snack</span>
                    </Button>
                    <Button onClick={handlePlay} className="h-20 bg-rose-500 hover:bg-rose-400 rounded-[2rem] flex items-center gap-4 px-10 shadow-xl transition-all group border-4 border-white/10">
                      <Gamepad2 className="w-8 h-8 group-hover:-rotate-12 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Play Game</span>
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="online-park" className="animate-in fade-in duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-9">
              <Card className="glass-card rounded-[4rem] h-[700px] border-4 border-white/10 shadow-2xl relative overflow-hidden bg-black/40">
                <div className="absolute inset-0 origin-bottom" style={{ perspective: '1000px' }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" style={{ transform: 'rotateX(60deg) translateY(100px) scale(2.5)' }}>
                    <div className="w-full h-full arcade-grid opacity-20" />
                  </div>
                </div>
                <div className="relative h-full w-full p-10">
                  <header className="flex justify-between items-center mb-10 relative z-30">
                    <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border-2 border-white/10 shadow-2xl">
                      <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Online 3D Park</span>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-500 font-black border-4 border-amber-500/20 px-6 py-2 rounded-full uppercase tracking-widest text-[9px] shadow-lg">
                      {(onlinePets.length + myPets.length)} Buddies in Park
                    </Badge>
                  </header>
                  <div className="relative h-[500px] w-full">
                    {myPets.map((pet) => {
                      const TypeIcon = PET_TYPES.find(t => t.id === pet.type)?.icon || Cat;
                      return (
                        <div key={pet.id} className="absolute animate-float transition-all duration-1000 group cursor-help z-20" style={{ left: `${pet.posX || 50}%`, top: `${pet.posY || 50}%` }}>
                          <div className="relative">
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap bg-primary text-white px-4 py-2 rounded-2xl shadow-2xl z-20 border-2 border-white/20">
                              <p className="text-[10px] font-black uppercase italic">{pet.name} (You)</p>
                            </div>
                            <TypeIcon className="w-20 h-20 text-primary drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />
                          </div>
                        </div>
                      );
                    })}
                    {onlinePets.map((pet) => {
                      const TypeIcon = PET_TYPES.find(t => t.id === pet.type)?.icon || Cat;
                      return (
                        <div key={pet.id} className="absolute animate-wiggle transition-all duration-1000 group cursor-help z-10" style={{ left: `${pet.posX || 30}%`, top: `${pet.posY || 40}%` }}>
                          <div className="relative">
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap bg-black/80 backdrop-blur-xl text-white px-4 py-2 rounded-2xl shadow-2xl z-20 border-2 border-white/10">
                              <p className="text-[10px] font-black uppercase italic">{pet.name}</p>
                              <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Friend: @{pet.ownerName}</p>
                            </div>
                            <TypeIcon className="w-16 h-16 opacity-60 group-hover:opacity-100 transition-opacity text-white hover:text-primary drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-3 space-y-8">
              <Card className="glass-card rounded-[3rem] p-8 border-4 border-white/10 h-full flex flex-col shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-widest italic mb-8 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-500 animate-pulse" /> Hub Feed
                </h3>
                <ScrollArea className="flex-1">
                  <div className="space-y-6 pr-4">
                    {allBuddies?.slice(0, 15).map(pet => (
                      <div key={pet.id} className="flex items-start gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border-2 border-white/5 shadow-md group-hover:bg-primary/10 transition-colors">
                          <Smile className="w-5 h-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-medium leading-relaxed truncate">
                            <span className="font-black text-foreground uppercase italic mr-1">@{pet.ownerName}</span>
                            <span className="text-muted-foreground">is at the park with {pet.name}!</span>
                          </p>
                          <p className="text-[8px] font-black text-primary uppercase mt-1 tracking-widest">Active Now</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
