const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const publicIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['existing scanner contract exposes preparation instead of runtime scan(input)', contract.includes('readonly prepare: (input: LaravelRouteScanInput) => Promise<LaravelRouteScanOperationInterface>;') && !/readonly scan:\s*\(input: LaravelRouteScanInput\)/.test(contract)],
  ['prepared operation carries explicit input and authority contract', contract.includes('interface LaravelRouteScanOperationInterface extends LaravelRouteScannerAuthorityInterface') && contract.includes('readonly input: LaravelRouteScanInput;')],
  ['prepared operation execution signature has no parameters', contract.includes('readonly execute: () => Promise<LaravelRouteScanOutcome>;')],
  ['route executor is represented as execute method on prepared operation', scanner.includes('async execute() {') && scanner.includes('return outcome;') && !scanner.includes('const scanRoutes = async')],
  ['preparation consumes explicit input before operation creation', scanner.includes('const { controllerScan, sourceSelectionIntent } = input;') && !scanner.includes('} = this.input;')],
  ['pipeline prepares and immediately executes the route operation without passing runtime arguments', pipeline.includes('routeScanner.prepare({') && pipeline.includes('const routeOperation = await routeScanner.prepare({') && pipeline.includes('const routeScan = await routeOperation.execute();') && !pipeline.includes('routeScanner.scan(')],
  ['route scan blocker ordering remains in the active pipeline', pipeline.includes("routeScan.kind === 'laravel_route_scan_policy_blocked'") && pipeline.includes("routeScan.kind === 'laravel_route_scan_response_blocked'")],
  ['scanner contract version is synchronized at current version 36', contract.includes('readonly contractVersion: 36;') && scanner.includes('contractVersion: 36,')],
  ['prepared operation contract is publicly exported', publicIndex.includes('LaravelRouteScanOperationInterface') && publicIndex.includes('LaravelRouteScannerAuthorityInterface')],
  ['no foundation dependency added to the scanner path', !scanner.includes('semantic/foundation') && !contract.includes('semantic/foundation')],
  ['audit command is registered', packageJson.scripts['audit:phase2447-route-scanner-prepared-operation'] === 'node scripts/audits/audit-phase2447-route-scanner-prepared-operation.cjs'],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2447 prepared route scanner assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
