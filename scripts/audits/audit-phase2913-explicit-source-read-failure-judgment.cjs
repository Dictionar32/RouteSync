const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const cliPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const docsPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2913_EXPLICIT_SOURCE_READ_FAILURE_JUDGMENT.md');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cli = fs.readFileSync(cliPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const docs = fs.readFileSync(docsPath, 'utf8');
const collectionsSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const block = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/filesystemFailureInterface.ts'), 'utf8');
const checks = [
  ['source-read uses shared upstream unrecognized-code variant', /kind: 'filesystem_failure_code_unrecognized'/.test(block)],
  ['unrecognized platform code is normalized to a typed variant without a raw code payload', /unrecognized: \(\) => unrecognizedCode/.test(block) && !/filesystem_failure_code_unrecognized'; readonly code:/.test(block)],
  ['unrecognized variant owns continueWith', /unrecognizedCode:.*continueWith: handlers => handlers\.onUnrecognized\(\)/.test(block)],
  ['known missing-file code has a dedicated upstream variant', /filesystem_failure_code_missing/.test(block)],
  ['known path-not-file codes have a dedicated upstream variant', /filesystem_failure_code_is_directory/.test(block) && /filesystem_failure_code_not_directory/.test(block)],
  ['known permission failures have dedicated upstream variants', /filesystem_failure_code_access_denied/.test(block) && /filesystem_failure_code_permission_denied/.test(block)],
  ['domain ADT contains no synthetic UNKNOWN string entry', !/UNKNOWN:\s*Object\.freeze/.test(block)],
  ['reader preserves unrecognized judgment through dedicated upstream blocker', /onUnrecognized: \(\) => phpSourceDocumentReadResultFactory\.blocked\([\s\S]*?phpSourceDocumentReadBlockerFactory\.failureCodeUnrecognized\(input\.sourceFile\)/.test(cli)],
  ['existing upstream blocker ADT still owns continuation operations', /interface PhpSourceDocumentReadBlockerOperations\s*\{\s*readonly continueWith:/.test(upstream)],
  ['no exported function declaration in traced CLI runtime module', !/\bexport\s+function\s+/.test(cli)],
  ['collections.ts remains empty', collectionsSize === 0],
  ['documentation acknowledges remaining platform-boundary interpretation', /platform boundary still interprets unknown error codes/.test(docs)],
  ['audit is registered', Boolean(packageJson.scripts['audit:phase2913-explicit-source-read-failure-judgment'])],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
