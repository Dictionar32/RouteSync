const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const requestType = read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['controller request semantic binding is an upstream ADT with explicit absence', /export type LaravelControllerRequestSemanticBinding\s*=/.test(requestType) && /kind: 'no_request'/.test(requestType)],
  ['FormRequest and framework request reuse existing domain/name types', /FormRequestSource/.test(requestType) && /type: ClassName/.test(requestType)],
  ['typed request branch carries semantic TypeExpression rather than PHP AST', /kind: 'typed'; readonly type: TypeExpression/.test(requestType) && !/PhpParameterTypeAst/.test(requestType)],
  ['canonical action knowledge now publishes request binding', /readonly request: LaravelControllerRequestSemanticBinding/.test(judgment)],
  ['coverage publishes request and body semantic knowledge while retaining source AST as projection remainder', /publishedKnowledge: readonly \['actionName', 'response', 'dependencies', 'returns', 'resourceBindings', 'request', 'dataflow', 'schema', 'body'\]/.test(judgment) && /projectionRemainder: readonly \['body-source-ast'\]/.test(judgment)],
  ['contract advances to version 11 in interface and wiring', /readonly version: 11;/.test(judgment) && /version: 11 as const/.test(dependencies)],
  ['legacy request binding is converted through a compatibility adapter without reclassifying its variants', /function canonicalRequestBinding\(request: ControllerRequestBinding, sourceFile: string\)/.test(dependencies) && ['case \'no_request\'', 'case \'form_request\'', 'case \'framework_request\'', 'case \'typed\''].every(kind => dependencies.includes(kind))],
  ['typed request conversion delegates to the existing PHP type-expression algebra adapter', /resolveParameterType\(request\.type, undefined, sourceFile\)/.test(dependencies)],
  ['action judgment retains exact invocation judgment', /readonly invocationJudgment: TInvocationJudgment/.test(judgment) && /invocationJudgment: input\.invocationJudgment/.test(dependencies)],
  ['runtime executor forwards completed judgment unchanged', /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['integrated response remains controller-wide and separate from action request knowledge', /judgeIntegratedResponse\(/.test(scanner) && /LaravelControllerResponseSemanticPipelineInterface/.test(responsePipeline)],
  ['public entry point exports the upstream request semantic binding', /LaravelControllerRequestSemanticBinding/.test(index)],
  ['remaining semantic derivation debt is explicit; no duplicate foundation/relation layer is added', /scanControllerAction\(/.test(dependencies) && /resolveControllerActionContract/.test(read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts')) && !/types\/upstream\/(?:foundation|relation)/.test(requestType + judgment + dependencies)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: request and body semantic facts are published as canonical upstream/domain knowledge; source AST and legacy resolver derivation remain migration debt.\n');
process.exitCode = failures === 0 ? 0 : 1;
