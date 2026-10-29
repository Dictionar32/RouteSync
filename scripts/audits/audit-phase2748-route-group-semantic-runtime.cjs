const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const resolverPath = path.join(core, 'compiler/scanner/upstream/route/routeGroupSemanticResolver.ts');
const adapterPath = path.join(core, 'compiler/scanner/operations/domain-model/route/routeGroupAstAdapter.ts');
const contextPath = path.join(core, 'compiler/scanner/operations/domain-model/route/routeGroupContextResolver.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const context = fs.readFileSync(contextPath, 'utf8');
const tests = [
  'compiler/scanner/semantic/route/__tests__/route-group-semantic-phase69.test.ts',
  'compiler/scanner/upstream/route/__tests__/route-group-semantic-phase69.test.ts',
  'compiler/scanner/wiring/route/__tests__/route-group-semantic-phase69.test.ts',
].map(file => fs.readFileSync(path.join(core, file), 'utf8'));
const relations = path.join(core, 'semantic/relations');
const foundation = path.join(core, 'semantic/foundation');
const checks = [
  ['runtime semantic resolver has no relations/foundation imports', !/semantic\/(?:relations|foundation)\//.test(resolver)],
  ['route constraint ADT is exhaustively matched', /switch\s*\(argument\.kind\)/.test(resolver) && /const exhaustive:\s*never\s*=\s*argument/.test(resolver)],
  ['controller Presence ADT is exhaustively matched', /switch\s*\(value\.kind\)/.test(resolver) && /const exhaustive:\s*never\s*=\s*value/.test(resolver)],
  ['binding scope variants are exhaustively matched', /case 'scoped':[\s\S]*case 'without_scoped':[\s\S]*case 'default':[\s\S]*const exhaustive:\s*never/.test(resolver)],
  ['relations helper projections replaced by typed native map', /facts\.constraints\.map/.test(resolver) && /values\.map\(value => value\.value\)/.test(resolver) && !/relationProject|relationGate|relationEqual|relationVariantFold|relationAdvanceIndex/.test(resolver)],
  ['sequence ADT is built immutably without relations helper', /Object\.freeze\(\{ kind: 'cons', head: values\[index\], tail: sequenceFromValues\(values, index \+ 1\) \}\)/.test(resolver) && /Object\.freeze\(\{ kind: 'empty' \}\)/.test(resolver)],
  ['judgment terminology reflects typed fact projection', /resolution: 'typed_fact_projection'/.test(resolver) && !/relation_fact_projection/.test(resolver)],
  ['public runtime API remains interface-typed operation object', /export const routeGroupSemanticResolver:\s*RouteGroupSemanticResolverInterface\s*=\s*Object\.freeze/.test(resolver)],
  ['AST-to-fact operation remains interface-typed', /export const routeGroupAstFactsOperations:\s*RouteGroupAstFactsOperationInterface\s*=\s*Object\.freeze/.test(adapter)],
  ['production context resolver uses operation object', /routeGroupAstFactsOperations\.extractFacts\(declaration\)/.test(context)],
  ['phase69 tests use operation-object API and valid pattern ADT fixture', tests.every(test => /routeGroupAstFactsOperations\.extractFacts/.test(test) && !/extractRouteGroupFactsFromAst/.test(test) && /argument:\s*\{\s*kind:\s*'pattern',\s*value:\s*'\[0-9\]\+'/.test(test) && /context\.constraints\.head\.kind, 'pattern'/.test(test))],
  ['semantic relations directory remains empty', fs.existsSync(relations) && fs.readdirSync(relations).length === 0],
  ['semantic foundation directory remains empty', fs.existsSync(foundation) && fs.readdirSync(foundation).length === 0],
  ['subscanners remains absent', !fs.existsSync(path.join(core, 'compiler/scanner/subscanners'))],
  ['descriptors directory remains absent', !fs.existsSync(path.join(core, 'compiler/scanner/descriptors'))],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exitCode = failed ? 1 : 0;
