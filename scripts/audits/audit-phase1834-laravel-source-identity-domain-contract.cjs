const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const index = read('packages/core/src/index.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['identity contract advances to version 4', /readonly version: 4/.test(identity) && /version: 4/.test(identity)],
  ['string component-rule types are removed', !/SourceProjectIdentityRule|SourceFileIdentityRule/.test(identity)],
  ['identity contract does not encode domain structure as component labels', !/project-kind|project-root|source-span-start|source-span-end|source-file-value/.test(identity)],
  ['project identity is based on canonical project root rather than provenance span', /left\.root\.value\.value === right\.root\.value\.value/.test(identity) && !/left\.source\.(?:file|start|end)/.test(identity)],
  ['source-file identity is based on canonical SourceFile value', /left\.value\.value === right\.value\.value/.test(identity)],
  ['project relation returns a typed judgment', /type SourceProjectIdentityRelationJudgment/.test(identity) && /kind: 'same_source_project_identity'/.test(identity) && /kind: 'different_source_project_identity'/.test(identity)],
  ['file relation returns a typed judgment', /type SourceFileIdentityRelationJudgment/.test(identity) && /kind: 'same_source_file_identity'/.test(identity) && /kind: 'different_source_file_identity'/.test(identity)],
  ['identity interface has no boolean result contract', /relateSourceProjects:[\s\S]*?SourceProjectIdentityRelationJudgment/.test(identity) && /relateSourceFiles:[\s\S]*?SourceFileIdentityRelationJudgment/.test(identity) && !/=> boolean/.test(identity)],
  ['inventory contract composes the canonical identity contract', /readonly identitySemanticsContract: LaravelSourceIdentitySemanticsContract/.test(inventory) && /identitySemanticsContract: LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT/.test(inventory)],
  ['inventory contract and result use version 11 with a shared typed reasoning ADT', /readonly version: 11/.test(inventory) && /contractVersion: 11/.test(inventory) && /version: 11/.test(inventory) && /readonly reasoning: LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract/.test(inventory)],
  ['authority consumes canonical typed identity judgments', /relateSourceProjects/.test(authority) && /relateSourceFiles/.test(authority) && /reasoning\.judgeProjectBinding/.test(authority) && /relateSourceProjects/.test(authority)],
  ['authority has no Object.is or forbidden semantic imports', !/Object\.is/.test(authority) && !/semantic\/(?:foundation|relation|relations)/.test(authority)],
  ['identity module has no forbidden semantic imports', !/semantic\/(?:foundation|relation|relations)/.test(identity)],
  ['integrated response stays correlated with source identity in one discriminated judgment', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, \{ readonly kind: 'php_source_invocation_integration_complete' \}>/.test(judgment) && /readonly kind: 'php_source_invocation_integration_not_connected'/.test(judgment)],
  ['scanner accepts closure receipt rather than raw judgment array', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner) && !/readonly invocationInventory: readonly/.test(scanner)],
  ['production pipeline no longer depends on legacy controller scanner calls', !/ControllerScanner\.scanCanonicalBundle/.test(pipeline) && !/ControllerScanner\.extractResourceDataflow/.test(pipeline)],
  ['public index no longer exports string component-rule types', !/SourceProjectIdentityRule|SourceFileIdentityRule/.test(index)],
  ['Phase 1834 audit is registered', scripts['audit:phase1834-laravel-source-identity-domain-contract'] === 'node scripts/audits/audit-phase1834-laravel-source-identity-domain-contract.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: source identity uses domain-owned identity fields and typed relation judgments; inventory composes the canonical identity and reasoning contracts; production pipeline avoids the legacy controller scanner calls.\n');
process.exitCode = failures === 0 ? 0 : 1;
