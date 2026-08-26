import React from 'react';

export default function KnowledgeHome() {
  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome to Xakteir Knowledge</h1>
        <p className="text-gray-600">A cleaner, organized knowledge base — think Wikipedia but neater.</p>

        <div className="mt-6">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="flex gap-2">
            <input
              id="search"
              placeholder="Search articles, topics, people, places..."
              className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold">Featured Article</h3>
          <p className="text-sm text-gray-600 mt-2">Example: How Xakteir works — a clear overview of the ecosystem.</p>
          <div className="mt-3">
            <a href="/knowledge/a/xakteir-overview" className="text-blue-600 text-sm">Read article →</a>
          </div>
        </article>

        <article className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold">Browse by Category</h3>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li><a className="text-blue-600" href="/knowledge/a/technology">Technology</a></li>
            <li><a className="text-blue-600" href="/knowledge/a/history">History</a></li>
            <li><a className="text-blue-600" href="/knowledge/a/science">Science</a></li>
          </ul>
        </article>

        <article className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold">Get Started</h3>
          <p className="text-sm text-gray-600 mt-2">Start by searching for a topic or creating a new article (future feature).</p>
        </article>
      </section>
    </div>
  );
}
