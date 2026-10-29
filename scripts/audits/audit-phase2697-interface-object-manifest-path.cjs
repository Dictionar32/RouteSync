#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail });
const files = {
  routeProjection: 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionInputs.ts',
  preflight: 'packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts',
  typeLowering: 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts',
  variableEvidence: 'packages/core/src/compiler/scanner/wiring/controllerVariableSemanticEvidenceAdapter.ts',
  variableInput: 'packages/core/src/compiler/scanner/wiring/controllerVariableSemanticResolutionInputAdapter.ts',
  migrationAdapter: 'packages/core/src/compiler/scanner/wiring/migrationInterfaceAdapter.ts',
  astPipeline: 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts',
  routeGroupSemantic: 'packages/core/src/compiler/scanner/upstream/route/routeGroupSemanticResolver.ts',
  routeGroupWiring: 'packages/core/src/compiler/scanner/wiring/route/routeGroupSemanticResolver.ts',
  routeGroupContext: 'packages/core/src/compiler/scanner/operations/domain-model/route/routeGroupContextResolver.ts',
  routeGroupCompat: 'packages/core/src/compiler/scanner/operations/domain-model/route/routeGroupSemanticResolver.ts',
  routeComposition: 'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts',
  cliOperation: 'packages/cli/src/manifestScanOperationInterface.ts',
  cliComposition: 'packages/cli/src/upstreamCompositionFactory.ts',
  cliScan: 'packages/cli/src/commands/scan.ts',
  cliSync: 'packages/cli/src/commands/sync.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
check('manifest route/model/resource/request projections share an explicit interface object', /export interface RouteManifestProjectionInputsInterface/.test(source.routeProjection) && /export const routeManifestProjectionInputs:\s*RouteManifestProjectionInputsInterface\s*=\s*Object\.freeze\(\{/.test(source.routeProjection));
check('request-resolution preflight consumes the projection object methods', /routeManifestProjectionInputs\.routeFlowsFromManifest\(manifest\)/.test(source.preflight) && /routeManifestProjectionInputs\.resourceAstsFromManifest\(manifest\)/.test(source.preflight) && /routeManifestProjectionInputs\.requestAstsFromManifest\(manifest\)/.test(source.preflight));
check('type lowering consumes the same projection object', /routeManifestProjectionInputs\.modelAstsFromManifest\(preflight\.manifest\)/.test(source.typeLowering));
check('PHP controller semantic evidence adapter has a named interface object', /export interface ControllerVariableSemanticEvidenceAdapterInterface/.test(source.variableEvidence) && /export const controllerVariableSemanticEvidenceAdapter:\s*ControllerVariableSemanticEvidenceAdapterInterface\s*=\s*Object\.freeze\(\{/.test(source.variableEvidence));
check('controller semantic input binds adapter object method', /controllerVariableSemanticEvidenceAdapter\.fromPhpAst\(input\.expression\)/.test(source.variableInput));
check('migration AST adapter is interface-typed object', /export interface MigrationInterfaceAdapterInterface/.test(source.migrationAdapter) && /export const migrationInterfaceAdapter:\s*MigrationInterfaceAdapterInterface\s*=\s*Object\.freeze\(\{/.test(source.migrationAdapter));
check('source AST pipeline maps migrations through adapter object', /migrations\.map\(migrationInterfaceAdapter\.fromAst\)/.test(source.astPipeline));
check('route-group semantic judgment and context use interface object', /export interface RouteGroupSemanticResolverInterface/.test(source.routeGroupSemantic) && /export const routeGroupSemanticResolver:\s*RouteGroupSemanticResolverInterface\s*=\s*Object\.freeze\(\{/.test(source.routeGroupSemantic) && /resolveJudgment/.test(source.routeGroupSemantic) && /resolveContext/.test(source.routeGroupSemantic));
check('route-group compatibility paths re-export object, not removed free functions', /export \{ routeGroupSemanticResolver \}/.test(source.routeGroupWiring) && /export \{ routeGroupSemanticResolver \}/.test(source.routeGroupCompat) && !/export \{\s*resolveRouteGroupFacts/.test(source.routeGroupWiring + source.routeGroupCompat));
check('route-group context projection is an interface-typed object', /export interface RouteGroupContextResolverInterface/.test(source.routeGroupContext) && /export const routeGroupContextResolver:\s*RouteGroupContextResolverInterface\s*=\s*Object\.freeze\(\{/.test(source.routeGroupContext));
check('route declaration composition calls object method for route group facts', /routeGroupContextResolver\.fromFact\(routeGroupFactFromEvidence\(declarationEvidence\)\)/.test(source.routeComposition));
check('CLI manifest operation and upstream composition retain interface-object contracts', /routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface/.test(source.cliOperation) && /routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface/.test(source.cliComposition));
check('CLI scan and sync call the typed manifest scan operation', /manifestScanOperation\.scan\(/.test(source.cliScan) && /manifestScanOperation\.scan\(/.test(source.cliSync));
check('migrated runtime files have no exported function declarations', ['routeProjection','variableEvidence','migrationAdapter','routeGroupSemantic','routeGroupWiring','routeGroupContext','routeGroupCompat'].every(key => !/^\s*export\s+(?:async\s+)?function\s+/m.test(source[key])));
check('migrated runtime files have no removed free-function identifiers', !/routeFlowsFromManifest\s*=|modelAstsFromManifest\s*=|resourceAstsFromManifest\s*=|requestAstsFromManifest\s*=|controllerVariableSemanticEvidenceFromPhpAst|migrationInterfaceFromAst|resolveRouteGroupFactsJudgment|resolveRouteGroupFacts\(/.test(Object.values(source).join('\n')));
const syntaxFiles = [files.routeProjection, files.preflight, files.typeLowering, files.variableEvidence, files.variableInput, files.migrationAdapter, files.astPipeline, files.routeGroupSemantic, files.routeGroupWiring, files.routeGroupContext, files.routeGroupCompat, files.routeComposition];
let syntaxPass = 0;
for (const relative of syntaxFiles) {
  const result = ts.transpileModule(read(relative), { fileName: relative, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  const errors = (result.diagnostics || []).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  check(`TypeScript syntax: ${relative}`, errors.length === 0, errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('; '));
  if (errors.length === 0) syntaxPass++;
}
const result = { phase: 2697, audit: 'interface-object-manifest-path', passed: checks.filter(item => item.ok).length, total: checks.length, syntaxFiles: syntaxFiles.length, syntaxPassed: syntaxPass, checks, typecheck: 'full project typecheck not run; transpileModule checks syntax only', notes: ['Structural and syntax checks do not replace project typecheck, tests, build, or CLI integration.'] };
fs.writeFileSync(path.join(root, 'PHASE2697_INTERFACE_OBJECT_MANIFEST_PATH_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`# Phase 2697 — Interface Object Manifest Path\n`);
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`RESULT ${result.passed}/${result.total}; syntax ${syntaxPass}/${syntaxFiles.length}`);
if (checks.some(item => !item.ok)) process.exitCode = 1;
