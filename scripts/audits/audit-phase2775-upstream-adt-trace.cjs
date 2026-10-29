const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const collection = read('packages/core/src/types/upstream/collections.ts');
const ast = read('packages/core/src/types/upstream/ast.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const lowerer = read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const checks = [
  ['collections.ts is intentionally empty', collection.length === 0],
  ['scanner retains explicit scanned/not_scanned variants', /kind:\s*["']scanned["']/.test(scanner) && /kind:\s*["']not_scanned["']/.test(scanner)],
  ['scanner validates completeness before returning complete', /validateCompleteSourceAst\(ast, sourceProject\.source\)/.test(scanner)],
  ['manifest builder blocks on incomplete AST', /manifest_builder_blocked/.test(builder) && /laravel_source_ast_projection_complete/.test(builder)],
  ['source-model still has collection abstraction references to migrate', /Sequence<|sequenceAlgebra|sourceDiscoveryMatcher/.test(read('packages/core/src/types/upstream/highLevelSourceModel.ts'))],
  ['AST still references the emptied collection module', /from ['"]\.\/collections['"]/.test(ast) && /AstSequence</.test(ast)],
  ['manifest lowering currently throws for not_scanned', /discovery\.kind === ['"]not_scanned['"]/.test(lowerer) && /throw new Error/.test(lowerer)],
  ['projection composition has explicit projected/blocked ADT', /kind:\s*['"]manifest_projected['"]/.test(projection) && /kind:\s*['"]manifest_projection_blocked['"]/.test(projection)],
  ['CLI scan boundary is a typed operation object', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface/.test(cli)],
  ['CLI serialization uses a closed result ADT', /manifest_serialization_complete/.test(serializer) && /manifest_serialization_rejected/.test(serializer)],
  ['trace report exists', exists('PHASE2775_UPSTREAM_ADT_TRACE_AND_RECOMMENDATIONS.md')],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
console.log(`Result: ${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exitCode = 1;
