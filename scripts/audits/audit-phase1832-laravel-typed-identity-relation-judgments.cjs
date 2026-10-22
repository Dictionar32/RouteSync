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
  ['identity interface returns project relation judgment rather than boolean', /relateSourceProjects:[\s\S]*?SourceProjectIdentityRelationJudgment/.test(identity) && !/sameSourceProject:[\s\S]*?boolean/.test(identity)],
  ['identity interface returns source-file relation judgment rather than boolean', /relateSourceFiles:[\s\S]*?SourceFileIdentityRelationJudgment/.test(identity) && !/sameSourceFile:[\s\S]*?boolean/.test(identity)],
  ['project identity relation is a closed discriminated union', /kind: 'same_source_project_identity'/.test(identity) && /kind: 'different_source_project_identity'/.test(identity)],
  ['file identity relation is a closed discriminated union', /kind: 'same_source_file_identity'/.test(identity) && /kind: 'different_source_file_identity'/.test(identity)],
  ['identity contract explicitly prohibits primitive boolean results', /resultRule:[\s\S]*?not-a-boolean/.test(identity)],
  ['inventory contract is version 6 and depends on canonical identity semantics', /readonly version: 6/.test(contract) && /readonly identitySemantics: LaravelSourceIdentitySemanticsInterface/.test(contract) && /contractVersion: 6/.test(contract)],
  ['authority consumes typed project relation judgment', /relateSourceProjects/.test(authority) && /projectRelation.kind === 'same_source_project_identity'/.test(authority)],
  ['authority consumes typed file relation judgments', /relateSourceFiles/.test(authority) && !/sameSourceFile/.test(authority)],
  ['authority contains no Object.is or semantic foundation/relations import', !/Object\.is/.test(authority) && !/semantic\/(?:foundation|relation|relations)/.test(authority)],
  ['integrated response remains correlated with source identity in one judgment', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['scanner boundary consumes closure receipt', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner)],
  ['production pipeline legacy controller scanner dependency is recorded for later migration', /ControllerScanner\.scanCanonicalBundle/.test(pipeline) && /ControllerScanner\.extractResourceDataflow/.test(pipeline)],
  ['phase 1832 audit command is registered', scripts['audit:phase1832-laravel-typed-identity-relation-judgments'] === 'node scripts/audits/audit-phase1832-laravel-typed-identity-relation-judgments.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: identity contracts produce typed relation judgments; inventory authority consumes them; integrated response remains correlated; production scanner wiring is not yet migrated.\n');
process.exitCode = failures === 0 ? 0 : 1;
