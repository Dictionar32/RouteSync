const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const extensions = ['.ts', '.tsx', '.mts', '.cts'];
const entries = [
  'packages/cli/src/standaloneCompositionLoader.ts',
  'packages/cli/src/upstreamCompositionFactory.ts',
];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const resolveSource = (fromFile, specifier) => {
  if (specifier === '@routesync/core/upstream') return path.join(root, 'packages/core/src/upstream.ts');
  if (specifier === '@routesync/core') return path.join(root, 'packages/core/src/index.ts');
  if (!specifier.startsWith('.')) return undefined;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, ...extensions.map(extension => `${base}${extension}`), ...extensions.map(extension => path.join(base, `index${extension}`))];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};
const specifiersIn = source => [...source.replace(/\bimport\s+type\s+[\s\S]*?\sfrom\s*['"][^'"]+['"];?/g, '').replace(/\bexport\s+type\s+[\s\S]*?\sfrom\s*['"][^'"]+['"];?/g, '').matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
const queue = entries.map(file => path.join(root, file));
const visited = new Set();
const parent = new Map();
while (queue.length) {
  const file = queue.shift();
  if (visited.has(file) || !fs.existsSync(file)) continue;
  visited.add(file);
  for (const specifier of specifiersIn(fs.readFileSync(file, 'utf8'))) {
    const target = resolveSource(file, specifier);
    if (!target) continue;
    if (!parent.has(target)) parent.set(target, file);
    if (!visited.has(target)) queue.push(target);
  }
}
const relative = file => path.relative(root, file).split(path.sep).join('/');
const relations = [...visited].filter(file => /\/packages\/core\/src\/semantic\/relations\//.test(file));
const foundation = [...visited].filter(file => /\/packages\/core\/src\/semantic\/foundation\//.test(file));
const checks = [
  ['cli-loader-uses-narrow-upstream-surface', read('packages/cli/src/standaloneCompositionLoader.ts').includes("from '@routesync/core/upstream'")],
  ['cli-composition-factory-uses-narrow-upstream-surface', read('packages/cli/src/upstreamCompositionFactory.ts').includes("from '@routesync/core/upstream'")],
  ['narrow-surface-exports-existing-canonical-contract', read('packages/core/src/upstream.ts').includes("from './types/upstream/requestTypeDerivationInterface'")],
  ['narrow-surface-exports-existing-production-assembler', read('packages/core/src/upstream.ts').includes("from './compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition'")],
  ['type-resolution-path-is-declared', JSON.parse(read('tsconfig.json')).compilerOptions.paths['@routesync/core/upstream'][0] === './packages/core/src/upstream.ts'],
  ['build-declares-narrow-entrypoint', read('tsdown.config.ts').includes("upstream: 'packages/core/src/upstream.ts'")],
  ['composition-boundary-has-no-relations-dependency', relations.length === 0],
  ['composition-boundary-has-no-foundation-dependency', foundation.length === 0],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'BLOCKER'} ${name}\n`);
process.stdout.write(`\nPhase 2616: ${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed; ${visited.size} source files in composition-surface closure; ${relations.length} relations and ${foundation.length} foundation modules.\n`);
process.stdout.write('Scope is the host-composition boundary only; it does not claim the entire CLI is free of legacy relation imports.\n');
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
