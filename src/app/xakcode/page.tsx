'use client';

import { useState } from 'react';
import { useXakcodeAuth } from '@/contexts/xakcode-auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Github, Code2, Plus, Settings, BarChart3, Zap } from 'lucide-react';
import Link from 'next/link';

export default function XakcodePage() {
  const { authState, isLoading, user, connectGitHub, signOut } = useXakcodeAuth();
  const [mounted, setMounted] = useState(false);

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
              <p className="text-xl text-white/70 font-bold uppercase tracking-widest">GitHub Code Editor</p>
            </div>

            <div className="space-y-6 bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-sm">
              <h2 className="text-3xl font-black uppercase text-white">
                Connect GitHub to Get Started
              </h2>
              <p className="text-white/60 text-lg">Create, edit, and manage your repositories directly from Xakcode. Full GitHub integration with a modern code editor.</p>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Link href="/auth" className="flex-1">
                  <Button className="w-full h-16 bg-primary text-black hover:bg-primary/90 text-lg font-black uppercase rounded-2xl">
                    Sign In to Xakteir
                  </Button>
                </Link>
                <Link href="/xakcode/browse" className="flex-1">
                  <Button variant="outline" className="w-full h-16 border-white/20 bg-white/5 text-white hover:bg-white/10 text-lg font-black uppercase rounded-2xl">
                    Browse Repos
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
            <div className="space-y-2">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Welcome, {user?.xakcodeUsername}</h1>
              <p className="text-white/50 font-bold uppercase tracking-widest">Xakteir Authenticated</p>
            </div>

            {/* GitHub Connection Card */}
            <Card className="glass-card p-12 border-white/10 bg-white/5 rounded-[3rem] space-y-8">
              <div className="flex items-start gap-6">
                <Github className="w-12 h-12 text-primary mt-2" />
                <div className="flex-1 space-y-2">
                  <h2 className="text-3xl font-black uppercase text-white">Connect GitHub</h2>
                  <p className="text-white/60 text-lg">Connect your GitHub account to unlock full Xakcode features. Create, fork, and edit repositories with ease.</p>
                </div>
              </div>

              <div className="bg-black/50 border border-primary/30 rounded-2xl p-6 space-y-3">
                <p className="text-white font-bold">What you can do:</p>
                <ul className="text-white/70 text-sm space-y-2">
                  <li>✓ Create new repositories</li>
                  <li>✓ Edit existing repositories</li>
                  <li>✓ Commit and push changes</li>
                  <li>✓ Manage branches</li>
                  <li>✓ View repository files</li>
                </ul>
              </div>

              <Button 
                onClick={() => connectGitHub()} 
                className="w-full h-16 bg-primary text-black hover:bg-primary/90 text-lg font-black uppercase rounded-2xl flex items-center justify-center gap-2"
              >
                <Github className="w-5 h-5" />
                Connect GitHub
              </Button>
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
          {/* Header */}
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

                <Link href="/xakcode/workspace">
                  <Button className="bg-primary text-black hover:bg-primary/90 font-black uppercase">
                    <Zap className="w-4 h-4 mr-2" />
                    Enter Workspace
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Dashboard */}
          <div className="max-w-7xl mx-auto p-6 space-y-12">
            {/* Welcome Section */}
            <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Ready to Code</h2>
              <p className="text-lg text-white/60">GitHub is connected. Choose an action below to get started.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Repository */}
              <Link href="/xakcode/create">
                <Card className="glass-card p-8 border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer rounded-2xl transition-all group h-full">
                  <Plus className="w-10 h-10 text-primary group-hover:scale-110 transition-transform mb-4" />
                  <h3 className="font-black text-white uppercase text-lg">Create Repository</h3>
                  <p className="text-white/50 text-sm mt-2">Start a brand new project</p>
                </Card>
              </Link>

              {/* My Repositories */}
              <Link href="/xakcode/repositories">
                <Card className="glass-card p-8 border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer rounded-2xl transition-all group h-full">
                  <Github className="w-10 h-10 text-primary group-hover:scale-110 transition-transform mb-4" />
                  <h3 className="font-black text-white uppercase text-lg">My Repositories</h3>
                  <p className="text-white/50 text-sm mt-2">View and edit your repos</p>
                </Card>
              </Link>

              {/* Workspace Settings */}
              <Link href="/xakcode/workspace-settings">
                <Card className="glass-card p-8 border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer rounded-2xl transition-all group h-full">
                  <Settings className="w-10 h-10 text-primary group-hover:scale-110 transition-transform mb-4" />
                  <h3 className="font-black text-white uppercase text-lg">Settings</h3>
                  <p className="text-white/50 text-sm mt-2">Preferences & configuration</p>
                </Card>
              </Link>
            </div>

            {/* Stats Section */}
            <Card className="glass-card p-8 border-white/10 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h3 className="font-black text-white uppercase">Your Statistics</h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-white/50 text-sm uppercase font-bold">Total Repositories</p>
                  <p className="text-3xl font-black text-white mt-2">—</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm uppercase font-bold">Active Projects</p>
                  <p className="text-3xl font-black text-white mt-2">—</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm uppercase font-bold">Last Updated</p>
                  <p className="text-3xl font-black text-white mt-2">—</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
