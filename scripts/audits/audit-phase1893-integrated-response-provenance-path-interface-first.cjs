const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const binding = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const judgmentAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const inventoryAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const packageJson = JSON.parse(read('package.json'));
const boundary = scannerInterface.match(/canonicalSubjectProvenanceBoundary: '([^']+)'/)?.[1] ?? '';
const checks = [
  ['scanner boundary contract advances to v62 in interface and canonical value', /readonly version: 65/.test(scannerInterface) && /version: 65,\n  scannerOutput:/.test(scannerInterface)],
  ['complete and blocked outcomes reference the closed source-binding judgment, whose shape retains identityJudgment', /php_source_invocation_integration_complete[\s\S]*?sourceBinding:[\s\S]*?php_source_invocation_semantic_source_binding_closed/.test(integration) && /php_source_invocation_integration_blocked[\s\S]*?sourceBinding:[\s\S]*?php_source_invocation_semantic_source_binding_closed/.test(integration) && /php_source_invocation_semantic_source_binding_closed[\s\S]*?identityJudgment/.test(binding)],
  ['rejected integrated outcome owns rejected identity proof under judgment, not sourceBinding', /php_source_invocation_integration_source_binding_rejected[\s\S]*?judgment:[\s\S]*?php_source_invocation_semantic_source_binding_rejected/.test(integration) && /judgment\.identityJudgment/.test(boundary) && !/rejected-responses-retain-the-proof-at-response\.sourceBinding/.test(boundary)],
  ['not-connected remains explicit and does not claim a source-binding proof', /php_source_invocation_integration_not_connected[\s\S]*?evidence:/.test(integration) && /not-connected-retains-its-explicit-evidence-without-inventing-a-binding-proof/.test(boundary)],
  ['canonical source subject remains judgment.sourceFile and no parallel model is introduced', /readonly sourceFile: SourceFile/.test(judgment) && /canonicalSubjectOwnershipRule/.test(judgment) && !/LaravelControllerInvocationSemanticJudgmentV2/.test(judgment + scannerInterface)],
  ['scanner runtime remains unchanged from Phase 1892', digest(scanner) === '841016ec8b2112e8a125ccc9a624551280502c2b052eb5a7cf9a6936240e4e2b'],
  ['invocation judgment authority implementation remains unchanged', digest(judgmentAuthority) === 'a46716c7b3685077581afea554c26f196ab899eaff4ec93ef1f59455f3db1cec'],
  ['inventory authority implementation remains unchanged', digest(inventoryAuthority) === '1be09b7c2891dadb8c07a9a741c83ef678be4a657ad0cdbadf034a2eabcc5314'],
  ['audit command is registered in package scripts', packageJson.scripts['audit:phase1893-integrated-response-provenance-path-interface-first'] === 'node scripts/audits/audit-phase1893-integrated-response-provenance-path-interface-first.cjs'],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(scannerInterface + integration + judgment)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
