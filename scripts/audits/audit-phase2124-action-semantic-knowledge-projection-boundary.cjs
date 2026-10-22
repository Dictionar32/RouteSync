const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['action semantic knowledge is an explicit upstream contract', /interface LaravelControllerActionSemanticKnowledge/.test(judgment)],
  ['canonical response and dependencies live on semantic knowledge, not projection', /interface LaravelControllerActionSemanticKnowledge[\s\S]*readonly response: ControllerResponse;[\s\S]*readonly dependencies: readonly ControllerDependency\[\]/.test(judgment)],
  ['semantic and runtime return models reuse existing domain types', /readonly semantic: ControllerReturnSemantic;[\s\S]*readonly runtime: ControllerRuntimeReturn/.test(judgment)],
  ['consumer projection is explicitly separate from canonical semantic knowledge', /readonly semantic: LaravelControllerActionSemanticKnowledge;[\s\S]*readonly projection: TProjection/.test(judgment)],
  ['action judgment retains the exact invocation ADT', /readonly invocationJudgment: TInvocationJudgment;/.test(judgment)],
  ['action judgment authority publishes a versioned projection-boundary contract (current version 10)', /interface LaravelControllerActionSemanticJudgmentContract[\s\S]*readonly version: 10;[\s\S]*judgmentShape: 'canonical-semantic-knowledge-separated-from-consumer-projection'/.test(judgment) && /version: 10 as const/.test(dependencies)],
  ['scanner consumes semantic response/dependencies from semantic knowledge', /result\.semanticJudgment\.semantic\.response/.test(scanner) && /result\.semanticJudgment\.semantic\.dependencies/.test(scanner)],
  ['scanner keeps projection separate and reads resource bindings from canonical semantic knowledge', /contract: result\.semanticJudgment\.projection/.test(scanner) && /semantic\.resourceBindings/.test(scanner) && !/contract\.dataflow\.resourceBindings/.test(scanner)],
  ['runtime executor accepts one completed judgment and forwards it unchanged', /readonly semanticJudgment: LaravelControllerActionSemanticJudgmentInterface<TProjection, TInvocationJudgment>/.test(execution) && /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['runtime contract states it never derives semantics from projection', /semanticOwnership: 'executor-forwards-canonical-action-semantic-knowledge-and-never-derives-it-from-the-consumer-projection'/.test(execution) && /semanticOwnership: 'executor-forwards-canonical-action-semantic-knowledge-and-never-derives-it-from-the-consumer-projection'/.test(dependencies)],
  ['invocation judgment remains a closed four-outcome ADT', ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => invocation.includes(kind))],
  ['integrated response remains correlated to the exact invocation judgment', /judgeIntegratedResponse:[\s\S]*LaravelControllerResponseIntegratedJudgmentInput<InvocationJudgment>/.test(response) && /sourceCorrelationInputIntegrity/.test(response)],
  ['semantic knowledge, coverage ADT, and contract are exported publicly', /LaravelControllerActionSemanticKnowledge[\s\S]*LaravelControllerActionSemanticKnowledgeCoverage[\s\S]*LaravelControllerActionSemanticJudgmentContract/.test(index)],
  ['contract interfaces contain no runtime semantic branching', !/\b(if|switch|case)\s*\(/.test(judgment + execution)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('KNOWN DEBT: production authority still adapts scanControllerAction; this phase separates semantic knowledge from projection but does not claim legacy semantic derivation has been retired.\n');
process.exitCode = failures === 0 ? 0 : 1;
