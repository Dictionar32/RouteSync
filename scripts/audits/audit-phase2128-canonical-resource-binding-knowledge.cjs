const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const resourceAuthority = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const resourceDerivation = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const checks = [
  ['canonical action semantic knowledge reuses the existing ControllerResourceBinding domain type', /readonly resourceBindings: readonly ControllerResourceBinding\[\]/.test(judgment)],
  ['coverage lists resourceBindings as published knowledge rather than projection remainder', /publishedKnowledge: readonly \['actionName', 'response', 'dependencies', 'returns', 'resourceBindings', 'request', 'dataflow', 'schema', 'body'\]/.test(judgment) && /projectionRemainder: readonly \['body-source-ast'\]/.test(judgment)],
  ['coverage contract advances to version 11', /readonly version: 11;/.test(judgment) && /version: 11 as const/.test(dependencies)],
  ['adapter publishes source-correlated resource bindings with canonical source spans', /resourceBindings: Object\.freeze\(result\.contract\.dataflow\.resourceBindings\.map\(binding => Object\.freeze\(/.test(dependencies) && /file: input\.invocationJudgment\.sourceFile/.test(dependencies) && /startOffset/.test(dependencies) && /endOffset/.test(dependencies)],
  ['resource binding judgment authority remains the existing closed upstream authority', /interface ControllerResourceBindingAuthorityInterface/.test(resourceAuthority) && /readonly judge:/.test(resourceAuthority)],
  ['legacy resource derivation delegates each candidate to the existing authority', /controllerResourceBindingAuthority\.judge\(/.test(resourceDerivation)],
  ['scanner downstream no longer reads resource binding semantics from projection', /semantic\.resourceBindings/.test(scanner) && !/contract\.dataflow\.resourceBindings/.test(scanner)],
  ['scanner artifact preserves canonical resource, model, response and source span', /resource: binding\.resource/.test(scanner) && /modelOrigin: binding\.model/.test(scanner) && /response: binding\.response/.test(scanner) && /source: binding\.source/.test(scanner)],
  ['action semantic knowledge remains separate from the consumer projection', /readonly semantic: LaravelControllerActionSemanticKnowledge;[\s\S]*readonly projection: TProjection/.test(judgment)],
  ['exact invocation judgment remains on the completed judgment', /readonly invocationJudgment: TInvocationJudgment/.test(judgment) && /invocationJudgment: input\.invocationJudgment/.test(dependencies)],
  ['runtime executor forwards the completed judgment unchanged', /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['integrated response remains a separate controller-wide judgment', /judgeIntegratedResponse\(/.test(scanner) && /LaravelControllerResponseSemanticPipelineInterface/.test(judgment)],
  ['contract does not claim body-source-AST/schema derivation migration is complete', /body-source-ast-remains-in-the-projection;body-semantic-statements-and-error-responses-are-published-as-upstream-domain-knowledge;schema-is-published-by-a-source-correlated-schema-judgment-with-explicit-derivation-origin/.test(judgment) && /body-source-ast-remains-in-the-projection;body-semantic-statements-and-error-responses-are-published-as-upstream-domain-knowledge;schema-is-published-by-a-source-correlated-schema-judgment-with-explicit-derivation-origin/.test(dependencies)],
  ['no new foundation/relation layer is introduced', !/semantic\/(?:relation|foundation)|types\/upstream\/(?:relation|foundation)/.test(judgment + dependencies + scanner)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: resource bindings, request, dataflow, schema, and body semantic facts are published as canonical knowledge; body source AST and legacy derivation remain migration debt.\n');
process.exitCode = failures === 0 ? 0 : 1;
