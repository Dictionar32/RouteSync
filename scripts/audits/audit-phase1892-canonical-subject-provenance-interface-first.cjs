const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const binding = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts');
const bindingAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const judgmentAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const inventoryAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const upstream = read('packages/core/src/types/upstream/index.ts');
const core = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const bindingImplementation = bindingAuthority.slice(bindingAuthority.indexOf('type ClosedSourceBindingJudgment'));
const checks = [
  ['source-binding interface v5 separates relation endpoints from the enclosing canonical subject key', /readonly version: 5/.test(binding) && /version: 5,/.test(bindingAuthority) && /identity-judgment-owns-the-two-endpoints/.test(binding) && /canonical-source-subject-key/.test(binding)],
  ['canonical invocation judgment remains the only judgment model', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(judgment) && !/LaravelControllerInvocationSemanticJudgmentV2/.test(judgment)],
  ['canonical source identity remains judgment.sourceFile while nested identity relation remains provenance', /readonly sourceFile: SourceFile/.test(judgment) && /canonicalSubjectOwnershipRule/.test(judgment) && /integratedResponseProvenanceRule/.test(judgment)],
  ['scanner boundary v63 explicitly separates canonical subject key from relation proof', /readonly version: 65/.test(scannerInterface) && /version: 65,/.test(scannerInterface) && /canonicalSubjectProvenanceBoundary/.test(scannerInterface)],
  ['scanner still accepts one authority-closed inventory receipt', /invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scannerInterface) && /invocationInventoryReceipt\.correspondences/.test(scanner)],
  ['scanner runtime is unchanged from Phase 1891', digest(scanner) === '841016ec8b2112e8a125ccc9a624551280502c2b052eb5a7cf9a6936240e4e2b'],
  ['invocation judgment authority implementation is unchanged', digest(judgmentAuthority) === 'a46716c7b3685077581afea554c26f196ab899eaff4ec93ef1f59455f3db1cec'],
  ['inventory authority implementation is unchanged', digest(inventoryAuthority) === '1be09b7c2891dadb8c07a9a741c83ef678be4a657ad0cdbadf034a2eabcc5314'],
  ['source-binding judgment construction and execution body are unchanged', digest(bindingImplementation) === '36d8d403e50a5839101735add4b63484034c50a7519e686cf75430975c053a27'],
  ['no V2 source-subject or inventory exports reintroduced', !/LaravelControllerInvocationSemanticJudgmentV2/.test(upstream + core)],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(binding + bindingAuthority + judgment + scannerInterface)],
  ['Phase 1892 audit is registered in package scripts', packageJson.scripts['audit:phase1892-canonical-subject-provenance-interface-first'] === 'node scripts/audits/audit-phase1892-canonical-subject-provenance-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
