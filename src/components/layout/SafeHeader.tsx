'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from './Header';

interface HeaderErrorBoundaryState {
  hasError: boolean;
}

/** Keeps a corrupted browser preference from taking down the entire app shell. */
export class HeaderErrorBoundary extends React.Component<React.PropsWithChildren, HeaderErrorBoundaryState> {
  state: HeaderErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): HeaderErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Global header failed to render:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <header className="h-16 flex items-center px-6 bg-black/80 border-b border-white/10">
          <Link href="/" className="font-black uppercase italic tracking-tight text-white">Xakteir</Link>
        </header>
      );
    }

    return this.props.children;
  }
}

export function SafeHeader() {
  return (
    <HeaderErrorBoundary>
      <Header />
    </HeaderErrorBoundary>
  );
}
