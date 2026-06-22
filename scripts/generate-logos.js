// scripts/generate-logos.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const appsLogosRoot = path.join(rootDir, 'apps-logos');
const appsLogosPublic = path.join(rootDir, 'public', 'apps-logos');

// Create folders if they don't exist
if (!fs.existsSync(appsLogosRoot)) {
    fs.mkdirSync(appsLogosRoot, { recursive: true });
}
if (!fs.existsSync(appsLogosPublic)) {
    fs.mkdirSync(appsLogosPublic, { recursive: true });
}

function getSvg(name, bgColor, accentColor, iconContent) {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <!-- Dark card base background -->
      <rect x="16" y="16" width="480" height="480" rx="120" fill="${bgColor}" />
      
      <!-- Inner gradient glow -->
      <rect x="32" y="32" width="448" height="448" rx="100" fill="${accentColor}" fill-opacity="0.08" />
      
      <!-- Neon outline border -->
      <rect x="20" y="20" width="472" height="472" rx="110" fill="none" stroke="${accentColor}" stroke-width="8" />
      
      <!-- Central icon -->
      <g stroke="${accentColor}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
        ${iconContent}
      </g>
    </svg>
    `;
}

const LOGOS = [
    { name: "mail", bgColor: "#0f172a", accentColor: "#3b82f6", icon: `<rect x="136" y="176" width="240" height="160" rx="10" /><path d="M136 176 L256 270 L376 176" />` },
    { name: "chat", bgColor: "#022c22", accentColor: "#10b981", icon: `<rect x="146" y="156" width="220" height="160" rx="40" fill="#10b981" /><polygon points="210,316 170,366 250,316" fill="#10b981" /><circle cx="206" cy="226" r="10" fill="#000" stroke="none" /><circle cx="246" cy="226" r="10" fill="#000" stroke="none" /><circle cx="286" cy="226" r="10" fill="#000" stroke="none" />` },
    { name: "ai-chat", bgColor: "#1e1b4b", accentColor: "#8b5cf6", icon: `<rect x="156" y="176" width="200" height="160" rx="60" fill="#8b5cf6" /><rect x="246" y="116" width="20" height="60" fill="#8b5cf6" stroke="none" /><circle cx="256" cy="106" r="20" fill="#8b5cf6" stroke="none" /><circle cx="206" cy="236" r="12" fill="#000" stroke="none" /><circle cx="306" cy="236" r="12" fill="#000" stroke="none" /><path d="M216 266 Q256 306 296 266" />` },
    { name: "whiteboard", bgColor: "#1c1917", accentColor: "#f59e0b", icon: `<rect x="136" y="156" width="240" height="160" rx="10" /><path d="M196 316 L156 396 M316 316 L356 396 M256 316 L256 376 M176 236 L336 236" />` },
    { name: "suite", bgColor: "#18181b", accentColor: "#a855f7", icon: `<rect x="136" y="136" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="226" y="136" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="316" y="136" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="136" y="226" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="226" y="226" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="316" y="226" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="136" y="316" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="226" y="316" width="60" height="60" rx="16" fill="#a855f7" stroke="none" /><rect x="316" y="316" width="60" height="60" rx="16" fill="#a855f7" stroke="none" />` },
    { name: "drive", bgColor: "#2d1a00", accentColor: "#f59e0b", icon: `<polygon points="256,116 396,376 116,376" /><circle cx="256" cy="266" r="30" fill="#f59e0b" stroke="none" />` },
    { name: "games", bgColor: "#2e1065", accentColor: "#a855f7", icon: `<rect x="116" y="196" width="280" height="140" rx="60" fill="#a855f7" /><path d="M186 236 L186 296 M156 266 L216 266" stroke="#000" stroke-width="12" /><circle cx="326" cy="256" r="16" fill="#000" stroke="none" /><circle cx="296" cy="276" r="16" fill="#000" stroke="none" />` },
    { name: "maps", bgColor: "#022c22", accentColor: "#10b981", icon: `<polygon points="136,156 216,116 296,156 376,116 376,356 296,396 216,356 136,396" /><path d="M216 116 L216 356 M296 156 L296 396" />` },
    { name: "apps", bgColor: "#0c0a09", accentColor: "#e4e4e7", icon: `<rect x="136" y="136" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="226" y="136" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="316" y="136" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="136" y="226" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="226" y="226" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="316" y="226" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="136" y="316" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="226" y="316" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" /><rect x="316" y="316" width="60" height="60" rx="16" fill="#e4e4e7" stroke="none" />` },
    { name: "search", bgColor: "#0f172a", accentColor: "#3b82f6", icon: `<circle cx="236" cy="236" r="80" /><path d="M296 296 L376 376" stroke-width="20" />` },
    { name: "studio", bgColor: "#2e1065", accentColor: "#c084fc", icon: `<path d="M256 116 Q256 256 396 256 Q256 256 256 396 Q256 256 116 256 Q256 256 256 116 Z" fill="#c084fc" stroke="none" />` },
    { name: "premium", bgColor: "#2d1a00", accentColor: "#f59e0b", icon: `<polygon points="256,116 376,176 376,316 256,396 136,316 136,176" /><circle cx="256" cy="256" r="40" fill="#f59e0b" stroke="none" />` },
    { name: "settings", bgColor: "#18181b", accentColor: "#71717a", icon: `<circle cx="256" cy="256" r="80" /><circle cx="256" cy="256" r="30" fill="#18181b" stroke="none" /><path d="M256 146 L256 116 M256 366 L256 396 M146 256 L116 256 M366 256 L396 256 M178 178 L157 157 M334 334 L355 355 M178 334 L157 355 M334 178 L355 157" stroke-width="20" />` },
    { name: "xaksports", bgColor: "#2d1a00", accentColor: "#f97316", icon: `<rect x="196" y="156" width="120" height="120" rx="10" /><path d="M256 276 L256 336 M176 336 L336 336" /><path d="M196 176 A 40 40 0 0 0 156 216 M320 176 A 40 40 0 0 1 360 216" />` },
    { name: "xakarena", bgColor: "#450a0a", accentColor: "#f43f5e", icon: `<path d="M136 376 L376 136 M136 136 L376 376" /><path d="M166 316 L206 356 M346 316 L306 356" stroke-width="16" />` },
    { name: "xakcode", bgColor: "#082f49", accentColor: "#38bdf8", icon: `<path d="M206 176 L136 256 L206 336 M306 176 L376 256 L306 336 M276 156 L236 356" />` },
    { name: "xakview", bgColor: "#450a0a", accentColor: "#ef4444", icon: `<rect x="126" y="166" width="260" height="180" rx="20" /><polygon points="236,216 236,296 296,256" fill="#ef4444" stroke="none" /><path d="M186 346 L146 386 M326 346 L366 386" />` },
    { name: "calendar", bgColor: "#2d1a00", accentColor: "#f59e0b", icon: `<rect x="136" y="166" width="240" height="200" rx="15" /><path d="M136 226 L376 226 M216 226 L216 366 M296 226 L296 366 M136 296 L376 296" />` },
    { name: "pics", bgColor: "#4c0519", accentColor: "#ec4899", icon: `<rect x="136" y="156" width="240" height="200" rx="15" /><path d="M136 356 L226 256 L296 306 L346 236 L376 356" /><circle cx="186" cy="206" r="20" fill="#ec4899" stroke="none" />` },
    { name: "classroom", bgColor: "#1e1b4b", accentColor: "#6366f1", icon: `<polygon points="256,146 396,216 256,286 116,216" fill="#6366f1" /><path d="M396 216 L396 296" /><circle cx="396" cy="296" r="10" fill="#6366f1" stroke="none" /><path d="M196 246 A 80 80 0 0 0 316 246" />` },
    { name: "art", bgColor: "#4c0519", accentColor: "#ec4899", icon: `<circle cx="256" cy="256" r="120" /><circle cx="316" cy="296" r="20" fill="#000" stroke="none" /><circle cx="216" cy="216" r="24" fill="#ef4444" stroke="none" /><circle cx="276" cy="206" r="24" fill="#3b82f6" stroke="none" /><circle cx="236" cy="286" r="24" fill="#eab308" stroke="none" />` },
    { name: "social", bgColor: "#4c0519", accentColor: "#ec4899", icon: `<circle cx="216" cy="176" r="40" /><path d="M156 286 A 80 80 0 0 1 276 286" /><circle cx="296" cy="216" r="40" /><path d="M236 326 A 80 80 0 0 1 356 326" />` },
    { name: "calculator", bgColor: "#18181b", accentColor: "#3b82f6", icon: `<rect x="146" y="136" width="220" height="240" rx="20" /><rect x="176" y="166" width="160" height="50" rx="5" /><rect x="176" y="246" width="30" height="30" rx="5" fill="#3b82f6" /><rect x="236" y="246" width="30" height="30" rx="5" fill="#3b82f6" /><rect x="296" y="246" width="30" height="30" rx="5" fill="#3b82f6" /><rect x="176" y="306" width="30" height="30" rx="5" fill="#3b82f6" /><rect x="236" y="306" width="30" height="30" rx="5" fill="#3b82f6" /><rect x="296" y="306" width="30" height="30" rx="5" fill="#3b82f6" />` },
    { name: "translate", bgColor: "#0f172a", accentColor: "#93c5fd", icon: `<rect x="116" y="146" width="180" height="120" rx="15" /><rect x="226" y="226" width="180" height="120" rx="15" /><path d="M166 226 L206 186 L246 226" stroke-width="8" /><path d="M276 306 L316 266 L356 306" stroke-width="8" />` },
    { name: "notifications", bgColor: "#1e1b4b", accentColor: "#a855f7", icon: `<path d="M256 126 A 80 80 0 0 1 336 206 L336 306 L176 306 L176 206 A 80 80 0 0 1 256 126 Z" /><path d="M146 306 L366 306 M226 306 A 30 30 0 0 0 286 306" /><circle cx="256" cy="116" r="15" />` },
    { name: "meet", bgColor: "#450a0a", accentColor: "#fb7185", icon: `<rect x="136" y="166" width="180" height="180" rx="20" /><polygon points="316,216 386,176 386,336 316,296" fill="#fb7185" />` },
    { name: "notes", bgColor: "#1e1b4b", accentColor: "#818cf8", icon: `<rect x="146" y="146" width="220" height="220" rx="20" /><path d="M186 206 L326 206 M186 256 L326 256 M186 306 L266 306" />` },
    { name: "shop", bgColor: "#022c22", accentColor: "#10b981", icon: `<rect x="146" y="176" width="220" height="180" rx="20" /><path d="M196 176 A 60 60 0 0 1 316 176" /><path d="M196 176 L196 216 M316 176 L316 216" />` },
    { name: "dev-centre", bgColor: "#0f172a", accentColor: "#3b82f6", icon: `<circle cx="256" cy="256" r="90" /><path d="M206 206 L156 256 L206 306 M306 206 L356 256 L306 306" />` },
    { name: "authenticator", bgColor: "#042f2e", accentColor: "#2dd4bf", icon: `<polygon points="256,116 376,156 376,316 256,406 136,316 136,156" /><path d="M256 116 L256 406" />` },
    { name: "buddy", bgColor: "#450a0a", accentColor: "#f43f5e", icon: `<path d="M256 396 C136 296, 116 166, 186 146 C226 136, 246 186, 256 206 C266 186, 286 136, 326 146 C396 166, 376 296, 256 396 Z" fill="#f43f5e" stroke="none" />` },
    { name: "installer", bgColor: "#082f49", accentColor: "#0ea5e9", icon: `<path d="M256 126 L256 316 M196 256 L256 316 L316 256 M156 376 L356 376" />` },
    { name: "news", bgColor: "#450a0a", accentColor: "#ef4444", icon: `<rect x="136" y="156" width="240" height="200" rx="20" /><path d="M136 236 L376 236 M176 276 L336 276 M176 316 L336 316" />` },
    { name: "search-console", bgColor: "#042f2e", accentColor: "#2dd4bf", icon: `<circle cx="206" cy="206" r="70" /><path d="M266 266 L336 336 M226 356 L286 296 L336 326 L396 256" />` },
    { name: "sign", bgColor: "#2d1a00", accentColor: "#f59e0b", icon: `<rect x="156" y="156" width="200" height="220" rx="20" /><rect x="216" y="126" width="80" height="40" rx="5" fill="#f59e0b" stroke="none" /><path d="M216 276 L246 306 L306 226" />` },
    { name: "stream", bgColor: "#450a0a", accentColor: "#ef4444", icon: `<circle cx="256" cy="306" r="20" fill="#ef4444" stroke="none" /><path d="M256 306 L216 396 M256 306 L296 396 M176 226 A 120 120 0 0 1 336 226 M126 176 A 180 180 0 0 1 386 176" />` },
    { name: "tasks", bgColor: "#022c22", accentColor: "#10b981", icon: `<rect x="136" y="156" width="240" height="200" rx="20" /><rect x="166" y="196" width="30" height="30" rx="5" /><rect x="166" y="276" width="30" height="30" rx="5" /><path d="M226 211 L326 211 M226 291 L326 291" />` },
    { name: "weather", bgColor: "#2d1a00", accentColor: "#fbbf24", icon: `<circle cx="256" cy="256" r="80" /><path d="M256 146 L256 116 M256 366 L256 396 M146 256 L116 256 M366 256 L396 256 M178 178 L157 157 M334 334 L355 355 M178 334 L157 355 M334 178 L355 157" stroke-width="12" />` },
    { name: "support", bgColor: "#18181b", accentColor: "#a1a1aa", icon: `<circle cx="256" cy="256" r="120" /><circle cx="256" cy="256" r="60" /><path d="M171 171 L213 213 M341 341 L299 299 M171 341 L213 299 M341 171 L299 213" />` },
    { name: "profile", bgColor: "#1e1b4b", accentColor: "#818cf8", icon: `<circle cx="256" cy="186" r="50" fill="#818cf8" stroke="none" /><path d="M156 356 A 100 100 0 0 1 356 356" />` },
    { name: "about", bgColor: "#18181b", accentColor: "#a1a1aa", icon: `<circle cx="256" cy="256" r="120" /><circle cx="256" cy="206" r="15" fill="#a1a1aa" stroke="none" /><path d="M256 246 L256 326" />` }
];

async function generateAll() {
    for (const logo of LOGOS) {
        console.log(`Generating SVG for ${logo.name}...`);
        const svgString = getSvg(logo.name, logo.bgColor, logo.accentColor, logo.icon);
        const svgBuffer = Buffer.from(svgString);
        
        const outPathRoot = path.join(appsLogosRoot, `${logo.name}.png`);
        const outPathPublic = path.join(appsLogosPublic, `${logo.name}.png`);
        
        try {
            await sharp(svgBuffer)
                .png()
                .toFile(outPathRoot);
            
            await sharp(svgBuffer)
                .png()
                .toFile(outPathPublic);
            
            console.log(`Saved ${logo.name}.png`);
        } catch (err) {
            console.error(`Failed to render ${logo.name}:`, err);
        }
    }
    console.log("All logos generated successfully!");
}

generateAll();
