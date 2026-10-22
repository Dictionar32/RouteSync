const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const checks = [
  ['factory accepts only authority operations from the existing scanner contract', /Pick<\s*LaravelRouteScannerInterface/.test(scanner)],
  ['factory preserves the existing scanner interface as its result contract', /\): LaravelRouteScannerInterface => Object\.freeze/.test(scanner)],
  ['method judgment executes the authority supplied to the factory', /authorities\.declarationMethodAuthority/.test(scanner)],
  ['authorization judgment executes the authority supplied to the factory', /authorities\.authorizationAuthority/.test(scanner)],
  ['effective policy execution uses the supplied executor', /authorities\.effectiveControllerActionPolicyExecutor/.test(scanner)],
  ['scanner implementation does not reach back into the global singleton', !/laravelRouteScanner\.(declarationMethodAuthority|authorizationAuthority|effectiveControllerActionPolicyExecutor)/.test(scanner)],
  ['default scanner is constructed through the same injectable factory', /export const laravelRouteScanner: LaravelRouteScannerInterface = createLaravelRouteScanner\(/.test(scanner)],
  ['CLI pipeline continues to inject the exported scanner through existing dependencies', /routeScanner: laravelRouteScanner/.test(pipeline)],
  ['existing contract remains the authority owner', /readonly declarationMethodAuthority: LaravelRouteDeclarationMethodJudgmentAuthority/.test(contract)],
  ['no duplicate scanner authority interface was introduced', !/interface LaravelRouteScannerAuthorities/.test(scanner)],
  ['scanner file does not import semantic foundation directly', !/semantic\/foundation/.test(scanner)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2360 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2360 audit failed');
