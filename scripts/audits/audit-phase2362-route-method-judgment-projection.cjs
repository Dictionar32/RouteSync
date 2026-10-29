const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const methodContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const projection = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const cli = read('packages/cli/src/commands/scan.ts');
const invocation = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const checks = [
  ['upstream declaration-method judgment is a closed discriminated union', /export type LaravelRouteDeclarationMethodJudgment\s*=/.test(methodContract) && /laravel_route_declaration_method_resource/.test(methodContract) && /laravel_route_declaration_method_standard/.test(methodContract)],
  ['route projection receives the upstream method judgment as an explicit input', /methodJudgment:\s*LaravelRouteDeclarationMethodJudgment/.test(projection)],
  ['route projection no longer reclassifies declaration.method for special-route semantics', !/routeDeclarationSemanticKind\(declaration\.method\)/.test(projection) && !/import \{[^}]*routeDeclarationSemanticKind/.test(projection)],
  ['resource special kind is projected from the judgment method, including all four resource families', ['resource', 'apiResource', 'singleton', 'apiSingleton'].every(method => projection.includes(`case '${method}':`))],
  ['non-resource judgment variants project to standard special kind without reading source method strings', /case 'laravel_route_declaration_method_all_methods':[\s\S]*?case 'laravel_route_declaration_method_standard':[\s\S]*?return \{ kind: 'standard' \}/.test(projection)],
  ['active scanner calls the producer using the method judgment passed from the same route declaration', /methodAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(scanner) && /routeProducerInputFromRouteBoundary\(boundary, declaration, sourceSpan, methodJudgment/.test(scanner)],
  ['CLI scan enters the invocation manifest composition pipeline', /buildManifestWithInvocationPipeline\(sourceProject/.test(cli) && /controllerInvocationManifestComposition/.test(cli)],
  ['invocation composition delegates to the existing source-AST pipeline composition authority', /controllerInvocationManifestCompositionAuthority\.compose/.test(invocation)],
  ['targeted projection still avoids semantic foundation imports', !/semantic\/foundation/.test(projection) && !/semantic\/foundation/.test(scanner)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2362 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2362 audit failed');
