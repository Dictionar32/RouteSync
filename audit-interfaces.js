const fs = require('fs');
const path = require('path');

function walk(dir) {
    let r = [];
    try {
        fs.readdirSync(dir).forEach(f => {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) {
                if (!p.includes('node_modules') && !p.includes('dist') && !p.includes('tests')) {
                    r = r.concat(walk(p));
                }
            } else if (f.endsWith('.ts') && !f.endsWith('.d.ts')) {
                r.push(p);
            }
        });
    } catch (e) {
        // skip inaccessible dirs
    }
    return r;
}

const files = walk('packages/cli/src').concat(walk('packages/core/src'));
const stats = [];

files.forEach(f => {
    const c = fs.readFileSync(f, 'utf8');
    const regex = /(?:export\s+)?interface\s+([A-Za-z0-9_]+)[^{]*\{([^}]+)\}/g;
    let m;
    while ((m = regex.exec(c)) !== null) {
        const name = m[1];
        const lines = m[2].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('*'));
        const opts = lines.filter(l => /^[a-zA-Z0-9_]+\s*\?:|readonly\s+[a-zA-Z0-9_]+\s*\?:/.test(l)).length;
        const recs = lines.filter(l => /Record<|any\b|unknown\b/.test(l)).length;
        const ips = lines.length > 0 ? Math.round(((opts + recs) / lines.length) * 100) : 0;
        if (opts > 0 || recs > 0) {
            stats.push({ name, file: path.basename(f), filePath: f, total: lines.length, opts, recs, ips });
        }
    }
});

stats.sort((a, b) => b.ips - a.ips || b.opts - a.opts);

console.log('TOP 20 INTERFACE DENGAN BRANCHING TERBURUK (IPS TERTINGGI):');
console.log('');
stats.slice(0, 20).forEach((s, i) => {
    console.log(
        (i + 1).toString().padStart(2) + '. ' +
        s.ips.toString().padStart(3) + '% IPS | ' +
        s.opts.toString().padStart(2) + ' ?: | ' +
        s.recs.toString().padStart(2) + ' any/rec | ' +
        s.total.toString().padStart(3) + ' fields | ' +
        s.name + ' (' + s.file + ')'
    );
});

console.log('');
console.log('=== ZONA MERAH (IPS >= 70%) - WAJIB REFACTOR ===');
const red = stats.filter(s => s.ips >= 70);
red.forEach(s => {
    console.log('');
    console.log(`${s.ips}% IPS | ${s.name}`);
    console.log(`  File: ${s.filePath}`);
    console.log(`  Stats: ${s.opts} optional, ${s.recs} any/Record, ${s.total} total fields`);
});

console.log('');
console.log('=== ZONA KUNING (IPS 30-69%) - PERLU PERBAIKAN ===');
const yellow = stats.filter(s => s.ips >= 30 && s.ips < 70);
console.log(`Found ${yellow.length} interfaces in yellow zone`);
