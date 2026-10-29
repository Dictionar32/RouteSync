const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const cliPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const docsPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2916_INTERFACE_FIRST_COMPOSITION_OPERATIONS.md');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cli = fs.readFileSync(cliPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const docs = fs.readFileSync(docsPath, 'utf8');
const collectionsSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const operations = [
  ['ControllerPhpSourceDiscoveryOperationInterface', 'controllerPhpSourceDiscoveryOperation', 'discover'],
  ['ControllerDirectoryEntriesVisitorInterface', 'controllerDirectoryEntriesVisitor', 'visit'],
  ['FilesystemFailureOperationInterface', 'filesystemFailureOperation', 'create'],
  ['CanonicalProjectCompositionOperationInterface', 'canonicalProjectCompositionOperation', 'compose'],
  ['DiscoveredSourcesContinuationOperationInterface', 'discoveredSourcesContinuationOperation', 'continue'],
  ['CompleteDocumentsContinuationOperationInterface', 'completeDocumentsContinuationOperation', 'continue'],
  ['InventoryClosureOperationInterface', 'inventoryClosureOperation', 'close'],
];
const checks = [
  ['source discovery helper is an explicit interface-first operation object', /interface ControllerPhpSourceDiscoveryOperationInterface[\s\S]*?const controllerPhpSourceDiscoveryOperation: ControllerPhpSourceDiscoveryOperationInterface = Object\.freeze/.test(cli)],
  ['directory traversal owns an explicit visitor contract', /interface ControllerDirectoryEntriesVisitorInterface[\s\S]*?const controllerDirectoryEntriesVisitor: ControllerDirectoryEntriesVisitorInterface = Object\.freeze/.test(cli)],
  ['filesystem failure mapping is an interface-first operation object', /interface FilesystemFailureOperationInterface[\s\S]*?const filesystemFailureOperation: FilesystemFailureOperationInterface = Object\.freeze/.test(cli)],
  ['canonical project composition has a named operation contract', /interface CanonicalProjectCompositionOperationInterface[\s\S]*?const canonicalProjectCompositionOperation: CanonicalProjectCompositionOperationInterface = Object\.freeze/.test(cli)],
  ['discovered-source continuation has a named operation contract', /interface DiscoveredSourcesContinuationOperationInterface[\s\S]*?const discoveredSourcesContinuationOperation: DiscoveredSourcesContinuationOperationInterface = Object\.freeze/.test(cli)],
  ['complete-document continuation has a named operation contract', /interface CompleteDocumentsContinuationOperationInterface[\s\S]*?const completeDocumentsContinuationOperation: CompleteDocumentsContinuationOperationInterface = Object\.freeze/.test(cli)],
  ['inventory closure has a named operation contract', /interface InventoryClosureOperationInterface[\s\S]*?const inventoryClosureOperation: InventoryClosureOperationInterface = Object\.freeze/.test(cli)],
  ['all seven operations are immutable objects', operations.every(([, variable]) => new RegExp(`const ${variable}: [A-Za-z]+Interface = Object\\.freeze\\(\\{`).test(cli))],
  ['filesystem failure call site uses the operation method', cli.includes('filesystemFailureOperation.create(sourceProject, root, directory, discovered, nodeFilesystemFailureObservation.observe(error instanceof Error ? error : new Error()), location)')],
  ['directory recursion calls the typed visitor operation', /controllerDirectoryEntriesVisitor\.visit\(\s*remainingEntries,/.test(cli)],
  ['discovery recursion calls the typed discovery operation', cli.includes('controllerPhpSourceDiscoveryOperation.discover(')],
  ['inventory closure is invoked through its contract', cli.includes('inventoryClosureOperation.close(inventoryResult, input.routeSelection, dependencies.manifestBuilderPreparation)')],
  ['legacy uncontracted helper identifiers are absent', !/\b(?:filesystemFailure|composeCanonicalProject|continueWithDiscoveredSources|continueWithCompleteDocuments|closeInventory|discoverControllerPhpFiles|visitEntries)\b/.test(cli)],
  ['traced runtime module has no exported function declarations', !/\bexport\s+(?:async\s+)?function\s+/.test(cli)],
  ['existing upstream discovery blocker remains the domain authority', upstream.includes('export const laravelControllerSourceDiscoveryBlockerFactory: LaravelControllerSourceDiscoveryBlockerFactoryInterface = Object.freeze') && index.includes('laravelControllerSourceDiscoveryBlockerFactory')],
  ['upstream blocker variants retain continuation operations', ['onRootMissing(evidence)','onDirectoryMissing(evidence)','onPathNotDirectory(evidence)','onDirectoryUnreadable(evidence)','onSymbolicLinkEncountered(evidence)','onFailureCodeUnrecognized(evidence)'].every(operation => upstream.includes(operation))],
  ['collections.ts remains empty', collectionsSize === 0],
  ['documentation records boundary and validation limitations', docs.includes('does not claim primitive interpretation is eliminated') && docs.includes('typecheck')],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase2916-interface-first-composition-operations'] === 'node scripts/audits/audit-phase2916-interface-first-composition-operations.cjs'],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
