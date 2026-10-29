const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionScanner = read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const checks = [
  ['action judgment retains the exact invocation judgment subtype', /readonly invocationJudgment: TInvocationJudgment/.test(judgment)],
  ['canonical semantic knowledge is separate from compiler projection', /readonly semantic: LaravelControllerActionSemanticKnowledge;[\s\S]*readonly projection: TProjection/.test(judgment)],
  ['semantic knowledge reuses existing response, dependency, and return ADTs', /readonly response: ControllerResponse/.test(judgment) && /readonly dependencies: readonly ControllerDependency\[\]/.test(judgment) && /readonly semantic: ControllerReturnSemantic/.test(judgment)],
  ['contract is version 11 and explicitly separates per-action response from integrated controller response', /readonly version: 11;/.test(judgment) && /integratedResponseOwnership: 'controller-wide-integrated-response-remains-owned-by-LaravelControllerResponseSemanticPipelineInterface-and-is-not-flattened-into-per-action-response'/.test(judgment) && /version: 11 as const/.test(dependencies)],
  ['contract explicitly declares legacy derivation is still active instead of claiming migration is complete', /derivationBoundary: 'production-adapter-still-delegates-to-scanControllerAction-and-resolveControllerActionContract;upstream-semantic-derivation-is-not-yet-closed'/.test(judgment) && /derivationBoundary: 'production-adapter-still-delegates-to-scanControllerAction-and-resolveControllerActionContract;upstream-semantic-derivation-is-not-yet-closed'/.test(dependencies)],
  ['production adapter still exposes the known resolver call as a visible migration seam', /scanControllerAction\(/.test(dependencies) && /resolveControllerActionContract/.test(actionScanner)],
  ['resolver owns the single canonical response-presence ADT reused by return and dataflow', /const resourceResponse: ControllerResponse/.test(resolver) && /controllerReturnSemanticFromMethod\(method, sourceFile\.value\.value, resourceResponse\)/.test(resolver) && /response: resourceResponse/.test(resolver)],
  ['resolver still combines body, request, dependencies, dataflow, schema, and runtime return derivation', /resolveControllerBody\(method\.body, sourceFile\)/.test(resolver) && /resolveRequest\(method\.parameters/.test(resolver) && /resolveConstructorDependencies/.test(resolver) && /createControllerDataflowContract\(/.test(resolver) && /schemaSemanticJudgment: ControllerActionSchemaSemanticJudgment<SourceFile>/.test(resolver) && /resolveRuntimeReturn\(method\)/.test(resolver)],
  ['action executor only forwards the exact completed judgment', /semanticJudgment: input\.semanticJudgment/.test(dependencies) && /readonly semanticJudgment: LaravelControllerActionSemanticJudgmentInterface<TProjection, TInvocationJudgment>/.test(execution)],
  ['scanner reads semantic facts from knowledge and projection from the projection field', /result\.semanticJudgment\.semantic\.response/.test(scanner) && /result\.semanticJudgment\.semantic\.dependencies/.test(scanner) && /contract: result\.semanticJudgment\.projection/.test(scanner)],
  ['integrated response is produced through the existing response pipeline interface', /judgeIntegratedResponse\(/.test(scanner) && /readonly judgeIntegratedResponse:/.test(response)],
  ['integrated response retains the exact invocation judgment generic', /LaravelControllerIntegratedResponseJudgment<InvocationJudgment>/.test(response) && /invocationJudgment: InvocationJudgment/.test(response)],
  ['AST projection receives the exact invocation and integrated response judgment pair', /kind: 'integrated_invocation_response_judgment',[\s\S]*judgment: invocationJudgment,[\s\S]*responseJudgment/.test(scanner)],
  ['controller artifact retains invocation, response, and projection judgments together', /invocationJudgment,[\s\S]*responseJudgment,[\s\S]*projectionJudgment/.test(scanner)],
  ['response pipeline contract forbids adding a parallel relation/foundation semantic authority', /noReplacementLayerRule: 'compose-existing-contracts-without-adding-relation-or-foundation-operations-or-a-parallel-semantic-authority'/.test(response)],
  ['interface modules contain no executable semantic branching', !/\b(if|switch|case)\s*\(/.test(judgment + execution)],
  ['public index exports the evolved action semantic contract', /LaravelControllerActionSemanticJudgmentContract/.test(read('packages/core/src/index.ts'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('BOUNDARY: action semantic derivation remains legacy-backed; integrated response is correctly controller-wide and remains a separate correlated judgment.\n');
process.exitCode = failures === 0 ? 0 : 1;
