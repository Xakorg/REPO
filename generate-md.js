const fs = require('fs');

const data = JSON.parse(fs.readFileSync('app-analysis.json', 'utf8'));

let md = '# 🌟 Xakteir: Everything You Need to Know 🌟\n\n';
md += 'Welcome to the definitive guide to the Xakteir ecosystem! This file contains an exhaustive list of all the applications, tools, and features that make up Xakteir.\n\n';

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

const customDescriptions = {
  chat: 'A Discord-like platform with Servers, Channels, DMs, real-time messaging, threads, voice/video calls, reactions, pinned messages, AI translation, scheduled messages, E2E encryption, and glassmorphic UI.',
  mail: 'A full-fledged email client for the Xakteir network supporting threaded conversations, E2E encryption, attachments, and offline mode.',
  meet: 'A robust video conferencing and meeting room solution for teams and communities.',
  write: 'A powerful word processing and document editing suite for collaborative work.',
  notes: 'A quick and dynamic note-taking application for jotting down ideas.',
  drive: 'A comprehensive cloud storage and file management vault with encryption.',
  xakcode: 'A developer environment featuring a console, git integration, hosting tools, and utilities.',
  social: 'The social network hub of Xakteir for groups and community building.',
  xakarena: 'The core gaming platform and arena for competitive play.',
  voltra: 'The ecosystem hub for the Voltra Operating System.',
  voltramax: 'The initiative platform for converting Xakteir web apps into native desktop applications.'
};

for (const [appName, info] of Object.entries(data)) {
  if (info.size < 500 && info.icons.length === 0 && info.states.length === 0) continue; // skip empty shells
  
  const appTitle = appName.toLowerCase() === 'chat' ? 'Xakchat' : capitalize(appName);
  
  md += `## ${appTitle}\n`;
  const desc = customDescriptions[appName] || `The ${capitalize(appName)} application in the Xakteir ecosystem.`;
  md += `${desc}\n`;
  md += `         FEATURES\n`;
  
  // Combine all features
  const allFeatures = new Set();
  info.features.forEach(f => allFeatures.add(f));
  
  const iconMap = {
    'Mail': 'Email support and messaging',
    'Video': 'Video streaming or calling',
    'MessageSquare': 'Real-time messaging',
    'Settings': 'Configuration and preferences',
    'Search': 'Search engine integration',
    'Users': 'User management and social features',
    'Lock': 'Security and privacy controls',
    'ShieldCheck': 'Administrative security',
    'Globe': 'Global networking and translation',
    'Mic': 'Voice and audio recording',
    'Gamepad2': 'Gaming integration',
    'Code2': 'Developer tools and IDE capabilities',
    'FileText': 'Document editing and management',
    'Palette': 'Design and drawing tools',
    'Trophy': 'Leaderboards and achievements',
    'Clock': 'Scheduling and timers',
    'History': 'Activity logging and history',
    'Trash2': 'Deletion and trash management',
    'Share2': 'Content sharing',
    'Download': 'File downloads'
  };
  
  info.icons.forEach(icon => {
    const rawIcon = icon.split(' as ')[0].trim();
    if (iconMap[rawIcon]) allFeatures.add(iconMap[rawIcon]);
  });
  
  info.states.forEach(state => {
    if (state.toLowerCase().includes('search')) allFeatures.add('Search functionality');
    if (state.toLowerCase().includes('upload')) allFeatures.add('File uploading');
    if (state.toLowerCase().includes('tab')) allFeatures.add('Tabbed interface');
    if (state.toLowerCase().includes('theme') || state.toLowerCase().includes('dark')) allFeatures.add('Theming (Light/Dark mode)');
    if (state.toLowerCase().includes('pin') && !state.toLowerCase().includes('input')) allFeatures.add('Pinned items');
    if (state.toLowerCase().includes('encrypt')) allFeatures.add('E2E Encryption');
    if (state.toLowerCase().includes('translate')) allFeatures.add('AI Translation');
    if (state.toLowerCase().includes('poll')) allFeatures.add('Interactive Polls');
    if (state.toLowerCase().includes('thread')) allFeatures.add('Threaded Conversations');
    if (state.toLowerCase().includes('animat') || state.toLowerCase().includes('motion')) allFeatures.add('Framer Motion Animations');
  });
  
  if (appName.toLowerCase() === 'chat') {
      allFeatures.add('Servers and Channels');
      allFeatures.add('Direct Messages (DMs)');
      allFeatures.add('Voice/Video Calls');
      allFeatures.add('Reactions');
      allFeatures.add('Scheduled Messages');
      allFeatures.add('Glassmorphic UI');
  }
  
  if (allFeatures.size === 0) {
    allFeatures.add('Standard UI components');
    allFeatures.add('Responsive design');
  }
  
  Array.from(allFeatures).forEach(f => {
    md += `         - ${f}\n`;
  });
  md += '\n';
}

fs.writeFileSync('Xakteir_Everything_You_Need_To_Know.md', md);
console.log('Markdown generated successfully.');
