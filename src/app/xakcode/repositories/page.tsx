'use client';

import { useState, useEffect } from 'react';
import { useXakcodeAuth } from '@/contexts/xakcode-auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Github, Search, Star, GitFork, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Repository {
  id: number;
  name: string;
  description: string;
  url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  private: boolean;
}

export default function RepositoriesPage() {
  const { authState, user } = useXakcodeAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authState === 'full') {
      fetchUserRepositories();
    }
  }, [authState]);

  const fetchUserRepositories = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from GitHub API using user's access token
      // This is where we'll integrate the actual GitHub API call
      
      // Temporary placeholder
      await new Promise(resolve => setTimeout(resolve, 500));
      setRepos([]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  if (authState !== 'full') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="glass-card p-8 border-white/10 bg-white/5 rounded-2xl max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase text-white text-center">GitHub Not Connected</h2>
          <p className="text-white/60 text-sm mt-4 text-center">You need to connect GitHub to view repositories.</p>
          <Link href="/xakcode">
            <Button className="w-full mt-6 bg-primary text-black hover:bg-primary/90">
              Go Back
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 mesh-background opacity-50" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Link href="/xakcode">
              <Button variant="ghost" className="text-white/50 hover:text-white mb-4">
                ← Back
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white">My Repositories</h1>
                <p className="text-white/60 mt-2">All your GitHub repositories in one place</p>
              </div>
              <Link href="/xakcode/create">
                <Button className="bg-primary text-black hover:bg-primary/90 font-black uppercase">
                  + New Repo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full h-12 bg-white/5 border border-white/10 pl-12 pr-4 rounded-lg text-white placeholder:text-white/30"
            />
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-white/60 font-bold uppercase tracking-widest">Loading repositories...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="glass-card p-6 border-rose-500/20 bg-rose-500/10 rounded-2xl">
              <p className="text-rose-400 font-bold">{error}</p>
              <Button onClick={fetchUserRepositories} className="mt-4 bg-primary text-black hover:bg-primary/90">
                Retry
              </Button>
            </Card>
          ) : repos.length === 0 ? (
            <Card className="glass-card p-12 border-white/10 bg-white/5 rounded-2xl text-center">
              <Github className="w-16 h-16 text-primary/50 mx-auto mb-4" />
              <h2 className="text-xl font-black uppercase text-white">No Repositories Yet</h2>
              <p className="text-white/60 mt-2">Create your first repository to get started</p>
              <Link href="/xakcode/create" className="inline-block mt-6">
                <Button className="bg-primary text-black hover:bg-primary/90">
                  Create Repository
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => (
                <Card key={repo.id} className="glass-card p-6 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group cursor-pointer">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-white uppercase truncate group-hover:text-primary transition-colors">
                          {repo.name}
                        </h3>
                        <p className="text-white/50 text-xs mt-1">
                          {repo.private ? '🔒 Private' : '🌐 Public'}
                        </p>
                      </div>
                      <Github className="w-5 h-5 text-primary flex-shrink-0" />
                    </div>

                    <p className="text-white/70 text-sm line-clamp-2">{repo.description || 'No description'}</p>

                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {repo.stargazers_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        {repo.forks_count}
                      </div>
                      {repo.language && (
                        <div className="ml-auto px-2 py-1 bg-white/10 rounded text-xs font-bold uppercase">
                          {repo.language}
                        </div>
                      )}
                    </div>

                    <Button
                      asChild
                      className="w-full h-10 bg-primary text-black hover:bg-primary/90 rounded-lg text-xs font-black uppercase"
                    >
                      <a href={`/xakcode/edit/${repo.name}`}>
                        Edit Repository
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
