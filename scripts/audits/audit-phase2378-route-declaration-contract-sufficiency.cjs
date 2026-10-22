const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const resource = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const pathAuthority = read('packages/core/src/types/upstream/routePathResolution.ts');
const routeContract = read('packages/core/src/types/upstream/route.ts');
const producerRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const checks = [
  ['canonical declaration evidence includes method, target, path and group context', /readonly method: LaravelRouteMethodEvidence/.test(evidence) && /readonly target: RouteDeclarationTargetEvidence/.test(evidence) && /readonly path: string/.test(evidence) && /readonly prefix: readonly string\[\]/.test(evidence)],
  ['method authority remains a narrow method-family judgment', /interface LaravelRouteDeclarationMethodJudgmentAuthority/.test(scannerContract) && /judge: \(input: LaravelRouteDeclarationMethodJudgmentInput\) => LaravelRouteDeclarationMethodJudgment/.test(scannerContract)],
  ['resource authority remains a narrow resource plan authority', /interface RouteResourceFlowAuthority/.test(resource) && /resolveDeclaration: \(input: RouteResourceDeclarationInput\) => RouteResourceFlowJudgment/.test(resource)],
  ['path authority remains a narrow resolved-path authority', /interface LaravelRoutePathResolutionAuthority/.test(pathAuthority) && /resolve: \(input: LaravelRoutePathResolutionInput\) => ResolvedLaravelRoutePath/.test(pathAuthority)],
  ['scanner contract is an orchestration interface', /readonly declarationMethodAuthority:/.test(scannerContract) && /readonly routeResourceFlowAuthority:/.test(scannerContract) && /readonly routePathResolutionAuthority:/.test(scannerContract)],
  ['active scanner still dispatches declaration family', /const emitDeclaration/.test(scanner) && /switch \(methodJudgment\.kind\)/.test(scanner)],
  ['active scanner still depends on relation runtime', /semantic\/relations\/relationalSequence/.test(scanner)],
  ['active scanner still calls subscanner emitters', /emitResourceRoutesFromJudgment, emitStandardRoutes/.test(scanner)],
  ['route boundary is assembled after RouteEmission', /routeBoundaryContractFromRouteEmission/.test(scanner) && /routeBoundaryContractFromRouteEmission/.test(producerRelations)],
  ['RouteProducerInput is a materialization contract, not declaration authority', /interface RouteProducerInput/.test(routeContract) && /readonly declaration: import\('\.\/routeDeclarationEvidence'\)\.RouteDeclarationEvidence/.test(routeContract) && /routeProducerInputFromRouteBoundary/.test(scanner)],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
