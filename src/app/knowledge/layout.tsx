import React from 'react';

export const metadata = {
  title: 'Xakteir Knowledge',
  description: 'A neat, organized knowledge base for Xakteir — like Wikipedia but cleaner.',
};

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
            <div className="text-xl font-semibold">Xakteir Knowledge</div>
            <nav className="ml-auto flex gap-3">
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</a>
              <a href="/knowledge/a" className="text-sm text-gray-600 hover:text-gray-900">Browse</a>
              <a href="/knowledge/about" className="text-sm text-gray-600 hover:text-gray-900">About</a>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-500">
          <div>© Xakteir • Xakteir Knowledge — neat, organized, and fast.</div>
        </footer>
      </body>
    </html>
  );
}
