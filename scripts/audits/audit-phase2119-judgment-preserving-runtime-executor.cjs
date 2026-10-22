const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const checks = [
  ['executor result is a receipt around one completed semantic judgment', /readonly semanticJudgment:\s*LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>/.test(execution)],
  ['executor result does not flatten invocation, action, projection, or dependencies', !/readonly (invocationJudgment|actionName|contract|dependencies):/.test(execution.split('export interface LaravelControllerActionExecutionResult<')[1]?.split('export interface LaravelControllerActionExecutionInterface<')[0] ?? '')],
  ['production executor returns the exact input judgment object', /semanticJudgment:\s*input\.semanticJudgment/.test(dependencies)],
  ['production executor does not reconstruct judgment fields', !/invocationJudgment:\s*input\.semanticJudgment\.invocationJudgment/.test(dependencies)],
  ['scanner consumes contract from the preserved judgment', /result\.semanticJudgment\.contract/.test(scanner)],
  ['scanner consumes dependencies from the preserved judgment', /result\.semanticJudgment\.dependencies/.test(scanner)],
  ['executor input remains one action judgment, not parallel judgments', /readonly semanticJudgment:\s*LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>/.test(execution.split('export interface LaravelControllerActionExecutionInput<')[1]?.split('export interface LaravelControllerActionExecutionResult<')[0] ?? '')],
  ['action judgment retains the exact generic invocation outcome', /readonly invocationJudgment:\s*TInvocationJudgment/.test(judgment)],
  ['integrated response remains indexed by the invocation judgment', /LaravelControllerIntegratedResponseJudgment<InvocationJudgment>/.test(response) && /judgeIntegratedResponse/.test(response)],
  ['contract interface remains declarative and contains no branch implementation', !/\b(if|switch|case)\s*\(/.test(execution + judgment)],
  ['scanner retains the integrated response pipeline', /this\.responseSemanticPipeline\.judgeIntegratedResponse/.test(scanner)],
  ['legacy semantic owner is explicitly documented rather than misreported as retired', /legacy action semantic owner has been retired/.test(dependencies) === false && /scanControllerAction/.test(dependencies)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE DEBT: action judgment still delegates to scanControllerAction; this phase fixes executor judgment preservation and does not retire the legacy semantic owner.\n');
process.exitCode = failures === 0 ? 0 : 1;
