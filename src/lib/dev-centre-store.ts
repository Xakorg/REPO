import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Project = {
  id: string;
  name: string;
  createdAt: number;
};

export type AuthUser = {
  id: string;
  projectId: string;
  identifier: string; // Email, phone, etc.
  provider: string; // Password, Google, etc.
  createdAt: number;
  lastSignIn: number;
  disabled: boolean;
};

export type DbDocument = {
  id: string;
  data: Record<string, any>;
};

export type DbCollection = {
  id: string; // Collection name e.g. "users"
  projectId: string;
  documents: DbDocument[];
};

export type VM = {
  id: string;
  projectId: string;
  name: string;
  region: string;
  size: string;
  status: 'running' | 'stopped' | 'provisioning';
  createdAt: number;
};

export type Domain = {
  id: string;
  projectId: string;
  domain: string;
  status: 'verified' | 'pending' | 'failed';
  isPrimary: boolean;
};

export type TeamMember = {
  id: string;
  projectId: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  joinedAt: number;
};

export type EdgeFunction = {
  id: string;
  projectId: string;
  name: string;
  runtime: string;
  status: 'active' | 'deploying' | 'error';
  lastDeployed: number;
};

export type StorageBucket = {
  id: string;
  projectId: string;
  name: string;
  region: string;
  createdAt: number;
};

export type Webhook = {
  id: string;
  projectId: string;
  url: string;
  events: string[];
  active: boolean;
};

export type GitRepo = {
  id: string;
  projectId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  repoName: string;
  branch: string;
  connectedAt: number;
};

interface DevCentreState {
  projects: Project[];
  activeProjectId: string | null;
  authUsers: AuthUser[];
  collections: DbCollection[];
  vms: VM[];
  domains: Domain[];
  teamMembers: TeamMember[];
  functions: EdgeFunction[];
  buckets: StorageBucket[];
  webhooks: Webhook[];
  gitRepos: GitRepo[];
  
  // Project Actions
  createProject: (name: string) => void;
  setActiveProject: (id: string) => void;
  
  // Auth Actions
  addAuthUser: (projectId: string, user: Omit<AuthUser, 'id' | 'projectId' | 'createdAt' | 'lastSignIn'>) => void;
  deleteAuthUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  
  // DB Actions
  createCollection: (projectId: string, collectionId: string) => void;
  addDocument: (projectId: string, collectionId: string, data: Record<string, any>) => void;
  updateDocument: (projectId: string, collectionId: string, docId: string, data: Record<string, any>) => void;
  deleteDocument: (projectId: string, collectionId: string, docId: string) => void;

  // VMs Actions
  addVM: (projectId: string, vm: Omit<VM, 'id' | 'projectId' | 'createdAt' | 'status'>) => void;
  toggleVMStatus: (vmId: string) => void;
  deleteVM: (vmId: string) => void;

  // Domain Actions
  addDomain: (projectId: string, domain: string) => void;
  deleteDomain: (domainId: string) => void;
  setPrimaryDomain: (domainId: string) => void;

  // Team Actions
  addTeamMember: (projectId: string, email: string, role: TeamMember['role']) => void;
  removeTeamMember: (memberId: string) => void;
  updateTeamMemberRole: (memberId: string, role: TeamMember['role']) => void;

  // Function Actions
  addFunction: (projectId: string, name: string, runtime: string) => void;
  deleteFunction: (funcId: string) => void;

  // Storage Actions
  addBucket: (projectId: string, name: string, region: string) => void;
  deleteBucket: (bucketId: string) => void;

  // Webhook Actions
  addWebhook: (projectId: string, url: string, events: string[]) => void;
  toggleWebhook: (webhookId: string) => void;
  deleteWebhook: (webhookId: string) => void;

  // Git Actions
  linkGitRepo: (projectId: string, provider: GitRepo['provider'], repoName: string, branch: string) => void;
  unlinkGitRepo: (repoId: string) => void;
}

export const useDevCentreStore = create<DevCentreState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,
      authUsers: [],
      collections: [],
      vms: [],
      domains: [],
      teamMembers: [],
      functions: [],
      buckets: [],
      webhooks: [],
      gitRepos: [],

      // Projects
      createProject: (name) => set((state) => {
        const newProject = {
          id: `proj_${Math.random().toString(36).substring(2, 9)}`,
          name,
          createdAt: Date.now(),
        };
        // Also automatically add the creator as Owner
        const owner: TeamMember = {
          id: `tm_${Math.random().toString(36).substring(2, 11)}`,
          projectId: newProject.id,
          email: "you@xakteir.com",
          role: "Owner",
          joinedAt: Date.now(),
        };
        return {
          projects: [...state.projects, newProject],
          teamMembers: [...state.teamMembers, owner],
          activeProjectId: state.activeProjectId || newProject.id,
        };
      }),
      setActiveProject: (id) => set({ activeProjectId: id }),

      // Auth
      addAuthUser: (projectId, user) => set((state) => ({
        authUsers: [
          ...state.authUsers,
          {
            ...user,
            id: `user_${Math.random().toString(36).substring(2, 11)}`,
            projectId,
            createdAt: Date.now(),
            lastSignIn: Date.now(),
          }
        ]
      })),
      deleteAuthUser: (userId) => set((state) => ({
        authUsers: state.authUsers.filter(u => u.id !== userId)
      })),
      toggleUserStatus: (userId) => set((state) => ({
        authUsers: state.authUsers.map(u => 
          u.id === userId ? { ...u, disabled: !u.disabled } : u
        )
      })),

      // DB
      createCollection: (projectId, collectionId) => set((state) => {
        if (state.collections.find(c => c.id === collectionId && c.projectId === projectId)) return state;
        return {
          collections: [
            ...state.collections,
            { id: collectionId, projectId, documents: [] }
          ]
        };
      }),
      addDocument: (projectId, collectionId, data) => set((state) => ({
        collections: state.collections.map(c => {
          if (c.projectId === projectId && c.id === collectionId) {
            return {
              ...c,
              documents: [
                ...c.documents,
                { id: `doc_${Math.random().toString(36).substring(2, 11)}`, data }
              ]
            };
          }
          return c;
        })
      })),
      updateDocument: (projectId, collectionId, docId, data) => set((state) => ({
        collections: state.collections.map(c => {
          if (c.projectId === projectId && c.id === collectionId) {
            return {
              ...c,
              documents: c.documents.map(d => d.id === docId ? { ...d, data: { ...d.data, ...data } } : d)
            };
          }
          return c;
        })
      })),
      deleteDocument: (projectId, collectionId, docId) => set((state) => ({
        collections: state.collections.map(c => {
          if (c.projectId === projectId && c.id === collectionId) {
            return {
              ...c,
              documents: c.documents.filter(d => d.id !== docId)
            };
          }
          return c;
        })
      })),

      // VMs
      addVM: (projectId, vm) => set((state) => ({
        vms: [
          ...state.vms,
          {
            ...vm,
            id: `vm_${Math.random().toString(36).substring(2, 11)}`,
            projectId,
            status: 'running',
            createdAt: Date.now()
          }
        ]
      })),
      toggleVMStatus: (vmId) => set((state) => ({
        vms: state.vms.map(v => 
          v.id === vmId ? { ...v, status: v.status === 'running' ? 'stopped' : 'running' } : v
        )
      })),
      deleteVM: (vmId) => set((state) => ({
        vms: state.vms.filter(v => v.id !== vmId)
      })),

      // Domains
      addDomain: (projectId, domain) => set((state) => {
        const isFirst = !state.domains.find(d => d.projectId === projectId);
        return {
          domains: [
            ...state.domains,
            {
              id: `dom_${Math.random().toString(36).substring(2, 11)}`,
              projectId,
              domain,
              status: 'pending',
              isPrimary: isFirst
            }
          ]
        };
      }),
      deleteDomain: (domainId) => set((state) => ({
        domains: state.domains.filter(d => d.id !== domainId)
      })),
      setPrimaryDomain: (domainId) => set((state) => {
        const domainToMakePrimary = state.domains.find(d => d.id === domainId);
        if (!domainToMakePrimary) return state;
        return {
          domains: state.domains.map(d => 
            d.projectId === domainToMakePrimary.projectId
              ? { ...d, isPrimary: d.id === domainId }
              : d
          )
        };
      }),

      // Teams
      addTeamMember: (projectId, email, role) => set((state) => ({
        teamMembers: [
          ...state.teamMembers,
          {
            id: `tm_${Math.random().toString(36).substring(2, 11)}`,
            projectId,
            email,
            role,
            joinedAt: Date.now()
          }
        ]
      })),
      removeTeamMember: (memberId) => set((state) => ({
        teamMembers: state.teamMembers.filter(m => m.id !== memberId)
      })),
      updateTeamMemberRole: (memberId, role) => set((state) => ({
        teamMembers: state.teamMembers.map(m => 
          m.id === memberId ? { ...m, role } : m
        )
      })),

      // Functions
      addFunction: (projectId, name, runtime) => set((state) => ({
        functions: [
          ...state.functions,
          {
            id: `fn_${Math.random().toString(36).substring(2, 11)}`,
            projectId,
            name,
            runtime,
            status: 'active',
            lastDeployed: Date.now()
          }
        ]
      })),
      deleteFunction: (funcId) => set((state) => ({
        functions: state.functions.filter(f => f.id !== funcId)
      })),

      // Storage
      addBucket: (projectId, name, region) => set((state) => ({
        buckets: [
          ...state.buckets,
          {
            id: `bkt_${Math.random().toString(36).substring(2, 11)}`,
            projectId,
            name,
            region,
            createdAt: Date.now()
          }
        ]
      })),
      deleteBucket: (bucketId) => set((state) => ({
        buckets: state.buckets.filter(b => b.id !== bucketId)
      })),

      // Webhooks
      addWebhook: (projectId, url, events) => set((state) => ({
        webhooks: [
          ...state.webhooks,
          {
            id: `wh_${Math.random().toString(36).substring(2, 11)}`,
            projectId,
            url,
            events,
            active: true
          }
        ]
      })),
      toggleWebhook: (webhookId) => set((state) => ({
        webhooks: state.webhooks.map(w => 
          w.id === webhookId ? { ...w, active: !w.active } : w
        )
      })),
      deleteWebhook: (webhookId) => set((state) => ({
        webhooks: state.webhooks.filter(w => w.id !== webhookId)
      })),

      // Git
      linkGitRepo: (projectId, provider, repoName, branch) => set((state) => ({
        gitRepos: [
          ...state.gitRepos,
          {
            id: `git_${Math.random().toString(36).substring(2, 11)}`,
            projectId,
            provider,
            repoName,
            branch,
            connectedAt: Date.now()
          }
        ]
      })),
      unlinkGitRepo: (repoId) => set((state) => ({
        gitRepos: state.gitRepos.filter(g => g.id !== repoId)
      })),

    }),
    {
      name: 'xakteir-dev-centre-storage',
    }
  )
);
