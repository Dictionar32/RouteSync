const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const barrel = read('packages/core/src/compiler/scanner/subscanners/route-scanner/index.ts');
const executorBody = emitter.split('export function emitResourceRoutesFromJudgment(')[1].split('/** Compatibility entrypoint')[0];
const checks = [
  ['existing RouteResourceFlowJudgment remains the closed semantic result', /interface RouteResourceFlowJudgment[\s\S]*readonly plan: RouteResourceFlowPlan[\s\S]*readonly closed: true/.test(authority)],
  ['resource-flow operation has a typed upstream authority contract', /interface RouteResourceFlowAuthority[\s\S]*readonly resolveDeclaration: \(input: RouteResourceDeclarationInput\) => RouteResourceFlowJudgment/.test(authority)],
  ['default authority exposes the declaration-level resolution contract without the legacy lower-level operation', /routeResourceFlowAuthority:[\s\S]*resolveDeclaration: resolveRouteResourceDeclarationJudgment/.test(authority) && !/resolve: resolveRouteResourceFlowJudgment/.test(authority)],
  ['existing LaravelRouteScannerInterface owns the resource-flow authority operation', /readonly routeResourceFlowAuthority: RouteResourceFlowAuthority/.test(scannerContract)],
  ['scanner interface contract evolves independently from scan outcome contract', /interface LaravelRouteScannerInterface[\s\S]*contractVersion: 28/.test(scannerContract) && /kind: 'laravel_route_scan_judgment',[\s\S]*contractVersion: 26/.test(scanner)],
  ['CLI scanner injects the exact authority into route declaration execution', /resourceFlowAuthority: LaravelRouteScannerInterface\['routeResourceFlowAuthority'\]/.test(scanner) && /emitDeclaration\(declaration, file, methodJudgment, authorizationAuthority, resourceFlowAuthority\)/.test(scanner)],
  ['resource route judgment is resolved from declaration evidence before the route emitter executes', /const judgment = resourceFlowAuthority\.resolveDeclaration\([\s\S]*declaration: declarationEvidence/.test(scanner) && /emitResourceRoutesFromJudgment\(\s*judgment/.test(scanner)],
  ['judgment executor consumes the plan and does not invoke semantic resolution', /const plan = judgment\.plan/.test(executorBody) && !/resolveRouteResourceFlowJudgment/.test(executorBody)],
  ['legacy resource emitter delegates to the judgment executor', /const judgment = resolveRouteResourceFlowJudgment\([\s\S]*return emitResourceRoutesFromJudgment\(judgment/.test(emitter)],
  ['judgment executor is exported through the existing scanner barrel', /emitResourceRoutesFromJudgment/.test(barrel)],
  ['scanner execution captures the injected authority instead of reading the scanner singleton', /authorities\.routeResourceFlowAuthority/.test(scanner) && /routeResourceFlowAuthority,\s*routeProducer/.test(scanner)],
  ['change does not add semantic foundation dependency to the changed scanner contract', !/semantic\/foundation/.test(scannerContract) && !/semantic\/foundation/.test(authority)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2366 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2366 audit failed');
