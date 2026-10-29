const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const dataflowAuthority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const actionContract = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['action semantic knowledge uses existing canonical ControllerSemanticVariableFlow', /readonly dataflow: ControllerSemanticVariableFlow/.test(judgment)],
  ['coverage marks dataflow as published knowledge', /publishedKnowledge: readonly \['actionName', 'response', 'dependencies', 'returns', 'resourceBindings', 'request', 'dataflow', 'schema', 'body'\]/.test(judgment)],
  ['projection remainder is narrowed to body source AST', /readonly projectionRemainder: readonly LaravelControllerActionProjectionRemainder\[\]/.test(judgment)],
  ['coverage explicitly distinguishes canonical dataflow from legacy aggregation', /canonical-dataflow-judgment-publishes-variable-flow;schema-derivation-is-owned-by-a-source-correlated-action-schema-semantic-judgment;body-statements-use-upstream-SourceStatements-and-error-responses-use-domain-descriptors;controller-resource-binding-judgment-is-owned-by-existing-upstream-authority-but-domain-publication-still-traverses-legacy-action-adapter/.test(judgment)],
  ['action judgment contract is synchronized at version 14', /readonly version: 14;/.test(judgment) && /version: 14 as const/.test(dependencies)],
  ['production adapter publishes the dataflow semantic value rather than its projection wrapper', /dataflow: result\.contract\.dataflow\.semantic/.test(dependencies)],
  ['existing upstream dataflow authority owns closure and source correlation', /interface ControllerDataflowSemanticJudgmentAuthorityInterface/.test(dataflowAuthority) && /semanticOwnership: 'upstream-authority-owns-binding-correspondence-identity-closure-variable-flow-and-integrated-response-composition'/.test(dataflowAuthority)],
  ['existing controller dataflow analyzer packages evidence and calls the closed authority', /semanticJudgmentAuthority\.derive\(/.test(analyzer) && /sourceCorrelation:/.test(analyzer)],
  ['legacy action resolver remains explicitly identified as migration debt', /resolveControllerActionContract/.test(actionContract) && /scanControllerAction\(/.test(dependencies)],
  ['legacy action contract is not misrepresented as the canonical dataflow/schema authority', /createControllerDataflowContract\(/.test(actionContract) && /schema-derivation-is-owned-by-a-source-correlated-action-schema-semantic-judgment;body-statements-use-upstream-SourceStatements-and-error-responses-use-domain-descriptors;controller-resource-binding-judgment-is-owned-by-existing-upstream-authority-but-domain-publication-still-traverses-legacy-action-adapter/.test(judgment)],
  ['request binding remains a distinct upstream ADT', /readonly request: LaravelControllerRequestSemanticBinding/.test(judgment)],
  ['resource binding remains canonical domain knowledge', /readonly resourceBindings: readonly ControllerResourceBinding\[\]/.test(judgment)],
  ['exact invocation judgment remains attached to completed action judgment', /readonly invocationJudgment: TInvocationJudgment/.test(judgment) && /invocationJudgment: input\.invocationJudgment/.test(dependencies)],
  ['runtime executor forwards the same completed judgment', /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['integrated response remains a separate controller-wide pipeline', /judgeIntegratedResponse\(/.test(scanner) && /LaravelControllerResponseSemanticPipelineInterface/.test(responsePipeline)],
  ['contract keeps body as remaining projection product after canonical schema publication', /readonly projectionRemainder: readonly LaravelControllerActionProjectionRemainder\[\]/.test(judgment) && /body-source-ast-remains-in-the-projection;body-semantic-statements-and-error-responses-are-published-as-upstream-domain-knowledge;schema-is-published-by-a-source-correlated-schema-judgment-with-explicit-derivation-origin/.test(judgment)],
  ['public entry point continues exporting the canonical action semantic contract', /LaravelControllerActionSemanticKnowledge/.test(index)],
  ['no duplicate foundation or relation semantic layer is introduced', !/types\/upstream\/(?:foundation|relation)/.test(judgment + dependencies)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: canonical variable-flow, schema, and body semantic facts are published; body source AST remains projection debt, and resource binding judgment is upstream-owned while canonical domain publication remains adapter-owned.\n');
process.exitCode = failures === 0 ? 0 : 1;
