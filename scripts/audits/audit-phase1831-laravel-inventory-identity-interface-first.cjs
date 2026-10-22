const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['canonical source identity semantics has a named contract', /interface LaravelSourceIdentitySemanticsContract/.test(identity) && /LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT/.test(identity)],
  ['source identity contract defines project and source-file equivalence', /sourceProjectIdentityRule/.test(identity) && /sourceFileIdentityRule/.test(identity)],
  ['canonical identity semantics is an upstream interface', /interface LaravelSourceIdentitySemanticsInterface/.test(identity) && /relateSourceProjects:[\s\S]*?SourceProjectIdentityRelationJudgment/.test(identity) && /relateSourceFiles:[\s\S]*?SourceFileIdentityRelationJudgment/.test(identity)],
  ['identity implementation is owned by the source identity module', /laravelSourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface/.test(identity)],
  ['identity relations are closed typed judgments rather than boolean predicates', /type SourceProjectIdentityRelationJudgment/.test(identity) && /type SourceFileIdentityRelationJudgment/.test(identity) && !/=> boolean/.test(identity)],
  ['inventory contract is version 6 and declares identity dependency', /readonly version: 6/.test(contract) && /readonly identitySemantics: LaravelSourceIdentitySemanticsInterface/.test(contract)],
  ['inventory authority publishes the canonical identity semantics dependency', /identitySemantics: laravelSourceIdentitySemantics/.test(authority)],
  ['inventory authority delegates project equality to identity semantics', /laravelSourceIdentitySemantics\.relateSourceProjects/.test(authority)],
  ['inventory authority delegates file equality to identity semantics', /laravelSourceIdentitySemantics\.relateSourceFiles/.test(authority)],
  ['inventory authority contains no Object.is', !/Object\.is/.test(authority)],
  ['inventory authority has no semantic foundation or relation imports', !/semantic\/(?:foundation|relation|relations)/.test(authority)],
  ['identity semantics module has no semantic foundation or relation imports', !/semantic\/(?:foundation|relation|relations)/.test(identity)],
  ['integrated response remains correlated with source identity in one judgment', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['scanner boundary consumes the closure receipt', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner)],
  ['production pipeline legacy ControllerScanner dependency remains visible for later migration', /ControllerScanner\.scanCanonicalBundle/.test(pipeline) && /ControllerScanner\.extractResourceDataflow/.test(pipeline)],
  ['phase 1831 audit command is registered', scripts['audit:phase1831-laravel-inventory-identity-interface-first'] === 'node scripts/audits/audit-phase1831-laravel-inventory-identity-interface-first.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: identity semantics contract first; inventory authority delegates identity equality; integrated judgment preserved; production scanner wiring is not yet migrated.\n');
process.exitCode = failures === 0 ? 0 : 1;
