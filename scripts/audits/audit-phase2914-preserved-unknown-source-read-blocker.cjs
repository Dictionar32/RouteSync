const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const cliPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts');
const docsPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2914_PRESERVED_UNKNOWN_SOURCE_READ_BLOCKER.md');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cli = fs.readFileSync(cliPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const docs = fs.readFileSync(docsPath, 'utf8');
const collectionsSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['existing upstream blocker evidence includes a distinct unrecognized-code variant', /kind: 'php_source_document_failure_code_unrecognized'; readonly sourceFile: SourceFile }/.test(upstream) && !/php_source_document_failure_code_unrecognized'; readonly sourceFile: SourceFile; readonly code: StringValue/.test(upstream)],
  ['upstream blocker handlers expose the unrecognized-code operation', /onFailureCodeUnrecognized: \(blocker: Extract<PhpSourceDocumentReadBlockerEvidence, \{ readonly kind: 'php_source_document_failure_code_unrecognized' \}>\)/.test(upstream)],
  ['unrecognized blocker has a named interface-first factory operation', /readonly failureCodeUnrecognized: \(sourceFile: SourceFile\)/.test(upstream) && /export const phpSourceDocumentReadBlockerFactory: PhpSourceDocumentReadBlockerFactoryInterface = Object\.freeze/.test(upstream)],
  ['factory attaches domain continuation to the unrecognized variant', /failureCodeUnrecognized: sourceFile => \{[\s\S]*?handlers\.onFailureCodeUnrecognized\(evidence\)/.test(upstream)],
  ['CLI preserves unknown code in upstream blocker instead of mapping it to unreadable', /onUnrecognized: \(\) => phpSourceDocumentReadResultFactory\.blocked\([\s\S]*?phpSourceDocumentReadBlockerFactory\.failureCodeUnrecognized\(input\.sourceFile\)/.test(cli)],
  ['existing source-read result ADT remains the blocked result owner', /phpSourceDocumentReadResultFactory\.blocked\([\s\S]*?phpSourceDocumentReadBlockerFactory\.failureCodeUnrecognized/.test(cli)],
  ['focused test exercises the unknown-code blocker operation', /failureCodeUnrecognized\(sourceFile\)[\s\S]*?onFailureCodeUnrecognized:[\s\S]*?php_source_document_failure_code_unrecognized/.test(test)],
  ['runtime exports in traced CLI module do not use export function declarations', !/\bexport\s+function\s+/.test(cli)],
  ['upstream collections file remains empty', collectionsSize === 0],
  ['documentation distinguishes upstream contract preservation from platform adaptation', /unknown classification survives into the domain result/.test(docs) && /platform adaptation/.test(docs)],
  ['audit command is registered in package.json', packageJson.scripts['audit:phase2914-preserved-unknown-source-read-blocker'] === 'node scripts/audits/audit-phase2914-preserved-unknown-source-read-blocker.cjs'],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
