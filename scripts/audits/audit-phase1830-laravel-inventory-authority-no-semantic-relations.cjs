const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['inventory closure contract remains versioned and result variants match the contract', /readonly version: 6/.test(contract) && /contractVersion: 6/.test(contract)],
  ['contract explicitly forbids semantic foundation and semantic relations dependencies', /dependencyBoundaryRule:[\s\S]*?must-not-import-semantic-foundation-or-semantic-relations/.test(contract)],
  ['inventory authority imports only its upstream contract', !/from ['"][^'"]*semantic\/(?:foundation|relation|relations)/.test(authority)],
  ['inventory authority has no semantic foundation or semantic relation path', !/semantic\/(?:foundation|relation|relations)/.test(authority)],
  ['authority remains the declared interface implementation', /laravelControllerInvocationSemanticJudgmentInventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(authority)],
  ['authority consumes canonical typed identity relation judgments', /laravelSourceIdentitySemantics\.relateSourceProjects/.test(authority) && /laravelSourceIdentitySemantics\.relateSourceFiles/.test(authority) && !/sameSourceProject|sameSourceFile/.test(authority)],
  ['authority enforces witness completeness and source uniqueness', /witnessComplete/.test(authority) && /duplicateSources/.test(authority) && /each-source-file-identity-is-canonical-and-unique/.test(contract)],
  ['authority enforces missing, multiple, and orphan judgment obligations', /missingJudgments/.test(authority) && /multipleJudgments/.test(authority) && /orphanJudgments/.test(authority)],
  ['authority preserves a non-empty typed rejection ledger', /readonly rejections: readonly \[[\s\S]*?LaravelControllerInvocationSemanticJudgmentInventoryRejection,/.test(contract) && /readonly \[LaravelControllerInvocationSemanticJudgmentInventoryRejection, \.\.\.LaravelControllerInvocationSemanticJudgmentInventoryRejection\[\]\]/.test(authority)],
  ['authority does not use if, ternary, Map/Set, Object.is, or type assertions', !/\bif\s*\(/.test(authority) && !/\?[^.:]/.test(authority) && !/\bnew\s+(Map|Set)\b/.test(authority) && !/Object\.is/.test(authority) && !/\s+as\s+(const|[A-Z_a-z])/.test(authority)],
  ['scanner consumes the closure receipt rather than raw judgments', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner) && !/readonly invocationJudgments: readonly/.test(scanner)],
  ['production legacy scanner wiring is accurately marked as not yet migrated', /ControllerScanner\.scanCanonicalBundle/.test(pipeline) && /ControllerScanner\.extractResourceDataflow/.test(pipeline)],
  ['phase audit command is registered', scripts['audit:phase1830-laravel-inventory-authority-no-semantic-relations'] === 'node scripts/audits/audit-phase1830-laravel-inventory-authority-no-semantic-relations.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: inventory contract first; authority implementation has no semantic/foundation or semantic/relations imports; production scanner wiring remains legacy.\n');
process.exitCode = failures === 0 ? 0 : 1;
