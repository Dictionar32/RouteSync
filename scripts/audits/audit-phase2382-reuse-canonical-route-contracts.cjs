const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const method = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodJudgment.ts');
const resource = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const pathResolution = read('packages/core/src/types/upstream/routePathResolution.ts');
const authorization = read('packages/core/src/types/upstream/routeAuthorizationSemanticJudgmentInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['scanner contract reuses existing method judgment authority', /declarationMethodAuthority: LaravelRouteDeclarationMethodJudgmentAuthority/.test(contract)],
  ['scanner contract injects existing authorization authority', /authorizationAuthority: LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface/.test(contract)],
  ['scanner contract injects existing resource-flow authority', /routeResourceFlowAuthority: RouteResourceFlowAuthority/.test(contract)],
  ['scanner contract injects existing path-resolution authority', /routePathResolutionAuthority: LaravelRoutePathResolutionAuthority/.test(contract)],
  ['scanner contract preserves canonical RouteProducer operation', /routeProducer: RouteProducer/.test(contract)],
  ['single canonical declaration evidence carries closure return semantic', /kind: 'closure'; readonly action: string; readonly returnSemantic: ControllerReturnSemantic/.test(evidence)],
  ['scanner constructs declaration evidence once before judgments', /const evidence = routeDeclarationEvidenceFromAst\(declaration, file\)/.test(scanner) && /methodAuthority\.judge\(\{ method: evidence\.method, targetMethods: evidence\.targetMethods \}\)/.test(scanner)],
  ['resource judgment consumes canonical declaration evidence', /resolveDeclaration\(\{[\s\S]*?declaration: declarationEvidence/.test(scanner) && /declaration: RouteDeclarationEvidence/.test(resource)],
  ['path judgment consumes declared path and group prefixes from canonical evidence', /declaredPath: declarationEvidence\.path/.test(scanner) && /groupPrefixes: declarationEvidence\.prefix/.test(scanner) && /resolve: \(input: LaravelRoutePathResolutionInput\) => ResolvedLaravelRoutePath/.test(pathResolution)],
  ['authorization judgment consumes middleware from canonical evidence', /\[\.\.\.declarationEvidence\.middleware, \.\.\.declarationEvidence\.routeMiddleware\]/.test(scanner) && /judge: \(middleware: readonly MiddlewareName\[\]\)/.test(authorization)],
  ['scanner does not derive RouteDeclarationFlow a second time', !/routeDeclarationFlow\(/.test(scanner)],
  ['new duplicate LaravelRouteDeclarationOperationAuthority is removed from active exports and wiring', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/routeDeclarationOperationAuthority.ts')) && !/routeDeclarationOperationAuthority/.test(contract + scanner + upstreamIndex)],
  ['canonical boundary and producer operations are connected without RouteEmission', /routeBoundaryContractFromRouteFacts\(method, path, resourceName, target/.test(scanner) && /routeProducerInputCompositionOperation\.compose\(\{ boundary, declaration: evidence, source: sourceSpan, methodJudgment \}\)/.test(scanner) && !scanner.includes('RouteEmission')],
  ['scanner path does not import semantic foundation', !/semantic\/foundation/.test(scanner)],
];
let passed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
