'use client';

import { useState, useEffect } from 'react';
import { useXakcodeAuth } from '@/contexts/xakcode-auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Github, Code2, AlertCircle, FileCode, Trash2, Plus, Save } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RepositoryFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
}

export default function EditRepositoryPage({ params }: { params: { repo: string } }) {
  const { authState, user } = useXakcodeAuth();
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<RepositoryFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const repoName = params.repo;

  useEffect(() => {
    if (authState === 'full') {
      fetchRepositoryFiles();
    }
  }, [authState, repoName]);

  const fetchRepositoryFiles = async () => {
    try {
      setLoading(true);
      // TODO: Fetch repository files from GitHub API
      // Using GitHub's contents API with the user's access token
      
      // Temporary placeholder
      await new Promise(resolve => setTimeout(resolve, 500));
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repository files');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      setSaving(true);
      // TODO: Commit file changes back to GitHub using GitHub API
      // This will use the GitHub Contents API with the commit message
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
      setError(err.message || 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  if (authState !== 'full') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="glass-card p-8 border-white/10 bg-white/5 rounded-2xl max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase text-white text-center">Access Denied</h2>
          <p className="text-white/60 text-sm mt-4 text-center">You need to be logged in to edit repositories.</p>
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
      
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/xakcode/repositories">
                <Button variant="ghost" className="text-white/50 hover:text-white">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-white">{repoName}</h1>
                <p className="text-white/50 text-xs uppercase tracking-widest">Editing {repoName}</p>
              </div>
            </div>
            <Button onClick={handleSaveFile} disabled={!selectedFile || saving} className="bg-primary text-black hover:bg-primary/90 font-black uppercase">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: File Explorer */}
          <div className="w-64 border-r border-white/10 bg-black/30 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-black uppercase text-white mb-3">Files</h3>
              <Button size="sm" className="w-full h-8 bg-primary text-black hover:bg-primary/90 text-xs font-black">
                <Plus className="w-3 h-3 mr-1" />
                Add File
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="p-4 text-center">
                <FileCode className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/40">No files found</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-bold uppercase transition-all ${
                      selectedFile?.path === file.path
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileCode className="w-3 h-3 inline mr-2" />
                    {file.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedFile ? (
              <>
                <div className="p-4 border-b border-white/10 bg-black/30">
                  <p className="text-xs text-white/60 uppercase tracking-widest">{selectedFile.path}</p>
                </div>
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="flex-1 bg-black/50 text-white font-mono text-sm p-4 resize-none focus:outline-none border-none"
                  placeholder="Select a file to edit..."
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Code2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 uppercase font-bold tracking-widest">Select a file to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border-t border-rose-500/20 px-6 py-3">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}