const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const cliPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/filesystemFailureInterface.ts');
const discoveryPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const phpPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cli = fs.readFileSync(cliPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const discovery = fs.readFileSync(discoveryPath, 'utf8');
const php = fs.readFileSync(phpPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const collectionSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['filesystem failure codes are explicit upstream ADT variants', ['missing','is_directory','not_directory','access_denied','permission_denied','unrecognized'].every(kind => contract.includes(`filesystem_failure_code_${kind}`))],
  ['each failure-code variant owns continueWith behavior', ['handlers.onMissing()','handlers.onIsDirectory()','handlers.onNotDirectory()','handlers.onAccessDenied()','handlers.onPermissionDenied()','handlers.onUnrecognized()'].every(operation => contract.includes(operation))],
  ['upstream code factory is interface-first and immutable', /export const filesystemFailureCodeFactory: FilesystemFailureCodeFactoryInterface = Object\.freeze/.test(contract)],
  ['filesystem location is an upstream ADT with domain continuation', /export type FilesystemFailureLocation =/.test(contract) && /export const filesystemFailureLocationFactory: FilesystemFailureLocationFactoryInterface = Object\.freeze/.test(contract)],
  ['upstream filesystem contract is exported from the core barrel', index.includes("export * from './types/upstream/filesystemFailureInterface';")],
  ['discovery blocker no longer carries a primitive error-code string', /controller_source_discovery_failure_code_unrecognized'; readonly directory: SourceFile }/.test(discovery) && !/controller_source_discovery_failure_code_unrecognized'; readonly directory: SourceFile; readonly code: StringValue/.test(discovery)],
  ['source-read blocker no longer carries a primitive error-code string', /php_source_document_failure_code_unrecognized'; readonly sourceFile: SourceFile }/.test(php) && !/php_source_document_failure_code_unrecognized'; readonly sourceFile: SourceFile; readonly code: StringValue/.test(php)],
  ['filesystem operation receives SourceFile and typed failure ADTs', /readonly create: \([\s\S]*?root: SourceFile,[\s\S]*?directory: SourceFile,[\s\S]*?failureCode: FilesystemFailureCode,[\s\S]*?location: FilesystemFailureLocation,/.test(cli)],
  ['filesystem operation no longer accepts raw string paths or unknown errors', !/interface FilesystemFailureOperationInterface[\s\S]*?readonly create: \([\s\S]*?root: string/.test(cli) && !/interface FilesystemFailureOperationInterface[\s\S]*?error: unknown/.test(cli)],
  ['traced CLI source contains no explicit string or unknown types', !/\bunknown\b|:\s*string\b/.test(cli)],
  ['domain failure mapping consumes ADT operations, not raw code strings', /failureCode\.continueWith\(\{[\s\S]*?onUnrecognized: \(\) => laravelControllerSourceDiscoveryBlockerFactory\.failureCodeUnrecognized\(directory\)/.test(cli)],
  ['source reader consumes the same upstream failure-code ADT', /nodeFilesystemFailureObservation\.observe\(error instanceof Error \? error : new Error\(\)\)\.continueWith\(\{[\s\S]*?phpSourceDocumentReadBlockerFactory\.failureCodeUnrecognized\(input\.sourceFile\)/.test(cli)],
  ['platform boundary does not stringify or reflect over error payloads', !/String\(Reflect\.get|Reflect\.get\(Object\(thrownValue\)/.test(cli)],
  ['traced runtime module has no exported function declarations', !/\bexport\s+(?:async\s+)?function\s+/.test(cli)],
  ['collections.ts remains empty', collectionSize === 0],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase2917-upstream-filesystem-failure-adt'] === 'node scripts/audits/audit-phase2917-upstream-filesystem-failure-adt.cjs'],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
