const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const projection = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const checks = [
  ['upstream declaration evidence already preserves resource middleware and exclusions', /readonly resourceMiddleware: readonly/.test(evidence) && /readonly resourceMiddlewareExclusions: readonly/.test(evidence)],
  ['resource middleware projection consumes RouteDeclarationEvidence rather than scanner AST', /const routeResourceMiddlewareRules = \(evidence: RouteDeclarationEvidence\)/.test(projection)],
  ['middleware include/exclude facts are read from the evidence contract', /evidence\.resourceMiddleware\.map/.test(projection) && /evidence\.resourceMiddlewareExclusions\.map/.test(projection)],
  ['resource middleware scope conversion uses the evidence item type', /RouteDeclarationEvidence\['resourceMiddleware'\]\[number\]/.test(projection)],
  ['RouteResourceRegistration is populated from the same evidence projection', /middleware: routeResourceMiddlewareRules\(declarationEvidence\)/.test(projection) && /declaration: declarationEvidence/.test(projection)],
  ['the canonical CLI scanner still reaches the producer through its active route path', /routeProducerOperation\.produce\(routeProducerInputFromRouteBoundary\(boundary, declaration, sourceSpan, methodJudgment/.test(scanner)],
  ['the projection change introduces no semantic foundation dependency', !/semantic\/foundation/.test(projection) && !/semantic\/foundation/.test(evidence)],
  ['the projection change does not add a second resource registration contract', !/RouteResourceRegistrationV2|LegacyRouteResourceRegistration/.test(projection + evidence)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2365 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2365 audit failed');
