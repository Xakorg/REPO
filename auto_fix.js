const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'app');

function fixFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            fixFiles(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;

            // Fix empty catch blocks: catch (e) {} -> catch (e) { console.error(e); }
            const catchRegex = /catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{\s*\}/g;
            if (catchRegex.test(content)) {
                content = content.replace(catchRegex, 'catch ($1) { console.error($1); }');
                modified = true;
            }

            // Fix empty catch without arguments: catch {} -> catch (e) { console.error(e); }
            const catchNoArgRegex = /catch\s*\{\s*\}/g;
            if (catchNoArgRegex.test(content)) {
                content = content.replace(catchNoArgRegex, 'catch (e) { console.error(e); }');
                modified = true;
            }

            // Remove Debug Leftovers (console.log) in games/studio/page.tsx
            if (fullPath.includes('games/studio/page.tsx') || fullPath.includes('games\\\\studio\\\\page.tsx')) {
                // Not automatically replacing complex console logs, will do manually or leave
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`Fixed: ${path.relative(__dirname, fullPath)}`);
            }
        }
    }
}

fixFiles(targetDir);
console.log("Empty catch blocks fixed!");
