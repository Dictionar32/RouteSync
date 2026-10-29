const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const scopes = [
  'packages/cli/src/parsers/php',
  'packages/core/src/types/upstream',
  'packages/core/src/compiler/scanner/wiring',
];
const collect = directory => fs.existsSync(directory)
  ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? collect(full) : full.endsWith('.ts') ? [full] : [];
    })
  : [];
const metrics = scopes.map(scope => {
  const files = collect(path.join(root, scope));
  const lines = files.flatMap(file => fs.readFileSync(file, 'utf8').split(/\r?\n/).map((text, index) => ({ file: path.relative(root, file), line: index + 1, text })));
  return {
    scope,
    files: files.length,
    exportFunctions: lines.filter(line => /^\s*export\s+function\s+/.test(line.text)).length,
    mapLines: lines.filter(line => line.text.includes('.map(')).length,
    reduceLines: lines.filter(line => line.text.includes('.reduce(')).length,
    optionalOrUndefinedLines: lines.filter(line => line.text.includes('?:') || line.text.includes('| undefined')).length,
    unannotatedExportedCallableConstCandidates: lines.filter(line => /^\s*export\s+const\s+/.test(line.text) && line.text.includes('=>') && line.text.includes('=') && !line.text.slice(0, line.text.indexOf('=')).includes(':')).length,
  };
});
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsEmpty = fs.existsSync(collections) && fs.statSync(collections).size === 0;
console.log(JSON.stringify({ phase: 2886, metrics, collectionsEmpty }, null, 2));
if (!collectionsEmpty || metrics.some(metric => metric.exportFunctions !== 0)) process.exitCode = 1;
