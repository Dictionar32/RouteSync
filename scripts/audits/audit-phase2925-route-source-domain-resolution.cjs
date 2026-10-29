const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const selectionPath = path.join(root, 'packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const compositionPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/laravelDefaultRouteSourceResolution.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const selection = fs.readFileSync(selectionPath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const checks = [
  ['each intent variant owns source-resolution operation', /interface LaravelRouteSourceSelectionIntentOperations[\s\S]*?readonly resolveFilesFor: \(\s*sourceProject: SourceProjectIdentity,\s*defaultSourceResolution: LaravelDefaultRouteSourceResolutionInterface,\s*\) => SourceFileInventory/.test(selection)],
  ['upstream selection ADT delegates default resolution', /defaultSourceResolution\.resolve\(sourceProject\)/.test(selection)],
  ['explicit intent preserves selected inventory', /_defaultSourceResolution: LaravelDefaultRouteSourceResolutionInterface,[\s\S]*?selection\.inventory/.test(selection)],
  ['runtime authority is interface-first', /export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object\.freeze/.test(selection)],
  ['filesystem adapter owns default route names', /'api\.php'/.test(resolver) && /'web\.php'/.test(resolver)],
  ['filesystem adapter uses interface-first runtime export', /export const laravelDefaultRouteSourceResolution: LaravelDefaultRouteSourceResolutionInterface = Object\.freeze/.test(resolver)],
  ['composition delegates through ADT and injected resolver', /intent\.resolveFilesFor\(sourceProject, laravelDefaultRouteSourceResolution\)/.test(composition)],
  ['composition no longer owns route path construction', !/path\.join\(sourceProject\.root\.value\.value, 'routes'/.test(composition)],
  ['composition no longer indexes route-source names', !/ROUTE_SOURCE_FILE_NAMES\[/.test(composition)],
  ['no exported function declaration in modified runtime files', !/export\s+function\s/.test(selection) && !/export\s+function\s/.test(composition) && !/export\s+function\s/.test(resolver)],
  ['collections.ts remains empty', fs.statSync(collectionsPath).size === 0],
]
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2925 route-source domain resolution audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
