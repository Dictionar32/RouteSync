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
    // Match interface declarations
    const regex = /(?:export\s+)?interface\s+([A-Za-z0-9_]+)[^{]*\{([^}]+)\}/g;
    let m;

    while ((m = regex.exec(c)) !== null) {
        const name = m[1];
        const body = m[2];

        // Parse lines
        const lines = body.split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));

        // Count different string patterns
        let plainStrings = 0;
        let optionalStrings = 0;
        let readonlyStrings = 0;
        let stringArrays = 0;
        let stringRecords = 0;

        const fieldDetails = [];

        lines.forEach(l => {
            // Skip non-field lines (extends, etc)
            if (!l.includes(':')) return;

            const fieldMatch = l.match(/^\s*(readonly\s+)?([a-zA-Z0-9_]+)(\?)?:\s*(.+)/);
            if (!fieldMatch) return;

            const isReadonly = !!fieldMatch[1];
            const fieldName = fieldMatch[2];
            const isOptional = !!fieldMatch[3];
            const typeSpec = fieldMatch[4].replace(/;$/, '').trim();

            // Detect plain string (not branded, not union with non-strings)
            if (/^string$/i.test(typeSpec)) {
                plainStrings++;
                fieldDetails.push({ fieldName, type: 'string', isOptional, isReadonly });
            } else if (/^string\?$/i.test(typeSpec)) {
                optionalStrings++;
                fieldDetails.push({ fieldName, type: 'string?', isOptional, isReadonly });
            } else if (/^readonly\s+string\[\]$/i.test(typeSpec) || /^string\[\]$/i.test(typeSpec)) {
                stringArrays++;
                fieldDetails.push({ fieldName, type: 'string[]', isOptional, isReadonly });
            } else if (/Record<string,\s*string>/.test(typeSpec)) {
                stringRecords++;
                fieldDetails.push({ fieldName, type: 'Record<string, string>', isOptional, isReadonly });
            }
        });

        const totalStrings = plainStrings + optionalStrings + stringArrays + stringRecords;
        const totalFields = lines.filter(l => l.includes(':')).length;

        if (totalStrings > 0) {
            stats.push({
                name,
                file: path.basename(f),
                filePath: f,
                totalFields,
                plainStrings,
                optionalStrings,
                stringArrays,
                stringRecords,
                totalStrings,
                stringRatio: totalFields > 0 ? Math.round((totalStrings / totalFields) * 100) : 0,
                fieldDetails
            });
        }
    }
});

// Sort by total string fields descending
stats.sort((a, b) => b.totalStrings - a.totalStrings || b.stringRatio - a.stringRatio);

console.log('TOP 20 INTERFACE DENGAN STRING FIELD TERBANYAK:');
console.log('(Plain string, bukan branded/discriminated types)\n');

stats.slice(0, 20).forEach((s, i) => {
    console.log(
        (i + 1).toString().padStart(2) + '. ' +
        s.totalStrings.toString().padStart(2) + ' strings | ' +
        s.stringRatio.toString().padStart(3) + '% ratio | ' +
        s.totalFields.toString().padStart(2) + ' fields | ' +
        s.name + ' (' + s.file + ')'
    );
});

console.log('\n=== WORST OFFENDER (Most String Fields) ===\n');

if (stats.length > 0) {
    const worst = stats[0];
    console.log(`Interface: ${worst.name}`);
    console.log(`File: ${worst.filePath}`);
    console.log(`Total Fields: ${worst.totalFields}`);
    console.log(`String Fields: ${worst.totalStrings} (${worst.stringRatio}%)`);
    console.log(`  - Plain string: ${worst.plainStrings}`);
    console.log(`  - Optional string: ${worst.optionalStrings}`);
    console.log(`  - string[]: ${worst.stringArrays}`);
    console.log(`  - Record<string, string>: ${worst.stringRecords}`);
    console.log('\nField Breakdown:');

    worst.fieldDetails.forEach(fd => {
        const modifiers = [];
        if (fd.isReadonly) modifiers.push('readonly');
        if (fd.isOptional) modifiers.push('optional');
        const modStr = modifiers.length > 0 ? ` [${modifiers.join(', ')}]` : '';
        console.log(`  - ${fd.fieldName}: ${fd.type}${modStr}`);
    });
}

console.log('\n=== TOP 5 BY STRING RATIO (% of fields that are strings) ===\n');
const topRatio = [...stats].sort((a, b) => b.stringRatio - a.stringRatio || b.totalStrings - a.totalStrings);
topRatio.slice(0, 5).forEach((s, i) => {
    console.log(`${i + 1}. ${s.stringRatio}% | ${s.totalStrings}/${s.totalFields} strings | ${s.name} (${s.file})`);
});
