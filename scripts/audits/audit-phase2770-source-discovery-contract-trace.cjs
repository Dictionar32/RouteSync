const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const files = {
  collections: 'packages/core/src/types/upstream/collections.ts',
  completeness: 'packages/core/src/types/upstream/completeness.ts',
  ast: 'packages/core/src/types/upstream/ast.ts',
  manifest: 'packages/core/src/types/upstream/manifest.ts',
  pipeline: 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts',
  lowerer: 'packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts',
  projection: 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionInputs.ts',
  sourceModel: 'packages/core/src/types/upstream/highLevelSourceModel.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(path.join(root, file), 'utf8')]));
const checks = [
  ['SourceDiscovery is the canonical not_scanned/scanned status contract', /export type SourceDiscovery<T>/.test(source.collections) && /kind: 'not_scanned'/.test(source.collections) && /kind: 'scanned'; readonly items: readonly T\[\]/.test(source.collections)],
  ['Completeness validator explicitly rejects not_scanned categories', /source_category_not_scanned/.test(source.completeness) && /validateCompleteSourceAst/.test(source.completeness)],
  ['Manifest consumes CompleteSourceAst', /readonly ast: CompleteSourceAst/.test(source.manifest)],
  ['Source AST pipeline routes partial category scans through completeness validation', /validateCompleteSourceAst\(ast, sourceProject\.source\)/.test(source.pipeline)],
  ['Manifest lowerer no longer masks not_scanned with an empty array', !/discovery\.kind === 'not_scanned'\s*\?\s*Object\.freeze\(\[\]\)\s*:\s*discovery\.items/.test(source.lowerer) && /CompleteSourceAst invariant violated: .* was not scanned before manifest lowering/.test(source.lowerer)],
  ['Projection inputs no longer mask not_scanned with an empty array', !/discovery\.kind === 'not_scanned'\s*\?\s*Object\.freeze\(\[\]\)\s*:\s*discovery\.items/.test(source.projection) && /CompleteSourceAst invariant violated: .* was not scanned before manifest projection/.test(source.projection)],
  ['Audit report documents the remaining array/Sequence split without claiming closure', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2770_SOURCE_DISCOVERY_CONTRACT_TRACE.md'), 'utf8').includes('`SourceDiscovery<T>` still declares `readonly T[]`, and `SourceModelCatalog` still declares `Sequence<T>`')],
  ['All traced TypeScript files parse without syntax diagnostics', Object.values(source).every((text, index) => ts.createSourceFile(`phase2770-${index}.ts`, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).parseDiagnostics.length === 0)],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
console.log(`Phase 2770 source-discovery contract trace audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
