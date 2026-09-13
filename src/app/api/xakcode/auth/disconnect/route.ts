import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid' },
        { status: 400 }
      );
    }

    // Update user document to remove GitHub connection
    await updateDoc(doc(db, 'users', uid), {
      githubConnected: false,
      githubId: null,
      githubUsername: null,
      githubEmail: null,
      githubAvatarUrl: null,
      githubBio: null,
      githubPublicRepos: null,
      githubAccessToken: null,
      githubConnectedAt: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect GitHub' },
      { status: 500 }
    );
  }
}
