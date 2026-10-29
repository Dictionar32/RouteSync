'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
let passed = 0;
function check(name, condition) {
  if (!condition) { console.error(`FAIL ${name}`); process.exitCode = 1; return; }
  passed += 1; console.log(`PASS ${name}`);
}
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const builderContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestSurface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
check('scan command consumes manifestScanOperation.scan', /manifestScanOperation\.scan\(/.test(scan));
check('sync command consumes manifestScanOperation.scan', /manifestScanOperation\.scan\(/.test(sync));
check('CLI scan operation has named input/output contract', /interface RouteSyncCliManifestScanOperationInterface/.test(cliOperation) && /scan: \(input: ControllerInvocationManifestCompositionInput\) => Promise<ControllerInvocationManifest>/.test(cliOperation));
check('CLI scan operation factory is interface-typed frozen object', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliOperation));
check('composition authority is assigned to its named interface', /export const controllerInvocationManifestCompositionAuthority:\s*ControllerInvocationManifestCompositionAuthorityInterface\s*=\s*controllerInvocationManifestCompositionAuthorityFactory\.create\(/.test(composition));
check('manifest preparation uses existing upstream contract', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=\s*Object\.freeze\(/.test(builder));
check('manifest builder has explicit complete/blocked ADT', /export type ManifestBuilderJudgment = ManifestBuilderCompleteJudgment \| ManifestBuilderBlockedJudgment/.test(builderContract));
check('manifest builder retains source-AST and source-model blocker arms', /stage: 'source_ast'/.test(builderContract) && /stage: 'source_model'/.test(builderContract));
check('manifest surface uses existing interface-first frozen object', /export const semanticDataflowManifestSurface:\s*SemanticDataflowManifestSurfaceInterface\s*=\s*Object\.freeze\(/.test(manifestSurface));
check('manifest surface no longer exports redundant factory/forwarders', !/export (?:function|const) (?:createSemanticDataflowManifestSurface|semanticDataflowInputsFromSourceModel|semanticDataflowJudgmentsFromInputs)\b/.test(manifestSurface));
check('manifest construction path has no exported function declaration in builder/surface', !/^export function\s/m.test(builder + '\n' + manifestSurface));
check('collections.ts remains exactly empty', collections.length === 0);
console.log(`${passed}/12 passed`);
if (passed !== 12) process.exitCode = 1;
