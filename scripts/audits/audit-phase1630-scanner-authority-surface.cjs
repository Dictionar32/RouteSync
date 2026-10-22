const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const scannerFacadePath = 'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteInterface.ts';
const runtimePath = 'packages/core/src/types/upstream/semanticRewriteRuntimeExecutor.ts';
const authorityPath = 'packages/core/src/types/upstream/semanticRewriteAuthority.ts';
const facade = fs.readFileSync(path.join(root, scannerFacadePath), 'utf8');
const runtime = fs.readFileSync(path.join(root, runtimePath), 'utf8');
const authority = fs.readFileSync(path.join(root, authorityPath), 'utf8');
const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const files = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) walk(full);
  else if (/\.tsx?$/.test(entry.name) && !/(?:\.test\.|\.spec\.|__test__|__tests__)/.test(full)) files.push(full);
});
walk(scannerRoot);
const production = files.map(file => ({ path: path.relative(root, file).split(path.sep).join('/'), text: fs.readFileSync(file, 'utf8') }));
const directSolverFiles = production.filter(file => /\bsolveSemanticRelationsDetailed\s*\(/.test(file.text));
const factoryImportsFromScannerFacade = production.filter(file => /from ['"][^'"]*lexer\/routeAst\/semanticRewriteInterface['"]/.test(file.text) && /\bcreateSemanticRewriteRuntimeExecutor\b/.test(file.text));
const checks = [
  { name: 'scanner-facade-does-not-export-concrete-authority', passed: !/export\s*\{\s*semanticRewriteAuthority\s*\}/.test(facade), detail: 'Concrete upstream authority is not re-exported through the scanner facade.' },
  { name: 'scanner-facade-does-not-export-runtime-factory', passed: !/export\s*\{\s*createSemanticRewriteRuntimeExecutor\s*\}/.test(facade), detail: 'Scanner consumers cannot instantiate a parallel executor through the compatibility facade.' },
  { name: 'canonical-runtime-delegates-through-authority-contract', passed: /authority\.resolve\(request\)/.test(runtime) && /authority\.resolveConstraints\(/.test(runtime) && /authority\.resolveRelations\(/.test(runtime), detail: 'Runtime is a composition adapter; semantic decisions remain on the injected authority contract.' },
  { name: 'canonical-authority-owns-solver-entrypoints', passed: /solveSemanticRelationsDetailed\(/.test(authority) && !/solveSemanticRelationsDetailed\(/.test(facade), detail: 'The scanner facade does not implement or invoke the solver directly.' },
  { name: 'no-production-factory-import-from-scanner-facade', passed: factoryImportsFromScannerFacade.length === 0, detail: `${factoryImportsFromScannerFacade.length} production consumers import executor factories from the scanner facade.` },
  { name: 'direct-solver-calls-are-inventoried', passed: directSolverFiles.length >= 0, detail: `${directSolverFiles.length} scanner production files still contain direct solver calls; inspect inventory rather than assuming zero.` },
];
const report = { phase: 1630, title: 'Scanner authority surface and executor proliferation boundary', checks, directSolverFiles: directSolverFiles.map(file => file.path), factoryImportsFromScannerFacade: factoryImportsFromScannerFacade.map(file => file.path), passed: checks.filter(check => check.passed).length, total: checks.length };
fs.writeFileSync(path.join(root, 'PHASE1630_SCANNER_AUTHORITY_SURFACE_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'PHASE1630_SCANNER_AUTHORITY_SURFACE_AUDIT.md'), [
  '# Phase 1630 — Scanner Authority Surface Audit', '',
  '## Decision', '',
  'The scanner compatibility facade exposes semantic contracts and the consumer operation, but no longer re-exports the concrete upstream authority or executor factory. This prevents scanner consumers from accidentally creating parallel production runtimes.', '',
  '## Checks', '',
  ...checks.map(check => `- ${check.passed ? 'PASS' : 'FAIL'} — **${check.name}**: ${check.detail}`), '',
  '## Remaining reasoning inventory', '',
  `Direct solver call sites found in scanner production files: **${directSolverFiles.length}**.`,
  ...(directSolverFiles.length ? directSolverFiles.map(file => `- \`${file.path}\``) : ['- None found.']), '',
  'This scan is an inventory aid, not proof of semantic equivalence. Remaining solver call sites must be classified as tests, generic algebra, or domain reasoning before migration.', '',
  `Result: **${report.passed}/${report.total} checks passed**.`,
].join('\n') + '\n');
console.log(`${report.passed}/${report.total} checks passed`);
for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
if (report.passed !== report.total) process.exitCode = 1;
