const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scannerPath = 'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts';
const scanner = read(scannerPath);
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const producerRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const checks = {
  activeScannerIsWiredIntoSourceAstPipeline: /import \{ laravelRouteScanner \} from '\.\/laravelRouteScanner'/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts')),
  scannerContractInjectsExistingMethodAuthority: /declarationMethodAuthority: LaravelRouteDeclarationMethodJudgmentAuthority/.test(contract),
  scannerContractInjectsExistingResourcePathAuthorizationAuthorities: /authorizationAuthority: LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface/.test(contract) && /routeResourceFlowAuthority: RouteResourceFlowAuthority/.test(contract) && /routePathResolutionAuthority: LaravelRoutePathResolutionAuthority/.test(contract),
  declarationEvidenceHasClosedTargetVariants: /export type RouteDeclarationTargetEvidence =/.test(evidence) && /kind: 'unsupported'/.test(evidence),
  declarationEvidencePreservesClosureReturn: /kind: 'closure'; readonly action: string; readonly returnSemantic: ControllerReturnSemantic/.test(evidence),
  scannerCreatesEvidenceOnceBeforeJudgments: /const evidence = routeDeclarationEvidenceFromAst\(declaration, file\)/.test(scanner) && /methodAuthority\.judge\(\{ method: evidence\.method, targetMethods: evidence\.targetMethods \}\)/.test(scanner),
  scannerUsesExistingNarrowAuthorities: /authorizationAuthority\.judge\(/.test(scanner) && /resourceFlowAuthority\.resolveDeclaration\(/.test(scanner) && /pathResolutionAuthority\.resolve\(/.test(scanner),
  scannerDoesNotRecomputeRouteDeclarationFlow: !/routeDeclarationFlow\(/.test(scanner),
  closureReturnProductionUsesExistingContract: /ControllerReturnSemanticProductionInterface/.test(producerRelations) && /routeClosureReturnSemanticProduction\.produce/.test(producerRelations),
  duplicateOperationAuthorityIsAbsent: !/routeDeclarationOperationAuthority/.test(scanner + contract) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/routeDeclarationOperationAuthority.ts')),
  boundaryStillOccursAfterEmission: /routeBoundaryContractFromRouteEmission\(route, actionJudgmentForRoute/.test(scanner),
};
const findings = {
  activePath: [
    'The CLI source AST pipeline injects laravelRouteScanner.',
    'The scanner reuses canonical RouteDeclarationEvidence for method, resource, path, and middleware judgments.',
    'The existing method, authorization, resource-flow, path-resolution, and RouteProducer contracts are injected directly; no duplicate declaration-operation authority is introduced.',
    'Closure return semantic is preserved by source evidence and consumed by the emitter.',
    'The scanner still dispatches on method judgment and calls subscanner emitters.',
    'RouteBoundaryContract and RouteProducerInput are still assembled after RouteEmission.',
  ],
  rootCause: [
    'The existing authorities are individually connected, but their judgments are not yet composed into one complete producer-ready declaration contract before route emission.',
    'Boundary construction depends on RouteEmission, so the current data direction still places the producer contract downstream of the emitter.',
  ],
  nextContractDecision: 'Continue by evolving the existing canonical RouteBoundaryContract/RouteProducerInput and their producer integration; do not add a duplicate operation authority or move emitDeclaration to another file.',
  closureComplete: false,
};
const report = { phase: 2372, title: 'active route declaration authority audit after canonical-contract reuse', checks, findings, pass: Object.values(checks).every(Boolean) };
fs.writeFileSync(path.join(root, 'scripts/audits/phase2372-active-route-declaration-authority.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
