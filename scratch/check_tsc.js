const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    const stdout = execSync('npx tsc --noEmit', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    fs.writeFileSync(path.join(__dirname, 'tsc_output.txt'), stdout, 'utf8');
    console.log("No tsc errors found!");
} catch (err) {
    const output = (err.stdout || '') + '\n' + (err.stderr || '');
    fs.writeFileSync(path.join(__dirname, 'tsc_output.txt'), output, 'utf8');
    console.log("TS errors captured! Output length:", output.length);
}
