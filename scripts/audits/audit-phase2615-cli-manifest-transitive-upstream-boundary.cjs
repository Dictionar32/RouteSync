const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourceExtensions = ['.ts', '.tsx', '.mts', '.cts'];
const entrypoints = [
  'packages/cli/src/index.ts',
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/cli/src/upstreamCompositionFactory.ts',
];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const resolveSource = (fromFile, specifier) => {
  if (specifier === '@routesync/core') return path.join(root, 'packages/core/src/index.ts');
  if (!specifier.startsWith('.')) return undefined;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, ...sourceExtensions.map(extension => `${base}${extension}`), ...sourceExtensions.map(extension => path.join(base, `index${extension}`))];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};
const specifiersIn = source => [...source.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
const queue = entrypoints.map(file => path.join(root, file));
const visited = new Set();
const parent = new Map();
const edges = [];
while (queue.length) {
  const file = queue.shift();
  if (visited.has(file) || !fs.existsSync(file)) continue;
  visited.add(file);
  const source = fs.readFileSync(file, 'utf8');
  for (const specifier of specifiersIn(source)) {
    const target = resolveSource(file, specifier);
    if (!target) continue;
    edges.push({ from: file, to: target, specifier });
    if (!parent.has(target)) parent.set(target, file);
    if (!visited.has(target)) queue.push(target);
  }
}
const relative = file => path.relative(root, file).split(path.sep).join('/');
const traceTo = target => {
  const chain = [target];
  let cursor = target;
  while (parent.has(cursor)) {
    cursor = parent.get(cursor);
    chain.push(cursor);
  }
  return chain.reverse().map(relative);
};
const relationFiles = [...visited].filter(file => /\/packages\/core\/src\/semantic\/relations\//.test(file));
const foundationFiles = [...visited].filter(file => /\/packages\/core\/src\/semantic\/foundation\//.test(file));
const checks = [
  { name: 'cli-manifest-source-identity-binding-is-explicitly-wired', passed: read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts').includes('sourceDocumentIdentityBinding: phpSourceDocumentIdentityBinding'), detail: 'manifest composition injects the existing upstream identity-binding operation' },
  { name: 'manifest-workflow-contract-matches-implementation', passed: read('scripts/audits/audit-phase2614-manifest-upstream-contract-alignment.cjs').includes('manifest-workflow-implementation-matches-its-closed-contract'), detail: 'the dedicated workflow audit exists and checks exact ordered equality' },
  { name: 'static-invocation-coverage-is-not-claimed-complete', passed: read('packages/core/src/types/upstream/invocationSemanticCoverageInventory.ts').includes('static-invocation-algebra-and-authority-not-yet-implemented'), detail: 'static invocation is explicitly represented as uncovered' },
  { name: 'semantic-fact-coverage-inventory-is-exhaustive-over-the-current-adt', passed: read('packages/core/src/types/upstream/invocationSemanticCoverageInventory.ts').includes('const exhaustive: never = fact') && !/default:\s*return \[\]/.test(read('packages/core/src/types/upstream/invocationSemanticCoverageInventory.ts')), detail: 'all current SemanticFact variants are explicitly classified; future ADT additions cannot silently disappear from inventory inspection' },
  { name: 'production-reasoning-and-complete-verifier-remain-explicit-blockers', passed: read('scripts/audits/audit-phase2592-cli-manifest-upstream-production-path.cjs').includes('no production implementation owns infer') && read('scripts/audits/audit-phase2592-cli-manifest-upstream-production-path.cjs').includes('no single production verifier establishes all 34 laws'), detail: 'current audit records missing production reasoning and independent complete verifier rather than inferring success' },
  { name: 'transitive-core-graph-does-not-import-forbidden-relations', passed: relationFiles.length === 0, detail: `transitive graph reaches ${relationFiles.length} core semantic/relations modules across ${visited.size} source files` },
  { name: 'transitive-core-graph-does-not-import-forbidden-foundation', passed: foundationFiles.length === 0, detail: `transitive graph reaches ${foundationFiles.length} core semantic/foundation modules across ${visited.size} source files` },
];
for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'BLOCKER'} ${result.name}: ${result.detail}\n`);
for (const file of [...relationFiles.slice(0, 8), ...foundationFiles.slice(0, 8)]) {
  process.stdout.write(`TRACE ${relative(file)}\n  ${traceTo(file).join('\n  -> ')}\n`);
}
process.stdout.write(`\nPhase 2615: ${checks.filter(check => check.passed).length}/${checks.length} checks passed; ${relationFiles.length} relation and ${foundationFiles.length} foundation modules are in the static transitive graph.\n`);
process.stdout.write('Static source-graph traversal follows relative imports and exports plus @routesync/core -> packages/core/src/index.ts; it is not a runtime bundle trace.\n');
if (checks.some(check => !check.passed)) process.exitCode = 1;
