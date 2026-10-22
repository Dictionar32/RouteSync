const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const inventoryAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const upstream = read('packages/core/src/types/upstream/index.ts');
const core = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const v2Files = [
  'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentV2SourceSubjectInterface.ts',
  'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentV2InventoryInterface.ts',
];
const checks = [
  ['canonical judgment is the only invocation judgment model', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(judgment) && !/LaravelControllerInvocationSemanticJudgmentV2/.test(judgment)],
  ['canonical judgment contract v9 closes source ownership and integrated response provenance', /readonly version: 9/.test(judgment) && /canonicalSubjectOwnershipRule/.test(judgment) && /integratedResponseProvenanceRule/.test(judgment) && /singleCanonicalModelRule/.test(judgment) && /version: 9,/.test(authority)],
  ['canonical judgment keeps one sourceFile and an outcome-indexed integrated response', /readonly sourceFile: SourceFile/.test(judgment) && ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every((outcome) => judgment.includes(`php_source_invocation_integration_${outcome}`))],
  ['integrated response retains exact source-binding provenance for complete and blocked outcomes', /readonly sourceBinding: Extract<[\s\S]*?php_source_invocation_semantic_source_binding_closed/.test(integration) && /rejectedEvidencePreservation/.test(integration)],
  ['canonical inventory still consumes canonical judgments and matches by judgment.sourceFile', /judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface\[\]/.test(inventory) && /judgment\.sourceFile/.test(inventoryAuthority) && /sourceIdentityRule: 'judgment-source-file-is-the-canonical-source-identity/.test(inventory)],
  ['Laravel scanner interface and wiring still consume the canonical judgment', /invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(scannerInterface) && /invocationInventoryReceipt\.correspondences/.test(scanner) && /invocationJudgment\.sourceFile/.test(scanner)],
  ['V2 contract files have been removed', v2Files.every((file) => !fs.existsSync(path.join(root, file)))],
  ['upstream and core barrels no longer export V2 contracts', !/LaravelControllerInvocationSemanticJudgmentV2/.test(upstream + core)],
  ['authority and scanner runtime do not contain a V2 branch', !/LaravelControllerInvocationSemanticJudgmentV2/.test(authority + inventoryAuthority + scanner + scannerInterface)],
  ['no semantic/foundation dependency was introduced', !/semantic\/foundation/.test(judgment + inventory + authority + inventoryAuthority)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
