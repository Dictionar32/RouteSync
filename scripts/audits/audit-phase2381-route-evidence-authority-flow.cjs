const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const checks = [
  ['scanner reuses canonical declaration evidence', /const evidence = routeDeclarationEvidenceFromAst\(declaration, file\)/.test(scanner)],
  ['method judgment consumes the same evidence datum', /methodAuthority\.judge\(\{ method: evidence\.method, targetMethods: evidence\.targetMethods \}\)/.test(scanner)],
  ['resource authority consumes canonical evidence', /resourceFlowAuthority\.resolveDeclaration\([\s\S]*?declaration: declarationEvidence/.test(scanner)],
  ['path authority consumes canonical evidence', /declaredPath: declarationEvidence\.path/.test(scanner) && /groupPrefixes: declarationEvidence\.prefix/.test(scanner)],
  ['authorization authority consumes middleware from canonical evidence', /\[\.\.\.declarationEvidence\.middleware, \.\.\.declarationEvidence\.routeMiddleware\]/.test(scanner)],
  ['closure return evidence is preserved', /kind: 'closure'; readonly action: string; readonly returnSemantic: ControllerReturnSemantic/.test(evidence) && /semanticReturn: declarationEvidence\.target\.kind === 'closure'/.test(scanner)],
  ['scanner interface uses existing narrow semantic authorities instead of a duplicate wrapper', /authorizationAuthority: LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface/.test(contract) && /routeResourceFlowAuthority: RouteResourceFlowAuthority/.test(contract) && /routePathResolutionAuthority: LaravelRoutePathResolutionAuthority/.test(contract) && !/routeDeclarationOperationAuthority/.test(contract + scanner)],
  ['boundary projection now consumes resolved route facts while producer-input composition remains an explicit downstream step', /routeBoundaryContractFromRouteFacts\(method, path, resourceName, target/.test(scanner) && /routeProducerInputCompositionOperation\.compose\(\{ boundary, declaration: evidence, source: sourceSpan, methodJudgment \}\)/.test(scanner)],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
process.exitCode = checks.every(([, ok]) => ok) ? 0 : 1;
