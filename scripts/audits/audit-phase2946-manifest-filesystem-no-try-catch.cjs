const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const reader = read('packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts');
const upstream = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['manifest composition contains no try/catch control flow', !/\btry\s*\{|\bcatch\s*\(/.test(composition)],
  ['project canonicalization maps Promise outcomes to explicit domain judgments', /fs\.realpath\([\s\S]*?\.then\([\s\S]*?controller_source_project_identity_canonicalized[\s\S]*?controller_source_project_identity_canonicalization_blocked/.test(composition)],
  ['directory discovery maps lstat and readdir Promise outcomes to domain settlements', /fs\.lstat\([\s\S]*?\.then\([\s\S]*?fs\.readdir\([\s\S]*?\.then\([\s\S]*?controllerDirectoryReadSettlementFactory\.entries[\s\S]*?controllerDirectoryReadSettlementFactory\.blocked/.test(composition)],
  ['filesystem failures remain mapped through the filesystem authority', /filesystemFailureOperation\.create\([\s\S]*?nodeFilesystemFailureObservation\.observe/.test(composition)],
  ['source-read reader maps I/O rejection into existing read-result ADT', /fs\.readFile\([\s\S]*?\.then\([\s\S]*?phpSourceDocumentReadResultFactory\.blocked/.test(reader)],
  ['settlement rejection retains original rejection evidence', /readonly failure: unknown/.test(upstream) && /rejected: \(sourceFile: SourceFile, failure: unknown\)/.test(upstream)],
  ['upstream source read results own continueWith operations', /interface PhpSourceDocumentReadResultOperations[\s\S]*?readonly continueWith:/.test(upstream)],
  ['upstream collections remains empty', collections.length === 0],
  ['audit command is registered', packageJson.scripts['audit:phase2946-manifest-filesystem-no-try-catch'] === 'node scripts/audits/audit-phase2946-manifest-filesystem-no-try-catch.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
