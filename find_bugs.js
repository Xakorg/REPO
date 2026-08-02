const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'app');
const results = [];

function readDirRecursively(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            readDirRecursively(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            analyzeFile(fullPath);
        }
    }
}

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const relativePath = path.relative(__dirname, filePath);
        
        const checks = [
            { regex: /TODO:/i, label: 'TODO Found' },
            { regex: /FIXME:/i, label: 'FIXME Found' },
            { regex: /@ts-ignore/i, label: 'TypeScript Ignore' },
            { regex: /console\.log\(/i, label: 'Console Log (Debug Leftover)' },
            { regex: /console\.error\(/i, label: 'Console Error (Potential Issue)' },
            { regex: /catch\s*\([^)]*\)\s*\{\s*\}/i, label: 'Empty Catch Block (Silent Failure)' },
            { regex: /alert\(/i, label: 'Alert Usage (Poor UX)' }
        ];

        checks.forEach(check => {
            if (check.regex.test(line)) {
                results.push({
                    file: relativePath,
                    line: lineNum,
                    type: check.label,
                    content: line.trim()
                });
            }
        });
    });
}

console.log('🚀 Starting Bug & Debt Sweep in src/app...');
readDirRecursively(targetDir);

if (results.length === 0) {
    console.log('✅ Wow! No obvious tech debt or bugs found! The code is pristine.');
} else {
    console.log(`🐞 Found ${results.length} potential issues/todos!`);
    
    // Group by file
    const byFile = {};
    results.forEach(res => {
        if (!byFile[res.file]) byFile[res.file] = [];
        byFile[res.file].push(res);
    });

    for (const [file, issues] of Object.entries(byFile)) {
        console.log(`\n📁 ${file}`);
        issues.forEach(iss => {
            console.log(`   [Line ${iss.line}] [${iss.type}] -> ${iss.content}`);
        });
    }
    
    // Save to file
    fs.writeFileSync('bug_report.json', JSON.stringify(byFile, null, 2));
    console.log('\n📝 Detailed report saved to bug_report.json');
}
