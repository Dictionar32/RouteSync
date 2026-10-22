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
  ['identity contract is version 3', /readonly version: 3/.test(identity) && /version: 3/.test(identity)],
  ['project identity rule is a typed discriminated contract', /type SourceProjectIdentityRule = Readonly/.test(identity) && /same_source_project_by_canonical_components/.test(identity)],
  ['project rule names canonical identity components', /project-kind/.test(identity) && /project-root/.test(identity) && /source-span-start/.test(identity) && /source-span-end/.test(identity)],
  ['source-file identity rule is typed', /type SourceFileIdentityRule = Readonly/.test(identity) && /same_source_file_by_canonical_value/.test(identity)],
  ['identity relation outputs remain typed ADTs', /SourceProjectIdentityRelationJudgment/.test(identity) && /SourceFileIdentityRelationJudgment/.test(identity) && !/sameSourceProject:[\s\S]*?boolean/.test(identity) && !/sameSourceFile:[\s\S]*?boolean/.test(identity)],
  ['identity semantics dispatches from contract rule discriminants', /switch \(LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT\.sourceProjectIdentityRule\.kind\)/.test(identity) && /switch \(LARAVEL_SOURCE_IDENTITY_SEMANTICS_CONTRACT\.sourceFileIdentityRule\.kind\)/.test(identity)],
  ['inventory contract version advances to 7', /readonly version: 7/.test(inventory) && /version: 7/.test(inventory)],
  ['inventory contract names typed identity rule as single declared source', /identityRuleSource:[\s\S]*?typed-upstream-identity-contract-declares-project-and-file-identity-components/.test(inventory)],
  ['authority consumes canonical typed identity judgments', /relateSourceProjects/.test(authority) && /relateSourceFiles/.test(authority) && /projectRelation\.kind/.test(authority)],
  ['authority has no Object.is or semantic foundation/relation imports', !/Object\.is/.test(authority) && !/semantic\/(?:foundation|relation|relations)/.test(authority)],
  ['invocation judgment binds source file and integrated response', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['scanner boundary consumes closure receipt', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner)],
  ['public index exports typed identity rule contracts', /SourceProjectIdentityRule/.test(index) && /SourceFileIdentityRule/.test(index) && /laravelSourceIdentitySemantics/.test(index)],
  ['legacy production scanner calls are explicitly still present', /ControllerScanner\.scanCanonicalBundle/.test(pipeline) && /ControllerScanner\.extractResourceDataflow/.test(pipeline)],
  ['phase 1833 audit is registered', scripts['audit:phase1833-laravel-typed-identity-rule-contract'] === 'node scripts/audits/audit-phase1833-laravel-typed-identity-rule-contract.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: identity rules are declared as typed contract data and exported; executor component mapping remains explicit runtime code; integrated judgment boundaries remain explicit; legacy production wiring remains outstanding.\n');
process.exitCode = failures === 0 ? 0 : 1;
