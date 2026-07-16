const fs = require('fs');
const path = require('path');

const srcAppPath = path.join('c:', 'Users', 'ridwa', 'Downloads', 'download (31)', 'src', 'app');

function analyzeDirectory(dir, relativePath = '') {
    let results = [];
    const files = fs.readdirSync(dir);
    
    let dirInfo = {
        name: relativePath || 'Root (src/app)',
        hasDb: false,
        hasApi: false,
        hasLocalStorage: false,
        hasPlaceholders: false,
        hasHardcodedData: false,
        files: []
    };

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            results = results.concat(analyzeDirectory(fullPath, path.join(relativePath, file)));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lowerContent = content.toLowerCase();
            
            const fileInfo = {
                name: file,
                isReal: false,
                isFake: false,
                notes: []
            };

            // Check for real functionality
            if (content.includes('firebase') || content.includes('firestore') || content.includes('db.')) {
                fileInfo.notes.push('Uses Firebase/Firestore (Real DB)');
                dirInfo.hasDb = true;
                fileInfo.isReal = true;
            }
            if (content.includes('fetch(') || content.includes('axios')) {
                fileInfo.notes.push('Makes API calls (Real)');
                dirInfo.hasApi = true;
                fileInfo.isReal = true;
            }
            if (content.includes('localStorage')) {
                fileInfo.notes.push('Uses localStorage (Real Client State)');
                dirInfo.hasLocalStorage = true;
                fileInfo.isReal = true;
            }
            if (content.includes('process.env')) {
                fileInfo.notes.push('Uses env vars');
                fileInfo.isReal = true;
            }

            // Check for placeholders/fakes
            if (lowerContent.includes('coming soon') || lowerContent.includes('under construction') || lowerContent.includes('not implemented')) {
                fileInfo.notes.push('Contains "Coming Soon" or similar text (Placeholder)');
                dirInfo.hasPlaceholders = true;
                fileInfo.isFake = true;
            }
            if (lowerContent.includes('dummy data') || lowerContent.includes('mock data') || lowerContent.includes('// mock')) {
                fileInfo.notes.push('Uses Mock/Dummy Data (Fake)');
                dirInfo.hasHardcodedData = true;
                fileInfo.isFake = true;
            }
            if (lowerContent.includes('todo:')) {
                fileInfo.notes.push('Has TODO comments');
                fileInfo.isFake = true; // or at least incomplete
            }
            
            // Heuristic for hardcoded lists
            if (content.match(/const \w+ = \[\s*\{[\s\S]*?\}\s*\]/m) && !fileInfo.isReal) {
                 fileInfo.notes.push('Likely uses hardcoded array data (Static/Fake)');
                 dirInfo.hasHardcodedData = true;
            }

            if (!fileInfo.isReal && !fileInfo.isFake) {
                fileInfo.notes.push('Mostly static UI or standard logic');
            }

            dirInfo.files.push(fileInfo);
        }
    });

    if (dirInfo.files.length > 0) {
        results.push(dirInfo);
    }
    
    return results;
}

const analysis = analyzeDirectory(srcAppPath);

let report = `# Xakteir App Analysis Report\n\n`;
report += `This report breaks down the real, fake (placeholder), and static components across the Xakteir ecosystem based on code heuristics.\n\n`;

analysis.forEach(dir => {
    report += `## Directory: \`/${dir.name}\`\n`;
    
    let status = [];
    if (dir.hasDb) status.push('🟢 Real DB Connected');
    if (dir.hasApi) status.push('🟢 API Connected');
    if (dir.hasLocalStorage) status.push('🟡 Local State Used');
    if (dir.hasPlaceholders) status.push('🔴 Has Placeholders');
    if (dir.hasHardcodedData) status.push('🟠 Uses Hardcoded/Mock Data');
    
    if (status.length > 0) {
        report += `**Status Overview:** ${status.join(' | ')}\n\n`;
    }
    
    dir.files.forEach(f => {
        let emoji = '⚪';
        if (f.isReal && !f.isFake) emoji = '🟢';
        if (f.isFake && !f.isReal) emoji = '🔴';
        if (f.isReal && f.isFake) emoji = '🟡'; // Mixed
        
        report += `- ${emoji} **${f.name}**: ${f.notes.join(', ')}\n`;
    });
    report += '\n';
});

fs.writeFileSync(path.join('c:', 'Users', 'ridwa', 'Downloads', 'download (31)', 'scratch', 'analysis_report.md'), report);
console.log('Analysis complete. Report written to scratch/analysis_report.md');
