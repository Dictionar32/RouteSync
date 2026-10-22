const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scannerInterface = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const routeContract = read('packages/core/src/types/upstream/route.ts');
const boundaryTypes = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const boundaryResolution = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const boundaryFactory = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts');
const producerRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const routeFlow = read('packages/core/src/types/domain/routes.ts');
const cliPipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['scanner contract version advanced for changed flow artifact', /readonly contractVersion: 10;/.test(scannerInterface) && /contractVersion: 10/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['canonical boundary contract retains existing authorization ADT', /readonly authorization: LaravelRouteAuthorizationSemanticJudgment;/.test(routeContract)],
  ['boundary options and resolved boundary retain the same ADT', (boundaryTypes.match(/readonly authorization: LaravelRouteAuthorizationSemanticJudgment;/g) ?? []).length >= 2],
  ['boundary resolution forwards judgment without rebuilding it', /authorization: params\.authorization/.test(boundaryResolution)],
  ['boundary factory publishes the judgment', /authorization: resolved\.authorization/.test(boundaryFactory)],
  ['all emission target arms forward the judgment', (producerRelations.match(/authorization: emission\.authorization/g) ?? []).length === 3],
  ['RouteSemanticFlow preserves the same upstream judgment', /readonly authorization: LaravelRouteAuthorizationSemanticJudgment;/.test(routeFlow) && /authorization: boundary\.authorization/.test(producerRelations)],
  ['CLI source pipeline uses the canonical route scanner', /routeScanner: laravelRouteScanner/.test(cliPipeline)],
  ['no foundation dependency introduced in changed route path', !/semantic\/foundation/.test([scannerInterface, routeContract, boundaryTypes, boundaryResolution, boundaryFactory, producerRelations, routeFlow].join('\n'))],
  ['no parallel V2 authorization contract introduced', !/LaravelRouteAuthorizationSemanticJudgmentV2|RouteBoundaryContractV2|RouteSemanticFlowV2/.test([scannerInterface, routeContract, routeFlow].join('\n'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
