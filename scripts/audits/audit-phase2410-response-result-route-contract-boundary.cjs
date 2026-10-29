const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const responseTypes = read('packages/core/src/types/upstream/response.ts');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const controllerScanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeRelations = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const descriptorTypes = read('packages/core/src/types/domain/responseDescriptors.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2410_RESPONSE_RESULT_TO_ROUTE_CONTRACT_BOUNDARY.md');
const checks = [
  ['canonical method response product retains typed ResponseResult', responseInterface.includes("readonly kind: 'controller_method_response_product'") && responseInterface.includes('readonly result: ResponseResult')],
  ['method response product retains method-owned DTO contract judgments', responseInterface.includes('readonly dtoResponseContracts: readonly LaravelDtoResponseContractProjectionJudgment[]')],
  ['pipeline builds products from canonical return semantics', responsePipeline.includes('projectMethodResponses(canonicalMethods, input.dtoResponseContractProjectionJudgments)')],
  ['controller scanner invokes integrated response judgment after action publications', controllerScanner.indexOf('const actionJudgments =') < controllerScanner.indexOf('judgeIntegratedResponse(')],
  ['ResponseResult has HTTP outcomes not represented as the same descriptor variants', ['branches', 'content', 'redirect', 'no_content', 'resource', 'responsable', 'json_serializable'].every(kind => responseTypes.includes(`readonly kind: '${kind}'`))],
  ['route compatibility descriptor is a separate closed ADT', ['ResourceResponseDescriptor', 'ModelResponseDescriptor', 'InlineResponseDescriptor', 'VoidResponseDescriptor'].every(name => descriptorTypes.includes(name))],
  ['active route scanner still seeds a void compatibility descriptor', routeScanner.includes('const unresolvedResponse = VoidResponseDescriptor.create()')],
  ['route boundary forwards the target descriptor rather than integrated judgment', routeRelations.includes('response: value.response') && !routeRelations.includes('responseJudgment:')],
  ['route scanner currently does not receive response judgment as an emitDeclaration input', !routeScanner.slice(routeScanner.indexOf('const emitDeclaration'), routeScanner.indexOf('const actionJudgmentForTarget')).includes('responseJudgment')],
  ['report requires explicit complete/blocked projection rather than guessed conversion', report.includes('explicit blocked result') && report.includes('projection-contract gap')],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2410 structural assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
