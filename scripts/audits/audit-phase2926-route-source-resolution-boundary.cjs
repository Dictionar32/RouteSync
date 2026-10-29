const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const selectionPath = path.join(root, 'packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/laravelDefaultRouteSourceResolution.ts');
const compositionPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const selection = fs.readFileSync(selectionPath, 'utf8');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['upstream selection contract declares injected default-source resolution capability', /interface LaravelDefaultRouteSourceResolutionInterface[\s\S]*?resolve: \(sourceProject: SourceProjectIdentity\) => SourceFileInventory/.test(selection)],
  ['upstream ADT has no filesystem path imports or path construction', !/from ['"](?:node:)?path['"]/.test(selection) && !/path\.join|createSourceFile/.test(selection)],
  ['default intent delegates to the injected resolver', /resolveFilesFor:[\s\S]*?defaultSourceResolution\.resolve\(sourceProject\)/.test(selection)],
  ['explicit intent preserves its existing inventory', /resolveFilesFor:[\s\S]*?selection\.inventory/.test(selection)],
  ['filesystem adapter owns concrete Laravel route paths', /path\.join\(routeDirectory, 'api\.php'\)/.test(resolver) && /path\.join\(routeDirectory, 'web\.php'\)/.test(resolver)],
  ['filesystem adapter uses interface-first runtime export', /export const laravelDefaultRouteSourceResolution: LaravelDefaultRouteSourceResolutionInterface = Object\.freeze/.test(resolver)],
  ['composition passes the resolver into the ADT operation', /intent\.resolveFilesFor\(sourceProject, laravelDefaultRouteSourceResolution\)/.test(composition)],
  ['composition contains no inline default route path construction', !/path\.join\(sourceProject\.root\.value\.value, 'routes'/.test(composition)],
  ['focused test exercises the injected resolver', /resolveFilesFor\(project, laravelDefaultRouteSourceResolution\)/.test(test)],
  ['modified runtime modules contain no exported function declarations', !/export\s+function\s/.test(selection) && !/export\s+function\s/.test(resolver) && !/export\s+function\s/.test(composition)],
  ['collections.ts remains empty', fs.statSync(collectionsPath).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2926 route-source resolution boundary audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
