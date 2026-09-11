'use client';

import { useState } from 'react';
import { useXakcodeAuth } from '@/contexts/xakcode-auth-context';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Github, Eye, Star, GitFork } from 'lucide-react';
import { AuthStatusBadge } from '@/components/xakcode/auth-status-badge';

export default function BrowsePage() {
  const { authState, isLoading } = useXakcodeAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [repositories, setRepositories] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=12`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.items || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 mesh-background opacity-50" />

      <div className="relative z-10 max-w-6xl mx-auto p-6 space-y-12">
        {/* Header */}
        <div className="space-y-2 sticky top-6 z-40">
          <div className="flex items-center justify-between">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Browse Repositories</h1>
            <AuthStatusBadge />
          </div>
          <p className="text-white/60 text-lg">Explore and read public repositories from GitHub</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full h-16 bg-white/5 border border-white/10 pl-14 pr-6 rounded-2xl text-white placeholder:text-white/40 focus:border-primary/50 text-lg font-bold"
            />
          </div>
          <Button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="w-full h-14 bg-primary text-black hover:bg-primary/90 rounded-2xl font-black uppercase text-sm"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>Search</>>
            )}
          </Button>
        </form>

        {/* Results Grid */}
        {repositories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <Card key={repo.id} className="glass-card p-6 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group cursor-pointer">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-white uppercase truncate group-hover:text-primary transition-colors">
                        {repo.owner.login} / {repo.name}
                      </h3>
                      <p className="text-white/50 text-xs mt-1 truncate">Powered by GitHub API</p>
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
                    <div className="ml-auto px-2 py-1 bg-white/10 rounded text-xs font-bold uppercase">
                      {repo.language || 'Unknown'}
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-10 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-black uppercase"
                  >
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-3 h-3 mr-2" />
                      View on GitHub
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!searching && repositories.length === 0 && searchQuery && (
          <div className="text-center py-20">
            <p className="text-white/50 text-lg">No repositories found. Try a different search.</p>
          </div>
        )}

        {!searching && repositories.length === 0 && !searchQuery && (
          <Card className="glass-card p-12 border-white/10 bg-white/5 rounded-[2.5rem] text-center space-y-4">
            <Github className="w-16 h-16 text-primary/50 mx-auto" />
            <p className="text-white/50 font-bold uppercase tracking-widest">Search for repositories to get started</p>
          </Card>
        )}
      </div>
    </div>
  );
}
