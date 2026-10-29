const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const adapterPath = path.join(core, 'compiler/scanner/operations/domain-model/route/routeGroupAstAdapter.ts');
const resolverPath = path.join(core, 'compiler/scanner/operations/domain-model/route/routeGroupContextResolver.ts');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const checks = [
  ['typed operation interface exists', /export interface RouteGroupAstFactsOperationInterface/.test(adapter)],
  ['public interface-typed const operation exists', /export const routeGroupAstFactsOperations:\s*RouteGroupAstFactsOperationInterface\s*=\s*Object\.freeze/.test(adapter)],
  ['legacy exported free function removed', !/export\s+function\s+extractRouteGroupFactsFromAst/.test(adapter)],
  ['runtime caller invokes operation object', /routeGroupAstFactsOperations\.extractFacts\(declaration\)/.test(resolver)],
  ['legacy relationVariantFold import removed', !/semantic\/relations\//.test(adapter)],
  ['legacy compiler relational helper removed', !/compiler\/relational\/sequence/.test(adapter)],
  ['ADT matching is exhaustive', /switch\s*\(argument\.kind\)/.test(adapter) && /const exhaustive:\s*never/.test(adapter)],
  ['immutable AST projections use native map', /declaration\.prefix\.map/.test(adapter) && /declaration\.groupConstraints\.map/.test(adapter)],
  ['subscanners remains absent', !fs.existsSync(path.join(core, 'compiler/scanner/subscanners'))],
  ['descriptors directory remains absent', !fs.existsSync(path.join(core, 'compiler/scanner/descriptors'))],
  ['semantic relations remains empty', fs.existsSync(path.join(core, 'semantic/relations')) && fs.readdirSync(path.join(core, 'semantic/relations')).length === 0],
  ['semantic foundation remains empty', fs.existsSync(path.join(core, 'semantic/foundation')) && fs.readdirSync(path.join(core, 'semantic/foundation')).length === 0],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exitCode = failed ? 1 : 0;
