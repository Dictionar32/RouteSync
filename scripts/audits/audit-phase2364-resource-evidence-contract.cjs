const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const projection = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const ast = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationAst.ts');
const checks = [
  ['upstream source evidence models resource action-filter presence as a closed ADT', /RouteDeclarationResourceActionFilterEvidence[\s\S]*kind: 'unfiltered'[\s\S]*kind: 'only'[\s\S]*kind: 'except'/.test(contract)],
  ['resource evidence carries action filter and all four modifiers', /RouteDeclarationResourceEvidence[\s\S]*actionFilter:[\s\S]*shallow: boolean;[\s\S]*scoped: boolean;[\s\S]*creatable: boolean;[\s\S]*destroyable: boolean;/.test(contract)],
  ['RouteDeclarationEvidence owns the resource evidence field', /readonly resource: RouteDeclarationResourceEvidence/.test(contract)],
  ['AST resource action filter is projected into source evidence', /actionFilter: declaration\.resourceActionFilter === undefined[\s\S]*kind: 'unfiltered'[\s\S]*declaration\.resourceActionFilter\.actions/.test(projection)],
  ['all source resource modifier values are preserved', /shallow: declaration\.resourceShallow/.test(projection) && /scoped: declaration\.resourceScoped/.test(projection) && /creatable: declaration\.resourceCreatable/.test(projection) && /destroyable: declaration\.resourceDestroyable/.test(projection)],
  ['RouteProducerInput reuses one evidence projection instead of re-reading AST resource modifiers', /const declarationEvidence = routeDeclarationEvidenceFromAst\(declaration\)/.test(projection) && /value: declarationEvidence\.resource\.shallow/.test(projection) && /value: declarationEvidence\.resource\.scoped/.test(projection) && /value: declarationEvidence\.resource\.creatable/.test(projection) && /value: declarationEvidence\.resource\.destroyable/.test(projection) && /declaration: declarationEvidence/.test(projection)],
  ['source AST defines the corresponding resource modifier facts', /resourceActionFilter\?/.test(ast) && /resourceShallow: boolean/.test(ast) && /resourceScoped: boolean/.test(ast) && /resourceCreatable: boolean/.test(ast) && /resourceDestroyable: boolean/.test(ast)],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(contract) && !/semantic\/foundation/.test(projection)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2364 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2364 audit failed');
