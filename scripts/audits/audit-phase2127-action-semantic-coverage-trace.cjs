const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const resolver = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const actionScanner = read('packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts');
const dataflowAuthority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['action semantic knowledge coverage is a discriminated ADT, not an unqualified completeness claim', /export type LaravelControllerActionSemanticKnowledgeCoverage\s*=\s*\n\s*\| Readonly<\{[\s\S]*kind: 'action_semantic_knowledge_partial'/.test(judgment)],
  ['published canonical members are explicitly enumerated', /publishedKnowledge: readonly \['actionName', 'response', 'dependencies', 'returns', 'resourceBindings', 'request', 'dataflow', 'schema', 'body'\]/.test(judgment)],
  ['body source AST still in projection is explicitly enumerated', /projectionRemainder: readonly \['body-source-ast'\]/.test(judgment)],
  ['judgment contract version 11 exposes coverage', /readonly version: 11;[\s\S]*readonly knowledgeCoverage: LaravelControllerActionSemanticKnowledgeCoverage/.test(judgment)],
  ['production wiring publishes the same partial coverage ADT', /kind: 'action_semantic_knowledge_partial'[\s\S]*publishedKnowledge: Object\.freeze\(\['actionName', 'response', 'dependencies', 'returns', 'resourceBindings', 'request', 'dataflow', 'schema', 'body'\][\s\S]*projectionRemainder: Object\.freeze\(\['body-source-ast'\]/.test(dependencies)],
  ['production action authority still delegates to legacy action scanner (debt not hidden)', /scanControllerAction\(/.test(dependencies) && /resolveControllerActionContract/.test(actionScanner)],
  ['legacy resolver remains the aggregate action derivation point, with schema delegated to its authority', /resolveControllerBody\(method\.body, sourceFile\)/.test(resolver) && /createControllerReturnSet\(/.test(resolver) && /createControllerDataflowContract\(/.test(resolver) && /resolveRequest\(/.test(resolver) && /controllerActionSchemaSemanticJudgmentAuthority\.judge\(/.test(resolver)],
  ['legacy resolver still combines action derivation while schema has an explicit authority', /resolveConstructorDependencies\([\s\S]*resolveMethodDependencies\(/.test(resolver) && /schemaSemanticJudgment: ControllerActionSchemaSemanticJudgment<SourceFile>/.test(resolver)],
  ['downstream scanner consumes canonical resource-binding knowledge instead of projection dataflow', /semantic\.resourceBindings/.test(scanner) && !/contract\.dataflow\.resourceBindings/.test(scanner)],
  ['existing upstream dataflow authority is present and should be assessed before adding a new layer', /export interface ControllerDataflowSemanticJudgmentAuthorityInterface/.test(dataflowAuthority)],
  ['integrated response remains a separate controller-wide pipeline', /LaravelControllerResponseSemanticPipelineInterface/.test(judgment) && /judgeIntegratedResponse\(/.test(scanner) && /responseMeaningOwner: 'LaravelControllerResponseSemanticJudgmentAuthorityInterface'/.test(responsePipeline)],
  ['exact invocation judgment is retained by completed action judgment', /readonly invocationJudgment: TInvocationJudgment/.test(judgment) && /invocationJudgment: input\.invocationJudgment/.test(dependencies)],
  ['runtime executor forwards the completed judgment without reconstruction', /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['public entry point exports the coverage type', /LaravelControllerActionSemanticKnowledgeCoverage/.test(index)],
  ['contract explicitly admits projection semantic leakage', /projectionSemanticLeakage: 'body-source-ast-remains-in-the-projection;body-semantic-statements-and-error-responses-are-published-as-upstream-domain-knowledge;schema-is-published-by-a-source-correlated-schema-judgment-with-explicit-derivation-origin;canonical-variable-flow-is-published-from-the-closed-controller-dataflow-judgment;request-binding-uses-a-compatibility-adapter;resource-binding-aggregation-still-traverses-the-legacy-action-contract'/.test(judgment) && /projectionSemanticLeakage: 'body-source-ast-remains-in-the-projection;body-semantic-statements-and-error-responses-are-published-as-upstream-domain-knowledge;schema-is-published-by-a-source-correlated-schema-judgment-with-explicit-derivation-origin;canonical-variable-flow-is-published-from-the-closed-controller-dataflow-judgment;request-binding-uses-a-compatibility-adapter;resource-binding-aggregation-still-traverses-the-legacy-action-contract'/.test(dependencies)],
  ['no new relation/foundation layer is introduced for this boundary fix', !/semantic\/(relation|foundation)|types\/upstream\/(relation|foundation)/.test(dependencies + judgment)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: schema derivation is source-correlated and authority-owned; broader action aggregation, body AST projection, and resource binding aggregation remain migration debt.\n');
process.exitCode = failures === 0 ? 0 : 1;
