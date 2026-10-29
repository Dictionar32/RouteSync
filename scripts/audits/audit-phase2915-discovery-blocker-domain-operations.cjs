const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const cliPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const docsPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2915_DISCOVERY_BLOCKER_DOMAIN_OPERATIONS.md');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cli = fs.readFileSync(cliPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const docs = fs.readFileSync(docsPath, 'utf8');
const collectionsSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['existing discovery blocker contract has continuation handlers for all six variants', ['onRootMissing','onDirectoryMissing','onPathNotDirectory','onDirectoryUnreadable','onSymbolicLinkEncountered','onFailureCodeUnrecognized'].every(name => upstream.includes(name))],
  ['unknown filesystem code has a distinct upstream evidence variant', /controller_source_discovery_failure_code_unrecognized'; readonly directory: SourceFile }/.test(upstream) && !/controller_source_discovery_failure_code_unrecognized'; readonly directory: SourceFile; readonly code: StringValue/.test(upstream)],
  ['existing upstream blocker factory is interface-first and frozen', /export const laravelControllerSourceDiscoveryBlockerFactory: LaravelControllerSourceDiscoveryBlockerFactoryInterface = Object\.freeze/.test(upstream)],
  ['all blocker factory operations attach continueWith', ['onRootMissing(evidence)','onDirectoryMissing(evidence)','onPathNotDirectory(evidence)','onDirectoryUnreadable(evidence)','onSymbolicLinkEncountered(evidence)','onFailureCodeUnrecognized(evidence)'].every(operation => upstream.includes(operation))],
  ['core barrel exports the blocker operations and factory', index.includes('LaravelControllerSourceDiscoveryBlockerHandlers') && index.includes('LaravelControllerSourceDiscoveryBlockerFactoryInterface') && index.includes('laravelControllerSourceDiscoveryBlockerFactory')],
  ['CLI uses upstream factories for root and directory blockers', cli.includes('laravelControllerSourceDiscoveryBlockerFactory.rootMissing(root)') && cli.includes('laravelControllerSourceDiscoveryBlockerFactory.directoryMissing(directory)')],
  ['CLI uses upstream factory for symbolic-link blockers', (cli.match(/laravelControllerSourceDiscoveryBlockerFactory\.symbolicLinkEncountered/g) || []).length >= 2],
  ['unknown discovery error is preserved instead of collapsed into unreadable', /onUnrecognized: \(\) => laravelControllerSourceDiscoveryBlockerFactory\.failureCodeUnrecognized\(directory\)/.test(cli)],
  ['known access-denied codes retain the unreadable classification', /code === 'EACCES' \? filesystemFailureCodeFactory\.accessDenied\(\)/.test(cli) && /code === 'EPERM' \? filesystemFailureCodeFactory\.permissionDenied\(\)/.test(cli)],
  ['old UNKNOWN fallback judgment entry is removed', !/UNKNOWN: Object\.freeze\(\{\s*kind: 'filesystem_failure_code_other'/.test(cli)],
  ['traced CLI runtime module has no exported function declarations', !/\bexport\s+function\s+/.test(cli)],
  ['upstream collections file remains empty', collectionsSize === 0],
  ['phase documentation records the boundary and validation limitations', docs.includes('does not claim all primitive interpretation has been eliminated') && docs.includes('project-wide typecheck')],
  ['audit command is registered', packageJson.scripts['audit:phase2915-discovery-blocker-domain-operations'] === 'node scripts/audits/audit-phase2915-discovery-blocker-domain-operations.cjs'],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
