const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['action semantic knowledge reuses canonical RouteSchemaPayload domain type', /readonly schema: RouteSchemaPayload/.test(judgment) && /domain\/validationRules/.test(judgment)],
  ['coverage lists schema as published knowledge', /publishedKnowledge: readonly \['actionName', 'response', 'dependencies', 'returns', 'resourceBindings', 'request', 'dataflow', 'schema', 'body'\]/.test(judgment)],
  ['body source AST is the projection remainder', /projectionRemainder: readonly \['body-source-ast'\]/.test(judgment)],
  ['coverage publishes the schema judgment derivation boundary', /schema-derivation-is-owned-by-a-source-correlated-action-schema-semantic-judgment/.test(judgment) && /schema-derivation-is-owned-by-a-source-correlated-action-schema-semantic-judgment/.test(dependencies)],
  ['contract advances to version 10', /readonly version: 10;/.test(judgment) && /version: 10 as const/.test(dependencies)],
  ['production adapter publishes schema from the canonical schema judgment', /schema: result\.contract\.schemaSemanticJudgment\.derivation\.schema/.test(dependencies)],
  ['schema resolution is owned by an explicit source-correlated judgment', /controllerActionSchemaSemanticJudgmentAuthority\.judge\(\{/.test(resolver) && /schemaSemanticJudgment: ControllerActionSchemaSemanticJudgment<SourceFile>/.test(resolver)],
  ['body semantic knowledge is published while source AST remains a projection remainder', /readonly body: LaravelControllerActionBodySemanticKnowledge/.test(judgment) && /projectionRemainder: readonly \['body-source-ast'\]/.test(judgment)],
  ['exact invocation judgment remains attached to action judgment', /readonly invocationJudgment: TInvocationJudgment/.test(judgment) && /invocationJudgment: input\.invocationJudgment/.test(dependencies)],
  ['runtime executor forwards completed judgment unchanged', /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['integrated response remains a controller-wide pipeline', /judgeIntegratedResponse\(/.test(scanner) && /LaravelControllerResponseSemanticPipelineInterface/.test(responsePipeline)],
  ['action semantic knowledge remains separate from compiler projection', /readonly semantic: LaravelControllerActionSemanticKnowledge;[\s\S]*readonly projection: TProjection/.test(judgment)],
  ['existing public index already exports RouteSchemaPayload', /RouteSchemaPayload/.test(index)],
  ['legacy action resolver remains visible as broader migration debt', /resolveControllerActionContract/.test(resolver) && /scanControllerAction\(/.test(dependencies) && /body-source-ast-remains-in-the-projection/.test(judgment)],
  ['no duplicate relation/foundation semantic layer introduced', !/types\/upstream\/(?:foundation|relation)/.test(judgment + dependencies)],
  ['existing canonical dataflow judgment remains published', /readonly dataflow: ControllerSemanticVariableFlow/.test(judgment) && /dataflow: result\.contract\.dataflow\.semantic/.test(dependencies)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: schema derivation now has an explicit upstream judgment and provenance; body AST and broader action derivation remain migration debt.\n');
process.exitCode = failures === 0 ? 0 : 1;
