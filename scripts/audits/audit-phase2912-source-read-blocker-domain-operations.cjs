const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const cliPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts');
const docsPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2912_SOURCE_READ_BLOCKER_DOMAIN_OPERATIONS.md');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const cli = fs.readFileSync(cliPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const docs = fs.readFileSync(docsPath, 'utf8');
const collectionsSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['upstream blocker variants are explicit', /php_source_document_file_missing/.test(upstream) && /php_source_document_path_not_file/.test(upstream) && /php_source_document_file_unreadable/.test(upstream)],
  ['blocker contract exposes a domain continuation', /interface PhpSourceDocumentReadBlockerOperations\s*\{\s*readonly continueWith:/.test(upstream)],
  ['blocker continuation has one handler per domain variant', /onFileMissing:/.test(upstream) && /onPathNotFile:/.test(upstream) && /onFileUnreadable:/.test(upstream)],
  ['upstream factory is interface-first and immutable', /const phpSourceDocumentReadBlockerFactory: PhpSourceDocumentReadBlockerFactoryInterface = Object\.freeze\(\{/.test(upstream)],
  ['variant constructors attach continueWith', /fileMissing: sourceFile =>/.test(upstream) && /pathNotFile: sourceFile =>/.test(upstream) && /fileUnreadable: sourceFile =>/.test(upstream) && (upstream.match(/continueWith: <Result>/g) || []).length >= 3],
  ['CLI reader reuses upstream blocker constructors', /phpSourceDocumentReadBlockerFactory\.fileMissing/.test(cli) && /phpSourceDocumentReadBlockerFactory\.pathNotFile/.test(cli) && /phpSourceDocumentReadBlockerFactory\.fileUnreadable/.test(cli)],
  ['CLI uses the shared upstream filesystem failure ADT', /filesystemFailureCodeFactory/.test(cli) && /nodeFilesystemFailureObservation\.observe\(error instanceof Error \? error : new Error\(\)\)\.continueWith\(\{/.test(cli) && /export type FilesystemFailureCode =/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/filesystemFailureInterface.ts'), 'utf8'))],
  ['reader maps shared ADT variants to existing upstream blocker factories', /onMissing: \(\) => phpSourceDocumentReadResultFactory\.blocked/.test(cli) && /onIsDirectory: \(\) => phpSourceDocumentReadResultFactory\.blocked/.test(cli) && /onUnrecognized: \(\) => phpSourceDocumentReadResultFactory\.blocked/.test(cli)],
  ['existing identity-binding test uses the upstream factory', /phpSourceDocumentReadBlockerFactory\.fileMissing\(otherSourceFile\)/.test(test)],
  ['unit tests exercise all blocker continuation variants', /continues a missing-file blocker/.test(test) && /continues a path-not-file blocker/.test(test) && /continues an unreadable-file blocker/.test(test)],
  ['no exported function declaration in traced CLI module', !/\bexport\s+function\s+/.test(cli)],
  ['collections.ts remains empty', collectionsSize === 0],
  ['documentation records the remaining platform boundary', /does not claim that primitive interpretation has been eliminated/.test(docs)],
  ['audit is registered', Boolean(packageJson.scripts['audit:phase2912-source-read-blocker-domain-operations'])],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
