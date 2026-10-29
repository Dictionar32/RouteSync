const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const invocationInterface = read('src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const invocationAuthority = read('src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const responseInterface = read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scanner = read('src/compiler/scanner/wiring/laravelControllerScanner.ts');
const actionScanner = read('src/compiler/scanner/operations/controller/actionScanner.ts');
const actionContract = read('src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');

const checks = [
  ['contract version advanced to 14', /readonly version: 14/.test(invocationInterface) && /version: 14/.test(invocationAuthority)],
  ['missing pipeline input has only the not-connected judgment', /controller_invocation_pipeline_not_provided/.test(invocationInterface) && /LaravelControllerInvocationNotConnectedJudgment/.test(invocationInterface)],
  ['provided pipeline excludes not-connected outcome', /type LaravelControllerInvocationProvidedPipelineJudgment = Exclude<[\s\S]*?LaravelControllerInvocationNotConnectedJudgment/.test(invocationInterface) && /controller_invocation_pipeline_provided/.test(invocationInterface) && /LaravelControllerInvocationProvidedPipelineJudgment/.test(invocationInterface)],
  ['input/outcome contract rule is explicit', /inputOutcomeRule: 'pipeline-not-provided-can-only-produce-not-connected/.test(invocationInterface) && /inputOutcomeRule: 'pipeline-not-provided-can-only-produce-not-connected/.test(invocationAuthority)],
  ['integrated HTTP response remains owned by existing response pipeline', /judgeIntegratedResponse/.test(responseInterface) && /this\.responseSemanticPipeline\.judgeIntegratedResponse/.test(scanner)],
  ['same invocation judgment is passed to integrated response and AST projection', /judgment: invocationJudgment,\s*responseJudgment/.test(scanner) && /invocationJudgment,\s*declarationEvidence,/.test(scanner)],
  ['legacy action response derivation is recorded, not falsely claimed migrated', /resolveControllerActionContract/.test(actionScanner) && /resolveResponse\(/.test(actionContract)],
  ['no new relation/foundation authority added to invocation interface', !/semantic\/(relations|foundation)/.test(invocationInterface)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.exitCode = failures === 0 ? 0 : 1;
