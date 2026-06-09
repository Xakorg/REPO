import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Firebase Admin initialisation ─────────────────────────────────────────
// Uses Application Default Credentials when running on Firebase App Hosting.
// No env vars needed — the hosting runtime injects them automatically.
function getAdminDb() {
  if (!getApps().length) {
    initializeApp();
  }
  return getFirestore();
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface PublishedProject {
  projectId: string;
  name: string;
  ownerId: string;
  ownerName: string;
  domain: string;
  slug?: string;
  status: string;
  files: Record<string, string>;
  publishedAt?: any;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert project name to URL slug: "My Cool App" → "my-cool-app" */
function nameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Fetch project by slug from publishedProjects collection */
async function getProjectBySlug(slug: string): Promise<PublishedProject | null> {
  try {
    const db = getAdminDb();
    const col = db.collection('publishedProjects');

    // Try explicit slug field first
    let snap = await col.where('slug', '==', slug).limit(1).get();

    // Fall back: match derived slug from project name
    if (snap.empty) {
      const all = await col.where('status', '==', 'published').get();
      const match = all.docs.find(d => {
        const data = d.data() as PublishedProject;
        return nameToSlug(data.name || '') === slug || d.id === slug;
      });
      if (match) {
        return match.data() as PublishedProject;
      }
      return null;
    }

    return snap.docs[0].data() as PublishedProject;
  } catch (err) {
    console.error('getProjectBySlug error:', err);
    return null;
  }
}

/** Build a full srcdoc HTML string that renders the project code */
function buildHtml(project: PublishedProject): string {
  const appCode = project.files?.['App.jsx'] || project.files?.['index.jsx'] || 
    Object.values(project.files || {})[0] || '// No code found';
  const cssCode = project.files?.['styles.css'] || project.files?.['index.css'] || '';

  // Sanitise backticks inside the user code to avoid breaking template literal
  const safeCode = appCode.replace(/`/g, '\\`');
  const safeCss = cssCode.replace(/`/g, '\\`');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.name} — XakCode</title>
  <meta name="description" content="Published by ${project.ownerName} via XakCode" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <!-- Tailwind for basic utility classes inside published projects -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React + Babel so JSX runs without a build step -->
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; min-height: 100vh; }
    ${safeCss}
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- Tiny powered-by badge -->
  <a href="https://xakteir.com/xakcode" target="_blank"
     style="position:fixed;bottom:12px;right:12px;background:rgba(0,0,0,0.7);
            color:#38bdf8;font-size:10px;font-weight:900;letter-spacing:.08em;
            text-decoration:none;padding:5px 10px;border-radius:999px;
            border:1px solid rgba(56,189,248,.2);backdrop-filter:blur(8px);z-index:9999;
            text-transform:uppercase;">
    ⚡ XakCode
  </a>

  <script type="text/babel">
    ${safeCode}

    // Mount — look for default export called App or render first exported fn
    try {
      const rootEl = document.getElementById('root');
      if (typeof App !== 'undefined') {
        ReactDOM.createRoot(rootEl).render(React.createElement(App));
      } else {
        rootEl.innerHTML = '<div style="padding:2rem;font-family:monospace;">No App component found.</div>';
      }
    } catch(e) {
      document.getElementById('root').innerHTML =
        '<div style="padding:2rem;font-family:monospace;color:#f87171;">Error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
}

// ─── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: 'Not Found — XakCode' };
  return {
    title: `${project.name} — XakCode`,
    description: `Published by ${project.ownerName} on XakCode`,
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function SitePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project || project.status !== 'published') {
    notFound();
  }

  const html = buildHtml(project);

  // Return a full-viewport iframe that renders the project HTML
  // We use dangerouslySetInnerHTML on a wrapping element to pass the srcdoc
  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        <title>{project.name} — XakCode</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`* { margin:0; padding:0; box-sizing:border-box; } html,body,iframe { width:100%; height:100%; border:none; display:block; }`}</style>
      </head>
      <body>
        {/* Full-page iframe with srcdoc — safest sandbox approach */}
        <iframe
          title={project.name}
          srcDoc={html}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          style={{ width: '100%', height: '100vh', border: 'none' }}
        />
      </body>
    </html>
  );
}
