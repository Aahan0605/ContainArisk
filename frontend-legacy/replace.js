import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.jsx')) {
        // skip landing/login parts for broad replace
        if (filePath.includes('Landing') || filePath.includes('Login')) return;

        let content = fs.readFileSync(filePath, 'utf8');

        // text-[#1B2A4A] -> text-[#1B2A4A] dark:text-slate-100
        let updated = content.replace(/text-\[#1B2A4A\](?!\s*dark:text-slate)/g, 'text-[#1B2A4A] dark:text-slate-100');

        // border-gray-200 -> border-gray-200 dark:border-slate-700
        updated = updated.replace(/border-gray-200(?!\s*dark:border-slate)/g, 'border-gray-200 dark:border-slate-700');

        // border-gray-100 -> border-gray-100 dark:border-slate-700/50
        updated = updated.replace(/border-gray-100(?!\s*dark:border-slate)/g, 'border-gray-100 dark:border-slate-700/50');

        // text-gray-500 -> text-gray-500 dark:text-gray-400
        updated = updated.replace(/text-gray-500(?!\s*dark:text-gray)/g, 'text-gray-500 dark:text-gray-400');

        // bg-white -> bg-white dark:bg-slate-800
        // Be careful with bg-white/90 etc.
        updated = updated.replace(/bg-white(?!\/| dark:bg-slate)/g, 'bg-white dark:bg-slate-800');

        // bg-gray-50 -> bg-gray-50 dark:bg-slate-800/50
        updated = updated.replace(/bg-gray-50(?!\/| dark:bg-slate)/g, 'bg-gray-50 dark:bg-slate-800/50');

        // card-premium -> uses dark mode inherently, no need 

        if (content !== updated) {
            fs.writeFileSync(filePath, updated);
            console.log('Updated', filePath);
        }
    }
});
