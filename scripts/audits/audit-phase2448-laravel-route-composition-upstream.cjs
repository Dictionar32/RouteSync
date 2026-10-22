const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const emitter = read('packages/core/src/compiler/scanner/upstream/routeBoundaryEmitter.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');

const checks = [
  ['active route scanner has no direct relations/foundation imports', !/from\s+['"][^'"]*semantic\/(?:relations|foundation)/.test(scanner)],
  ['active route scanner no longer imports routeProducerRelations/route-scanner/scannerUtils', !/from\s+['"][^'"]*subscanners\/(?:routeProducerRelations|route-scanner|scannerUtils)/.test(scanner)],
  ['route composition implementation has no direct relations/foundation imports', !/from\s+['"][^'"]*semantic\/(?:relations|foundation)/.test(composition)],
  ['route boundary emitter has no direct relations/foundation imports', !/from\s+['"][^'"]*semantic\/(?:relations|foundation)/.test(emitter)],
  ['upstream contract explicitly models route composition, policy, source selection, and final outcome', /interface LaravelRouteDeclarationCompositionAuthorityInterface/.test(contract) && /catalogFromControllerScan/.test(contract) && /policyForBinding/.test(contract) && /resolveSourceFiles/.test(contract) && /observeSourceFiles/.test(contract) && /outcomeFromScan/.test(contract)],
  ['runtime no longer owns route selection, policy projection, or blocked-outcome classification helpers', !/const routeFiles\s*=/.test(scanner) && !/effectiveControllerActionPolicyForBinding/.test(scanner) && !/laravel_route_scan_response_blocked/.test(scanner)],
  ['runtime execution calls prepared operation without execute arguments', /execute:\s*\(\)\s*=>\s*Promise<LaravelRouteScanOutcome>/.test(contract) && /async execute\(\)/.test(scanner) && !/\.execute\([^)]/.test(scanner)],
  ['authority is wired into scanner construction', /declarationCompositionAuthority:\s*routeDeclarationCompositionAuthority/.test(scanner) && /this\.declarationCompositionAuthority\.compose\(/.test(scanner)],
];

let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}

const knownGaps = [
  ['closure return semantic producer still imports the legacy controller AST subscanner', /from '\.\.\/subscanners\/controller\/controllerAstCanonical'/.test(composition)],
  ['legacy route producer/emitter subscanner files are retired', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/route-scanner'))],
];
for (const [label, state] of knownGaps) {
  const passed = label.startsWith('legacy route') ? state : !state;
  process.stdout.write(`${passed ? 'PASS' : 'WARN'} ${label}\n`);
}

const sourceRoot = path.join(root, 'packages/core/src');
const scannerPath = path.join(sourceRoot, 'compiler/scanner/wiring/laravelRouteScanner.ts');
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g;
const resolveLocal = (specifier, parent) => {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(parent), specifier);
  for (const candidate of [base + '.ts', path.join(base, 'index.ts'), base]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
};
const visited = new Set();
const forbiddenPaths = [];
const visit = (file, chain) => {
  if (visited.has(file)) return;
  visited.add(file);
  if (file.includes(`${path.sep}semantic${path.sep}relations${path.sep}`) || file.includes(`${path.sep}semantic${path.sep}foundation${path.sep}`)) {
    forbiddenPaths.push([...chain, file]);
    return;
  }
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const target = resolveLocal(match[1], file);
    if (target) visit(target, [...chain, file]);
  }
};
visit(scannerPath, []);
process.stdout.write(`${forbiddenPaths.length ? 'WARN' : 'PASS'} transitive source graph reaches semantic/relations or semantic/foundation (${forbiddenPaths.length} distinct reachable path(s); includes type imports)\n`);
for (const chain of forbiddenPaths.slice(0, 4)) {
  process.stdout.write(`  ${chain.map(file => path.relative(sourceRoot, file)).join(' -> ')}\n`);
}

process.stdout.write(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed.\n`);
process.stdout.write('Transitive graph warnings are intentionally non-passing architecture work; this audit does not certify full relations/foundation removal.\n');
process.exit(checks.some(([, passed]) => !passed) ? 1 : 0);
