const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const resolver = read('src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const scanner = read('src/compiler/scanner/operations/controller/actionScanner.ts');
const wiring = read('src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const semantic = read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const execution = read('src/types/upstream/laravelControllerActionExecutionInterface.ts');
const response = read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const checks = [
  ['action contract requires an already-produced source-correlated body judgment', /readonly bodyJudgment: ControllerBodySemanticJudgment<SourceFile>/.test(resolver)],
  ['legacy resolver consumes the supplied body judgment without invoking the body authority', /const bodyJudgment = context\.bodyJudgment/.test(resolver) && !/controllerBodySemanticJudgmentAuthority\.judge/.test(resolver)],
  ['action scanner forwards the exact body judgment into the resolver', /bodyJudgment: ControllerBodySemanticJudgment<SourceFile>/.test(scanner) && /bodyJudgment,/.test(scanner)],
  ['existing action authority obtains body judgment before compatibility projection', /controllerBodySemanticJudgmentAuthority\.judge\([\s\S]*?\n\s*const result = scanControllerAction/.test(wiring)],
  ['body derivation ownership remainder is structurally empty', /derivationOwnershipRemainder: readonly \[\]/.test(semantic) && /derivationOwnershipRemainder: Object\.freeze\(\[\] as const\)/.test(semantic)],
  ['overall action coverage remains partial only because source-AST projection remains open', /kind: 'action_semantic_knowledge_partial'/.test(semantic) && /currentOwner: 'compiler_projection'/.test(semantic) && /publicationRemainder: Object\.freeze\(\[\] as const\)/.test(semantic)],
  ['action semantic contract version 31 is synchronized', /readonly version: 31;/.test(semantic) && /version: 31 as const/.test(wiring)],
  ['integrated response authority remains the existing pipeline interface', /readonly judgeIntegratedResponse:/.test(response) && /LaravelControllerResponseSemanticPipelineInterface/.test(semantic)],
  ['executor forwards the exact judgment without semantic reclassification', /semanticJudgment: input\.semanticJudgment/.test(wiring) && /without-deriving-or-upgrading-either-from-the-consumer-projection/.test(execution)],
  ['no relation/foundation dependency was added to the changed authority path', !/semantic\/(relations|foundation)\//.test(resolver + scanner + wiring + semantic)],
  ['remaining subscanner dependency is explicitly retained as open migration debt', /import \{ scanControllerAction \} from '\.\.\/operations\/controller'/.test(wiring) && /controllerBodySemanticJudgmentAuthority/.test(wiring)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
