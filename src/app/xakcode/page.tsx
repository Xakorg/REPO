'use client';

import { useXakcodeAuth } from '@/contexts/xakcode-auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Github, LogOut, Settings, GitBranch, Code2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function XakcodeApp() {
  const { session, authState, user, connectGitHub, signOut, isLoading } = useXakcodeAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-white font-bold uppercase tracking-widest text-sm">Loading Xakcode...</p>
        </div>
      </div>
    );
  }

  // Not authenticated at all - show landing page
  if (authState === 'none') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 mesh-background" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 arcade-grid opacity-5" />

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl text-center space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
              <Code2 className="w-20 h-20 text-primary mx-auto" />
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white">
                Xakcode
              </h1>
              <p className="text-xl text-white/70 font-bold uppercase tracking-widest">Code Editor</p>
            </div>

            <div className="space-y-6 bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-sm">
              <h2 className="text-3xl font-black uppercase text-white">
                To access most features on Xakcode, please connect your GitHub account.
              </h2>
              <p className="text-white/60 text-lg">You can browse public repositories without signing in, but to create, fork, or edit code, you'll need to authenticate.</p>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Link href="/auth" className="flex-1">
                  <Button className="w-full h-16 bg-primary text-black hover:bg-primary/90 text-lg font-black uppercase rounded-2xl">
                    Sign In to Xakteir
                  </Button>
                </Link>
                <Link href="/xakcode/browse" className="flex-1">
                  <Button variant="outline" className="w-full h-16 border-white/20 bg-white/5 text-white hover:bg-white/10 text-lg font-black uppercase rounded-2xl">
                    Skip for Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated to Xakteir but GitHub not connected
  if (authState === 'xakteir') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 mesh-background" />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-3xl w-full space-y-12">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Welcome, {user?.xakcodeUsername}</h1>
                <p className="text-white/50 font-bold uppercase tracking-widest">Xakteir Authenticated</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-white/50 hover:text-white">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            {/* GitHub Connection Card */}
            <Card className="glass-card p-12 border-white/10 bg-white/5 rounded-[3rem] space-y-8">
              <div className="flex items-start gap-6">
                <Github className="w-12 h-12 text-primary mt-2" />
                <div className="flex-1 space-y-2">
                  <h2 className="text-3xl font-black uppercase text-white">Connect GitHub</h2>
                  <p className="text-white/60 text-lg">To unlock the full power of Xakcode, connect your GitHub account. This enables creating repos, forking, editing code, and more.</p>
                </div>
              </div>

              <div className="bg-black/50 border border-primary/30 rounded-2xl p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-white font-bold">What you can do:</p>
                    <ul className="text-white/70 text-sm mt-2 space-y-1">
                      <li>✓ Create new repositories</li>
                      <li>✓ Fork existing projects</li>
                      <li>✓ Edit and commit code</li>
                      <li>✓ Manage branches and pull requests</li>
                      <li>✓ Collaborate with others</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => connectGitHub()} className="flex-1 h-16 bg-primary text-black hover:bg-primary/90 text-lg font-black uppercase rounded-2xl flex items-center justify-center gap-3">
                  <Github className="w-5 h-5" />
                  Connect GitHub
                </Button>
                <Link href="/xakcode/browse" className="flex-1">
                  <Button variant="outline" className="w-full h-16 border-white/20 bg-white/5 hover:bg-white/10 text-white text-lg font-black uppercase rounded-2xl">
                    Browse Repos
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fully authenticated - GitHub connected
  if (authState === 'full') {
    return (
      <div className="min-h-screen bg-black">
        <div className="absolute inset-0 mesh-background opacity-50" />
        
        <div className="relative z-10">
          {/* Navigation */}
          <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Code2 className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Xakcode</h1>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                  {user?.githubAvatarUrl && (
                    <img src={user.githubAvatarUrl} alt="GitHub" className="w-6 h-6 rounded-full" />
                  )}
                  <div className="text-sm">
                    <p className="text-white font-bold">{user?.githubUsername}</p>
                    <p className="text-white/50 text-xs uppercase tracking-widest">GitHub Connected</p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="max-w-7xl mx-auto p-6 space-y-12">
            {/* Welcome Section */}
            <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Ready to Code</h2>
              <p className="text-lg text-white/60">You have full access to Xakcode. Start creating, forking, and editing your repositories.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: GitBranch, label: 'Create Repository', desc: 'Start a new project' },
                { icon: Code2, label: 'Open Editor', desc: 'Edit your code' },
                { icon: Github, label: 'My Repositories', desc: 'View your repos' },
                { icon: Settings, label: 'Settings', desc: 'Manage account' },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <Card key={i} className="glass-card p-6 border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer rounded-2xl transition-all group">
                    <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform mb-4" />
                    <h3 className="font-black text-white uppercase text-sm">{action.label}</h3>
                    <p className="text-white/50 text-xs mt-1">{action.desc}</p>
                  </Card>
                );
              })}
            </div>

            {/* Code Editor Placeholder */}
            <Card className="glass-card p-12 border-white/10 bg-gradient-to-br from-black to-black/50 rounded-[2.5rem] h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Code2 className="w-16 h-16 text-primary/50 mx-auto" />
                <p className="text-white/50 font-bold uppercase tracking-widest">Code Editor Coming Soon</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
