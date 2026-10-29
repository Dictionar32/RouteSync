const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const projection = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const methodContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const checks = [
  ['resource action filter is preserved through upstream declaration evidence into the canonical registration', /only: declarationEvidence\.resource\.actionFilter\.kind === 'only'/.test(projection) && /except: declarationEvidence\.resource\.actionFilter\.kind === 'except'/.test(projection)],
  ['resource shallow semantics are not replaced with a hard-coded false value', /shallow: \{ kind: 'truth_value' as const, value: declarationEvidence\.resource\.shallow \}/.test(projection)],
  ['resource scoped semantics are preserved', /scoped: \{ kind: 'truth_value' as const, value: declarationEvidence\.resource\.scoped \}/.test(projection)],
  ['resource creatable and destroyable semantics are preserved', /creatable: \{ kind: 'truth_value' as const, value: declarationEvidence\.resource\.creatable \}/.test(projection) && /destroyable: \{ kind: 'truth_value' as const, value: declarationEvidence\.resource\.destroyable \}/.test(projection)],
  ['resource registration still carries explicit resource middleware rules', /middleware: routeResourceMiddlewareRules\(declarationEvidence\)/.test(projection) && /const routeResourceMiddlewareRules = \(evidence: RouteDeclarationEvidence\)/.test(projection)],
  ['method-family decision remains sourced from the existing upstream judgment authority', /declarationMethodAuthority: LaravelRouteDeclarationMethodJudgmentAuthority/.test(methodContract) && /methodAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(scanner)],
  ['the route producer is invoked with a complete RouteProducerInput at the scanner boundary', /routeProducerOperation\.produce\(routeProducerInputFromRouteBoundary\(boundary, declaration, sourceSpan, methodJudgment/.test(scanner)],
  ['target path still avoids semantic foundation imports', !/semantic\/foundation/.test(projection) && !/semantic\/foundation/.test(scanner)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2363 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2363 audit failed');
