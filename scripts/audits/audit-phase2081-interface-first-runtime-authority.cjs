const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const declarationInterface = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const declarationAuthority = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const actionScanner = read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts');
const actionContract = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const checks = [
  ['invocation judgment remains discriminated union', read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts').includes('kind:')],
  ['declaration selection has complete/blocked ADT', declarationInterface.includes('controller_declaration_selection_complete') && declarationInterface.includes('controller_declaration_selection_blocked')],
  ['integrated response pipeline exists', responsePipeline.includes('judgeIntegratedResponse')],
  ['scanner still imports relation operations', /semantic\/relations|relation(?:Project|Fold|First|OptionFold|Expand|Equal)/.test(scanner)],
  ['scanner still calls controller action subscanner', scanner.includes('scanControllerAction')],
  ['declaration authority still owns imperative semantic helpers', ['selectActions', 'ancestryFor', 'sameClassIdentity'].every(name => declarationAuthority.includes(name))],
  ['action scanner still delegates contract derivation', actionScanner.includes('resolveControllerActionContract')],
  ['action contract still imports relation operations', /semantic\/relations|relation(?:Project|Fold|First|OptionFold|Select|Gate)/.test(actionContract)],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed.\n`);
process.stdout.write('Interpretation: passing checks confirm the current architectural facts, including unresolved dependencies; they do not certify executor-only runtime.\n');
if (failed.length > 0) process.exitCode = 1;
