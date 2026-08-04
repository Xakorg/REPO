const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'src', 'app');
const apps = fs.readdirSync(appsDir).filter(f => fs.statSync(path.join(appsDir, f)).isDirectory());

const appFeatures = {};

apps.forEach(app => {
  let pageContent = '';
  try {
    pageContent = fs.readFileSync(path.join(appsDir, app, 'page.tsx'), 'utf-8');
  } catch(e) {
    // maybe it has layout or something else, skip for now
    return;
  }
  
  // Extract lucide-react icons as they hint at features
  const lucideMatch = pageContent.match(/import\s+{([^}]+)}\s+from\s+["']lucide-react["']/);
  const icons = lucideMatch ? lucideMatch[1].split(',').map(i => i.trim()).filter(i => i) : [];
  
  // Extract state variables which often map to features
  const stateMatch = pageContent.match(/const\s+\[([a-zA-Z0-9]+),\s+set[a-zA-Z0-9]+\]\s*=\s*useState/g) || [];
  const states = stateMatch.map(s => {
    const m = s.match(/const\s+\[([a-zA-Z0-9]+),/);
    return m ? m[1] : '';
  }).filter(Boolean);
  
  // Extract major components or keywords
  const features = [];
  if (pageContent.includes('framer-motion')) features.push('Framer Motion Animations');
  if (pageContent.includes('useFirestore') || pageContent.includes('firebase')) features.push('Firebase Realtime Data');
  if (pageContent.includes('audio') || pageContent.includes('Mic')) features.push('Voice/Audio Support');
  if (pageContent.includes('video') || pageContent.includes('Video')) features.push('Video Support');
  if (pageContent.includes('Thread')) features.push('Threaded Conversations');
  if (pageContent.includes('Poll')) features.push('Polls');
  if (pageContent.includes('E2E') || pageContent.includes('encrypt')) features.push('E2E Encryption');
  if (pageContent.includes('Translate') || pageContent.includes('translate')) features.push('Translation');
  if (pageContent.includes('Pin')) features.push('Pinned Items');
  if (pageContent.includes('Theme')) features.push('Theming');
  if (pageContent.includes('Search')) features.push('Search functionality');
  
  appFeatures[app] = { icons: icons.slice(0, 15), states: states.slice(0, 20), features, size: pageContent.length };
});

fs.writeFileSync('app-analysis.json', JSON.stringify(appFeatures, null, 2));
console.log('Analysis complete. Wrote to app-analysis.json');
