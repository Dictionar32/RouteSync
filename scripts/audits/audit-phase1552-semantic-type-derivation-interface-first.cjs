const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const inventory = JSON.parse(read('PHASE1552_SCANNER_REASONING_INVENTORY.json'));
const ownership = JSON.parse(read('PHASE1552_SCANNER_REASONING_OWNERSHIP_MAP.json'));
const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const currentScannerFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const full = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(full);
  else if (/\.tsx?$/.test(entry.name)) currentScannerFiles.push(path.relative(root, full).split(path.sep).join('/'));
});
walk(scannerRoot);
const checks = [
  ['upstream contract declares request and closed judgment', () => /interface SemanticTypeDerivationRequest/.test(read('packages/core/src/types/upstream/semanticTypeDerivationInterface.ts')) && /interface SemanticTypeDerivationJudgment/.test(read('packages/core/src/types/upstream/semanticTypeDerivationInterface.ts')) && /closed: true/.test(read('packages/core/src/types/upstream/semanticTypeDerivationInterface.ts'))],
  ['authority consumes typed request', () => /SemanticTypeDerivationAuthorityInterface/.test(read('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts')) && /request\.resources/.test(read('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts'))],
  ['authority composes existing derivation algebras', () => ['deriveResourceTypes', 'deriveRouteResponseTypes', 'deriveModelTypes'].every(x => read('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts').includes(x))],
  ['runtime executor delegates without derivation logic', () => /authority\.resolve\(request\)/.test(read('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts')) && !/deriveResourceTypes|deriveModelTypes|deriveRouteResponseTypes/.test(read('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts'))],
  ['scanner facade delegates through executor', () => /(?:runtimeExecutor|executor)\.execute/.test(read('packages/core/src/compiler/scanner/operations/SemanticTypeDeriver.ts')) && !/deriveResourceTypes\(context|deriveModelTypes\(context/.test(read('packages/core/src/compiler/scanner/operations/SemanticTypeDeriver.ts'))],
  ['semantic implementation no longer lives under scanner/operations/semantic', () => !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/semantic'))],
  ['upstream barrel exports contract', () => /semanticTypeDerivationInterface/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['request type derivation frontier documented honestly', () => /RequestTypeDeriver/.test(read('packages/core/src/types/docs/PHASE1552_SEMANTIC_TYPE_DERIVATION_INTERFACE_FIRST.md'))],
  ['current inventory covers every scanner TS/TSX file', () => inventory.files.length === currentScannerFiles.length && currentScannerFiles.every(file => inventory.files.some(entry => entry.path === file))],
  ['ownership map inventory matches current scan', () => ownership.inventory.sourceFiles === inventory.totals.sourceFiles && ownership.inventory.filesWithReasoningSignals === inventory.totals.filesWithReasoningSignals],
];
let failed = 0;
const report = { phase: 1552, title: 'Semantic type derivation interface-first ownership migration', passed: 0, total: checks.length, inventory: inventory.totals, checks: [] };
for (const [name, test] of checks) {
  const pass = Boolean(test());
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failed++;
  report.checks.push({ name, passed: pass });
}
report.passed = checks.length - failed;
fs.writeFileSync(path.join(root, 'PHASE1552_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(`Phase 1552 audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed ? 1 : 0;
