const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const actionInterface = read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const actionWiring = read('src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionExecutor = read('src/types/upstream/laravelControllerActionExecutionInterface.ts');
const controllerScanner = read('src/compiler/scanner/wiring/laravelControllerScanner.ts');
const responsePipeline = read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const invocationInterface = read('src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const publicIndex = read('src/index.ts');
const checks = [
  ['existing action semantic contract is version 31', /readonly version: 31;/.test(actionInterface) && /version: 31 as const/.test(actionWiring)],
  ['coverage is a closed partial-or-complete ADT', /export type LaravelControllerActionSemanticKnowledgeCoverage\s*=\s*\| LaravelControllerActionSemanticKnowledgePartialCoverage\s*\| LaravelControllerActionSemanticKnowledgeCompleteCoverage/.test(actionInterface)],
  ['complete coverage structurally requires empty projection, derivation, and publication remainders', /kind: 'action_semantic_knowledge_complete'[\s\S]*?projectionRemainder: readonly \[\][\s\S]*?derivationOwnershipRemainder: readonly \[\][\s\S]*?publicationRemainder: readonly \[\]/.test(actionInterface)],
  ['production coverage still honestly reports partial ownership', /controllerActionSemanticKnowledgeCoverage:[\s\S]*?/.test(actionInterface) && /kind: 'action_semantic_knowledge_partial'/.test(actionInterface) && /kind: 'action_semantic_knowledge_partial'/.test(actionInterface) && /publicationRemainder: Object\.freeze\(\[\] as const\)/.test(actionInterface)],
  ['executor forwards the exact judgment and does not upgrade coverage', /semanticJudgment: input\.semanticJudgment/.test(actionWiring) && /without-deriving-or-upgrading-either-from-the-consumer-projection/.test(actionExecutor)],
  ['action judgment retains the exact invocation judgment subtype', /readonly invocationJudgment: TInvocationJudgment/.test(actionInterface)],
  ['integrated response remains owned by the existing response pipeline interface', /readonly judgeIntegratedResponse:/.test(responsePipeline) && /integratedResponseOwnership: 'controller-wide-integrated-response-remains-owned-by-LaravelControllerResponseSemanticPipelineInterface/.test(actionInterface)],
  ['invocation input remains a closed ADT and has one authority entry point', /export type LaravelControllerInvocationSemanticInput\s*=/.test(invocationInterface) && (invocationInterface.match(/\bjudge\(/g) || []).length === 1],
  ['public API exports both coverage states', /LaravelControllerActionSemanticKnowledgePartialCoverage/.test(publicIndex) && /LaravelControllerActionSemanticKnowledgeCompleteCoverage/.test(publicIndex)],
  ['remaining subscanner dependency is explicitly detected rather than falsely marked retired', /import \{ scanControllerAction \} from '\.\.\/operations\/controller'/.test(actionWiring) && /resolveControllerActionContract/.test(actionWiring)],
  ['action authority path has no relation/foundation import', !/semantic\/(relations|foundation)\//.test(actionInterface + actionWiring + actionExecutor)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
