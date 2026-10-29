const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const controller = read('packages/core/src/types/upstream/controller.ts');
const routeMiddleware = read('packages/core/src/types/upstream/routeMiddleware.ts');
const authority = read('packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.ts');
const projection = read('packages/core/src/compiler/scanner/upstream/route/controllerMiddlewareProjection.ts');
const flow = read('packages/core/src/compiler/scanner/upstream/route/routeMiddlewareFlowResolver.ts');
const resolver = read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const algebra = read('packages/core/src/types/upstream/effectiveControllerActionPolicyAlgebra.ts');
const catalog = read('packages/core/src/compiler/scanner/semantic/route/routeMiddlewareKnowledgeCatalog.ts');
const testPath = 'packages/core/src/types/upstream/controllerPolicyActionScopeJudgmentAuthority.phase1969.test.ts';
const checks = [
  ['existing controller scope ADT includes only_except', controller.includes("readonly kind: 'only_except'; readonly only: Sequence<ActionName>; readonly except: Sequence<ActionName>")],
  ['existing route middleware scope ADT includes only_except', routeMiddleware.includes("readonly kind: 'only_except'; readonly only: readonly ActionName[]; readonly except: readonly ActionName[]")],
  ['authority recognizes both named constraints', authority.includes("kind: 'only_except'") && authority.includes("case 'only_except':")],
  ['authority no longer selects only the first scope argument', authority.includes('selectNamedScopes') && authority.includes("named.find(argument => argument.name.value.value === 'only')") && authority.includes("named.find(argument => argument.name.value.value === 'except')")],
  ['controller middleware projection preserves both lists', projection.includes("case 'only_except':") && projection.includes('sequenceToArray(relation.actions.only)') && projection.includes('sequenceToArray(relation.actions.except)')],
  ['route flow resolver applies allow and deny together', flow.includes("case 'only_except':") && flow.includes('scope.only') && flow.includes('scope.except')],
  ['effective controller policy resolver preserves combined scope', resolver.includes("case 'only_except':") && resolver.includes("kind: 'only_except'")],
  ['effective policy algebra handles combined authorization scope', algebra.includes("case 'only_except':") && algebra.includes('relation.actions.only') && algebra.includes('relation.actions.except')],
  ['route middleware knowledge catalog handles combined scope', catalog.includes("case 'only_except':") && catalog.includes('included(scope.only)') && catalog.includes('included(scope.except)')],
  ['regression test preserves simultaneous only and except', read(testPath).includes('preserves simultaneous only and except arguments as a combined semantic scope')],
  ['no relation subscanner created', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation'))],
  ['no foundation subscanner created', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`${checks.length - failed.length}/${checks.length} structural checks passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
