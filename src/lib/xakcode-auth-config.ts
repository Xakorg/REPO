/**
 * Xakcode Authentication Configuration
 * Manages GitHub OAuth, Xakteir auth, and feature access control
 */

export const GITHUB_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23liB7TZyHfvRxD8nK',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://xakcode.xakteir.com'}/api/xakcode/auth/github/callback`,
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  accessTokenUrl: 'https://github.com/login/oauth/access_token',
  userApiUrl: 'https://api.github.com/user',
};

export const XAKCODE_FEATURES = {
  // Core features that require AUTHENTICATION
  // These are available to unauthenticated users
  PUBLIC: [
    'VIEW_REPOS',
    'READ_REPO_FILES',
    'BROWSE_REPOSITORY',
    'SEARCH_PUBLIC_REPOS',
  ],
  
  // Features that require XAKTEIR AUTHENTICATION
  // Available when signed into Xakteir but GitHub not connected
  XAKTEIR_ONLY: [
    'VIEW_PROFILE',
    'SAVE_FAVORITES',
    'VIEW_HISTORY',
  ],
  
  // Features that require GITHUB CONNECTION
  // Only available when both Xakteir + GitHub are connected
  GITHUB_REQUIRED: [
    'CREATE_REPO',
    'FORK_REPO',
    'DELETE_REPO',
    'PUSH_CODE',
    'CREATE_BRANCH',
    'OPEN_PULL_REQUEST',
    'MANAGE_ISSUES',
    'CREATE_WEBHOOK',
    'MANAGE_COLLABORATORS',
    'EDIT_REPO_SETTINGS',
    'USE_EDITOR',
    'RUN_CODE',
    'COMMIT_CHANGES',
  ],
};

export type AuthState = 'none' | 'xakteir' | 'github-prompt' | 'full';

export interface XakcodeUser {
  // Xakteir identity
  xakcodeId: string;
  xakcodeUsername: string;
  xakcodeEmail: string;
  xakcodePhotoURL?: string;
  
  // GitHub identity (if connected)
  githubConnected: boolean;
  githubUsername?: string;
  githubId?: number;
  githubAvatarUrl?: string;
  githubAccessToken?: string; // Stored securely
  githubEmail?: string;
  githubBio?: string;
  githubPublicRepos?: number;
  
  // Auth state
  authState: AuthState;
  connectedAt?: Date;
}

export interface XakcodeSession {
  user: XakcodeUser | null;
  authState: AuthState;
  isLoading: boolean;
  error?: string;
}
