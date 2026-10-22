const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const entries = [
  'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
];
const importPattern = /(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g;
const resolveImport = (source, specifier) => {
  const base = path.resolve(path.dirname(source), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, `${base}.cts`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};
const visited = new Set();
const edges = new Set();
const pending = entries.map((entry) => path.join(root, entry));
while (pending.length) {
  const source = pending.pop();
  if (visited.has(source) || !fs.existsSync(source)) continue;
  visited.add(source);
  const contents = fs.readFileSync(source, 'utf8');
  for (const match of contents.matchAll(importPattern)) {
    const target = resolveImport(source, match[1]);
    if (!target) continue;
    edges.add(`${source} -> ${target}`);
    if (!visited.has(target)) pending.push(target);
  }
}
const relative = (file) => path.relative(root, file);
const relationModules = [...visited].filter((file) => `${file}`.includes(`${path.sep}semantic${path.sep}relations${path.sep}`)).sort();
const foundationSegments = [...visited].filter((file) => `${file}`.toLowerCase().includes(`${path.sep}foundation${path.sep}`)).sort();
const relationFoundation = [...visited].filter((file) => path.basename(file).toLowerCase().includes('relationfoundation')).sort();
const subscanners = [...visited].filter((file) => `${file}`.includes(`${path.sep}subscanners${path.sep}`)).sort();
console.log(`entry points: ${entries.join(', ')}`);
console.log(`reachable modules: ${visited.size}`);
console.log(`resolved relative import edges: ${edges.size}`);
console.log(`semantic/relations modules: ${relationModules.length}`);
for (const file of relationModules) console.log(`RELATION ${relative(file)}`);
console.log(`foundation path-segment modules: ${foundationSegments.length}`);
for (const file of foundationSegments) console.log(`FOUNDATION ${relative(file)}`);
console.log(`relationFoundation-named modules: ${relationFoundation.length}`);
for (const file of relationFoundation) console.log(`RELATION_FOUNDATION ${relative(file)}`);
console.log(`subscanner modules: ${subscanners.length}`);
for (const file of subscanners) console.log(`SUBSCANNER ${relative(file)}`);
