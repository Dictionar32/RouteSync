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
const graphPath = path.join(root, 'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts');
const graph = fs.readFileSync(graphPath, 'utf8');
const domain = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/routeDomainAuthority.ts'), 'utf8');
const analysis = fs.readFileSync(path.join(root, 'packages/core/src/compiler/analysis/astAnalysisInterface.ts'), 'utf8');
const scanContract = fs.readFileSync(path.join(root, 'packages/cli/src/manifestScanOperationInterface.ts'), 'utf8');
const scanCommand = fs.readFileSync(path.join(root, 'packages/cli/src/commands/scan.ts'), 'utf8');
const syncCommand = fs.readFileSync(path.join(root, 'packages/cli/src/commands/sync.ts'), 'utf8');
const composition = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const cliSources = walk(path.join(root, 'packages/cli/src')).filter(file => !/(?:__tests?__|__test__)/.test(relative(file))).map(file => fs.readFileSync(file, 'utf8')).join('\n');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.existsSync(collectionsPath) ? fs.statSync(collectionsPath).size : null;
const checks = {
  resolverGraphJudgmentHasClosedDomainVariants: /ResolverGraphCandidateSelectedJudgment/.test(graph) && /ResolverGraphDefaultAppliedJudgment/.test(graph) && /domainOutcome: 'candidate_selected'/.test(graph) && /domainOutcome: 'default_applied'/.test(graph),
  resolverGraphJudgmentOwnsContinuationOperation: /ResolverGraphSemanticJudgmentContinuationHandlersInterface/.test(graph) && /continueWith: handlers => handlers\.candidate_selected\(judgment\)/.test(graph) && /continueWith: handlers => handlers\.default_applied\(judgment\)/.test(graph),
  resolverGraphHasNoReasoningPrimitive: !/readonly reasoning\s*:/.test(graph) && !/reasoning:\s*'declarative_relation_rewrite_fixed_point'/.test(graph),
  resolverGraphAuthorityInterfaceFirst: /export const resolverGraphSemanticOperations:\s*ResolverGraphSemanticOperationsInterface\s*=\s*Object\.freeze\(/.test(graph),
  runtimeAnalysisConsumesResolverGraphContinuation: /resolver\.continueWith(?:<[^\n]+>)?\(\{/.test(analysis) && /candidate_selected: judgment =>/.test(analysis) && /default_applied: judgment =>/.test(analysis),
  resolverGraphDoesNotImportRelationUtilities: !/semantic\/relations/.test(graph),
  upstreamRouteDomainJudgmentAlreadyActionable: /RouteDomainResolutionJudgment/.test(domain) && /readonly continueWith: \(handlers: RouteDomainResolutionContinuationHandlersInterface\)/.test(domain),
  manifestScanFactoryInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(scanContract),
  scanAndSyncConsumeManifestOperation: /manifestScanOperation\.scan\(/.test(scanCommand) && /manifestScanOperation\.scan\(/.test(syncCommand),
  scanAndSyncContinueManifestJudgment: /scannedManifest\.continueForDriftAudit\(/.test(scanCommand) && /scannedManifest\.continueForDriftAudit\(/.test(syncCommand),
  manifestCompositionAuthorityIsCanonical: /controllerInvocationManifestCompositionAuthority/.test(composition),
  cliHasNoSemanticRelationsImports: !/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/.test(cliSources),
  noExportFunctionDeclarationsOnProductionRuntimePath: exportedFunctions.length === 0,
  collectionsRemainEmpty: collectionsBytes === 0,
};
const result = {
  phase: 2866,
  title: 'Fully Typed Runtime Scanner Operations — Actionable Resolver Graph ADT and CLI Manifest Trace',
  runtimeFileCount: sources.length,
  relationImportStatementCount: relations.length,
  relationImportFileCount: new Set(relations.map(({ file }) => file)).size,
  exportedFunctionDeclarations: exportedFunctions,
  collectionsBytes,
  checks,
  remainingRelationImportFiles: [...new Set(relations.map(({ file }) => file))].sort(),
};
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2866_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length }, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
