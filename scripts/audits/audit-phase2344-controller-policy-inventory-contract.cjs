const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing controller artifact contract publishes policyInventory', () => /readonly policyInventory: readonly import\('\.\/controller'\)\.ControllerPolicyRelation\[\];/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['controller scanner populates inventory from declaration evidence', () => /policyInventory: controllerPolicyInventoryFromDeclaration\([\s\S]*?declarationEvidence\.attributes,[\s\S]*?declaration\.methods,[\s\S]*?declaration\.interfaces/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'))],
  ['canonical inventory includes class attributes and HasMiddleware declarations', () => /controllerPolicyRelationsFromAttributes\(attributes\)/.test(read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts')) && /controllerHasMiddlewareRelations\(methods, interfaces, file\)/.test(read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'))],
  ['route policy catalog consumes controller-level inventory', () => /relations: Object\.freeze\(\[[\s\S]*?\.\.\.controller\.policyInventory,[\s\S]*?\.\.\.controller\.actions\.flatMap/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['zero published actions is not treated as unavailable inventory', () => !/controllers\.filter\(controller => controller\.actions\.length === 0\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['controller scanner implementation and interface contract versions align', () => /readonly contractVersion = 44 as const/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts')) && /readonly contractVersion: 44;/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['route scanner implementation and interface contract versions align', () => /readonly contractVersion: 16;/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts')) && /contractVersion: 16/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['blocked policy ADT does not expose policy products', () => /BlockedEffectiveControllerActionPolicy = Readonly<[\s\S]*?judgment:[\s\S]*?kind: 'blocked'[\s\S]*?\}\s*>/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts')) && !/interface BlockedEffectiveControllerActionPolicy[\s\S]*?middleware:/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts'))],
  ['CLI manifest builder preserves blocked pipeline outcomes', () => /projection\.kind !== 'laravel_source_ast_projection_complete'/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts')) && /kind: 'manifest_builder_blocked'/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['legacy RouteScanner remains visible for a separate caller audit', () => fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'))],
  ['no forbidden semantic foundation imports introduced', () => !/semantic\/foundation/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && !/semantic\/foundation/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'))],
  ['existing closed catalog ADT remains the route scanner contract', () => /EffectiveControllerActionPolicyCatalogJudgment/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && /kind: 'complete' as const, entries/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
];
let passed = 0;
for (const [label, check] of checks) {
  let ok = false;
  try { ok = check(); } catch {}
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`\n${passed}/${checks.length} checks passed\n`);
process.exitCode = passed === checks.length ? 0 : 1;
