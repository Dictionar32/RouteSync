const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const controller = read('packages/core/src/types/upstream/controller.ts');
const regression = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowSemanticJudgmentSelection.phase2069.test.ts');
const staticCall = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const astAuthority = read('packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts');
const doc = read('packages/core/src/types/upstream/docs/PHASE2069_SOURCE_ORDERED_SEMANTIC_JUDGMENT_SELECTION_INTERFACE_FIRST.md');
const checks = [
  ['binding contract states source-order semantics', /Definitions retain source-occurrence order/.test(controller)],
  ['latest selection overwrites the previous judgment per definition', /\(_current, definition\) => \(\{ kind: 'some' as const, value: definition\.semanticResolution \}\)/.test(scanner)],
  ['old first-available retention branch is removed', !/Object\.is\(current\.kind, 'some'\)[\s\S]{0,100}\(\) => current/.test(scanner)],
  ['empty definition sequence remains a missing lookup', /\(\) => \(\{ kind: 'missing' as const \}\)/.test(scanner)],
  ['semantic judgments are selected rather than reconstructed', /value => \(\{ kind: 'found' as const, value \}\)/.test(scanner)],
  ['regression covers source-ordered last definition selection', regression.includes('selects the final source-ordered definition instead of the first definition')],
  ['regression covers empty definition sequence', regression.includes('returns missing when a binding has no definitions')],
  ['regression asserts identity of selected canonical judgment', /toEqual\(\{ kind: 'found', value: latest \}\)/.test(regression)],
  ['existing static-call origin ADT remains the authority contract', /ControllerStaticCallOriginAuthorityInterface/.test(staticCall)],
  ['invocation judgment contract remains present', /LaravelControllerInvocationSemanticJudgmentInterface/.test(response)],
  ['AST projection forwards canonical invocation/response judgments', /consume-the-canonical-invocation-and-response-judgments-without-reclassification/.test(astAuthority)],
  ['phase document records scope and verification boundary', doc.includes('Verification boundary') && doc.includes('No new relation/foundation subscanner')],
];
let failed = 0;
for (const [name, pass] of checks) {
  const result = Boolean(pass);
  process.stdout.write(`${result ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += result ? 0 : 1;
}
process.stdout.write(`Phase 2069: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
