const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const walk = directory => fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
}) : [];
const relative = file => path.relative(root, file).split(path.sep).join('/');
const files = [...walk(path.join(root, 'packages/core/src/compiler/scanner')), ...walk(path.join(root, 'packages/core/src/types/upstream')), ...walk(path.join(root, 'packages/cli/src'))]
  .filter(file => !/\/(?:__tests?__|__test__)\//.test(relative(file)) && !/\.test\.ts$/.test(file));
const sources = files.map(file => ({ file: relative(file), text: fs.readFileSync(file, 'utf8') }));
const relations = sources.flatMap(({ file, text }) => [...text.matchAll(/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/g)].map(match => ({ file, statement: match[0] })));
const exportedFunctions = sources.flatMap(({ file, text }) => [...text.matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(match => ({ file, name: match[1] })));
const callableConstExports = sources.flatMap(({ file, text }) => [...text.matchAll(/^\s*export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/gm)].map(match => ({ file, name: match[1] })));
const scanContract = fs.readFileSync(path.join(root, 'packages/cli/src/manifestScanOperationInterface.ts'), 'utf8');
const scanCommand = fs.readFileSync(path.join(root, 'packages/cli/src/commands/scan.ts'), 'utf8');
const syncCommand = fs.readFileSync(path.join(root, 'packages/cli/src/commands/sync.ts'), 'utf8');
const composition = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const middleware = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/semantic/route/routeMiddlewareKnowledgeCatalog.ts'), 'utf8');
const middlewareContract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/routeMiddleware.ts'), 'utf8');
const middlewareResolver = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/routeMiddlewareFlowResolver.ts'), 'utf8');
const cliSources = walk(path.join(root, 'packages/cli/src')).filter(file => !/\/(?:__tests?__|__test__)\//.test(relative(file))).map(file => fs.readFileSync(file, 'utf8')).join('\n');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.existsSync(collectionsPath) ? fs.statSync(collectionsPath).size : null;
const checks = {
  manifestScanFactoryInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(scanContract),
  manifestScanOperationIsConsumedByScanAndSync: /manifestScanOperation\.scan\(/.test(scanCommand) && /manifestScanOperation\.scan\(/.test(syncCommand),
  manifestOutcomeUsesDomainContinuation: /scannedManifest\.continueForDriftAudit\(/.test(scanCommand) && /scannedManifest\.continueForDriftAudit\(/.test(syncCommand),
  manifestCompositionAuthorityIsCanonical: /controllerInvocationManifestCompositionAuthority/.test(composition),
  middlewareApplicabilityUsesInterfaceFirstAuthority: /export const routeMiddlewareScopeApplicabilityAuthority:\s*RouteMiddlewareScopeApplicabilityAuthorityInterface\s*=\s*Object\.freeze\(/.test(middleware),
  middlewareApplicabilityHasUpstreamActionableAdt: /RouteMiddlewareScopeNotApplicableJudgment/.test(middlewareContract) && /interface RouteMiddlewareScopeApplicabilityJudgment/.test(middlewareContract) && /readonly continueWith/.test(middlewareContract),
  middlewareApplicabilityIsAppliedByRuntimeResolver: /routeMiddlewareScopeApplicabilityAuthority\.classify\(declaration\.scope, input\.action\)/.test(middlewareResolver) && /routeMiddlewareScopeApplicabilityAuthority\.classify\(exclusion\.scope, input\.action\)/.test(middlewareResolver),
  middlewareApplicabilityHasActionableHandlers: /handlers\.onApplicable/.test(middleware) && /handlers\.onNotApplicable/.test(middleware),
  middlewareApplicabilityNoLongerExportsBooleanDecision: !/export const middlewareScopeApplicability\s*=/.test(middleware),
  noExportFunctionDeclarationsOnProductionRuntimePath: exportedFunctions.length === 0,
  cliHasNoSemanticRelationsImports: !/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/.test(cliSources),
  collectionsRemainEmpty: collectionsBytes === 0,
};
const result = {
  phase: 2864,
  title: 'Fully Typed Runtime Scanner Operations — Manifest CLI Trace and Actionable Middleware Scope ADT',
  runtimeFileCount: sources.length,
  relationImportStatementCount: relations.length,
  relationImportFileCount: new Set(relations.map(({ file }) => file)).size,
  exportedFunctionDeclarations: exportedFunctions,
  unannotatedExportedCallableConstCount: callableConstExports.length,
  collectionsBytes,
  checks,
  remainingRelationImportFiles: [...new Set(relations.map(({ file }) => file))].sort(),
};
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2864_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length }, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
