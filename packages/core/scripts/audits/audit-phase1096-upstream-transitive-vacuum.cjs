const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '../../../..');
const upstreamDir = path.join(repo, 'packages/core/src/types/upstream');
const sourceRoots = [
  path.join(repo, 'packages/core/src'),
  path.join(repo, 'packages/cli/src'),
  path.join(repo, 'examples'),
];
const tsFiles = [];
const walk = dir => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) tsFiles.push(full);
  }
};
sourceRoots.forEach(walk);

const files = fs.readdirSync(upstreamDir).filter(name => name.endsWith('.ts')).sort();
const read = file => fs.readFileSync(file, 'utf8');
const stem = file => path.basename(file, '.ts');
const imports = new Map(files.map(file => [stem(file), []]));
const exportsFromBarrel = new Set();

const importRe = /(?:from|import)\s*["']([^"']*types\/upstream\/[^"']+)["']/g;
for (const file of tsFiles) {
  const text = read(file);
  for (const match of text.matchAll(importRe)) {
    const candidate = path.basename(match[1]).replace(/\.js$/, '');
    if (imports.has(candidate)) imports.get(candidate).push(file);
  }
}

const barrel = read(path.join(upstreamDir, 'index.ts'));
for (const match of barrel.matchAll(/(?:export\s+\*\s+from|export\s+\{[^}]+\}\s+from)\s*["']\.\/([^"']+)["']/g)) {
  exportsFromBarrel.add(match[1].replace(/\.js$/, ''));
}

const exportedSymbols = new Map();
for (const file of files) {
  const text = read(path.join(upstreamDir, file));
  const symbols = [];
  for (const m of text.matchAll(/export\s+(?:(?:type|interface|class|const|function|enum)\s+)?([A-Za-z_$][\w$]*)/g)) symbols.push(m[1]);
  exportedSymbols.set(stem(file), symbols);
}

const trueVacuumCandidates = [];
const activeBarrelOnly = [];
const activeByReference = [];
for (const file of files) {
  const key = stem(file);
  const bytes = fs.statSync(path.join(upstreamDir, file)).size;
  const refs = imports.get(key) || [];
  const barrelExported = exportsFromBarrel.has(key);
  if (refs.length === 0 && !barrelExported && exportedSymbols.get(key).length === 0 && bytes === 0) trueVacuumCandidates.push(file);
  else if (refs.length === 0 && barrelExported) activeBarrelOnly.push(file);
  else if (refs.length > 0) activeByReference.push(file);
}

const targetChecks = {
  manifest: file => file.includes('/manifest/') || file.endsWith('/manifest.ts'),
  graph: file => file.includes('/graph/') || file.endsWith('/graph.ts'),
  ir: file => file.includes('/ir/') || file.endsWith('/ir.ts'),
  route: file => file.includes('/route/') || file.endsWith('/route.ts'),
  controller: file => file.includes('/controller/') || file.endsWith('/controller.ts'),
  model_relation: file => file.endsWith('/modelRelation.ts') || file.includes('/model_relation/'),
  resource: file => file.includes('/resource/') || file.endsWith('/resource.ts'),
  schema: file => file.includes('/schema/') || file.endsWith('/schema.ts'),
};
const targetPresence = Object.fromEntries(Object.entries(targetChecks).map(([name, check]) => [name, tsFiles.some(check)]));
const scannerFiles = tsFiles.filter(file => /StaticLaravelScanner/.test(path.basename(file)));
const scannerRefs = tsFiles.flatMap(file => {
  const text = read(file);
  return /StaticLaravelScanner/.test(text) ? [file] : [];
});
const cliCommands = tsFiles.filter(file => file.includes('/packages/cli/src/commands/'));
const cliInternalImports = cliCommands.flatMap(file => {
  const text = read(file);
  return [...text.matchAll(/from\s*["']([^"']+)["']/g)].map(m => ({ file, import: m[1] }))
    .filter(x => /@routesync\/core\/src|types\/upstream|StaticLaravelScanner/.test(x.import));
});

const report = {
  phase: 1096,
  upstreamFileCount: files.length,
  activeByReference,
  activeBarrelOnly,
  trueVacuumCandidates,
  targetPresence,
  ecommerceFixturePresent: fs.existsSync(path.join(repo, 'examples/ecommerce-shop-source')),
  staticLaravelScannerFiles: scannerFiles,
  staticLaravelScannerReferences: scannerRefs,
  cliInternalImports,
  expectedVacuum: ['routeMissing.ts', 'routeResource.ts', 'routeResourceMode.ts'],
};
report.passed =
  report.trueVacuumCandidates.join(',') === report.expectedVacuum.join(',') &&
  report.ecommerceFixturePresent &&
  Object.values(report.targetPresence).every(Boolean) &&
  report.staticLaravelScannerFiles.length === 0 &&
  report.staticLaravelScannerReferences.length === 0 &&
  report.cliInternalImports.length === 0;

const out = path.join(repo, 'reports/phase1096-upstream-transitive-vacuum.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
