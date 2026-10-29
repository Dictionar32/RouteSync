const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const controllerScanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeRelations = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2409_RESPONSE_ATTRIBUTE_PRODUCT_CLOSURE_TRACE.md');

const checks = [
  ['existing response-attribute source evidence is distinct from resolved descriptor evidence', responseInterface.includes("readonly kind: 'response_attribute_source'") && responseInterface.includes("readonly kind: 'declared_response_attribute'")],
  ['coverage explicitly retains resolved response-attribute descriptor gap', responseInterface.includes("'resolved_response_attribute_descriptor'")],
  ['coverage explicitly retains response DTO declaration gap', responseInterface.includes("'response_dto_declaration'")],
  ['existing response pipeline resolves DTO declarations through its existing authority', responsePipeline.includes('dtoDeclarationResolutionAuthority.resolve(')],
  ['existing response pipeline projects resolved DTO contracts through existing authority', responsePipeline.includes('dtoResponseContractProjectionAuthority')],
  ['controller action publication is assembled before integrated response judgment', controllerScanner.indexOf('const actionJudgments =') < controllerScanner.indexOf('judgeIntegratedResponse(')],
  ['route scanner still supplies compatibility void response descriptor', routeScanner.includes('const unresolvedResponse = VoidResponseDescriptor.create()')],
  ['route boundary composition still forwards target response descriptor', routeRelations.includes('response: value.response')],
  ['report explicitly forbids claiming end-to-end closure', report.includes('No claim of end-to-end interface-first closure is made.')],
];

let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2409 structural assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
