#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, pass) => {
  checks.push({ name, pass: Boolean(pass) });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
};
const cliIndex = read('packages/cli/src/index.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliScanOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const manifestComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const manifestContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const astContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const builderContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const keyRuntimeFiles = [cliIndex, cliComposition, cliScanOperation, manifestComposition, builder, scanner, projection];
check('CLI entrypoint is interface-first and delegates program construction to typed operation objects',
  /export interface RouteSyncCliProgramInterface/.test(cliIndex) &&
  /export const routeSyncCliProgram:\s*RouteSyncCliProgramInterface\s*=\s*Object\.freeze\(\{/.test(cliIndex) &&
  /export const routeSyncCliProgramFactory:\s*RouteSyncCliProgramFactoryInterface\s*=\s*Object\.freeze\(\{/.test(cliIndex));
check('CLI composition assembly is a typed operation object',
  /export const routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface\s*=\s*Object\.freeze\(\{/.test(cliComposition));
check('CLI manifest scan factory is interface-first and preserves typed scan contract',
  /export interface RouteSyncCliManifestScanOperationInterface/.test(cliScanOperation) &&
  /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(\{/.test(cliScanOperation) &&
  /readonly scan:\s*\(input: ControllerInvocationManifestCompositionInput\) => Promise<ControllerInvocationManifest>/.test(cliScanOperation));
check('manifest terminal outcomes form a discriminated union ADT',
  /export type ControllerInvocationManifest\s*=/.test(manifestContract) &&
  /ControllerInvocationManifestInventoryRejectedJudgment/.test(manifestContract) &&
  /ControllerInvocationManifestSourceDiscoveryBlockedJudgment/.test(manifestContract) &&
  /ControllerInvocationManifestSourceDocumentsBlockedJudgment/.test(manifestContract));
check('source AST pipeline has explicit complete and blocked judgments',
  /kind: 'laravel_source_ast_projection_complete'/.test(astContract) &&
  /kind: 'laravel_source_ast_projection_blocked'/.test(astContract));
check('manifest builder preserves blocked-vs-complete judgment ADT',
  /kind: 'manifest_builder_complete'/.test(builderContract) &&
  /kind: 'manifest_builder_blocked'/.test(builderContract) &&
  /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=\s*Object\.freeze\(\{/.test(builder));
check('runtime trace closes validated invocation inventory before manifest build',
  /closeInventory\(inventoryResult, input\.routeSelection, dependencies\.manifestBuilderPreparation\)/.test(manifestComposition) &&
  /manifestBuilderPreparation: manifestBuilderOperationPreparation/.test(manifestComposition));
check('core scanner facade is interface-typed and uses canonical builder preparation',
  /routeSyncManifestScanOperationFactory\.create\(manifestBuilderOperationPreparation\)/.test(scanner) &&
  /export const routeSyncManifestScanner:\s*RouteSyncManifestScannerInterface\s*=\s*Object\.freeze\(\{/.test(scanner));
check('manifest projection entrypoint is an interface-typed object',
  /export const routeManifestProjectionOperations:\s*RouteManifestProjectionOperationsInterface\s*=\s*Object\.freeze\(\{/.test(projection));
check('no exported free functions remain in the selected manifest runtime path',
  keyRuntimeFiles.every((source) => !/^\s*export\s+function\s+/m.test(source)));
check('runtime files avoid direct exported typed arrow-function declarations outside operation objects',
  keyRuntimeFiles.every((source) => !/^\s*export\s+const\s+[\w$]+\s*=\s*\([^\n]*\)\s*:\s*[^=\n]+=>/m.test(source)));
const failed = checks.filter((item) => !item.pass);
console.log(`\nPhase 2751 upstream CLI manifest runtime trace audit: ${checks.length - failed.length}/${checks.length} assertions passed.`);
console.log('SCOPE: static source assertions; this does not replace TypeScript semantic typecheck, unit tests, package build, or CLI E2E.');
if (failed.length) process.exitCode = 1;
