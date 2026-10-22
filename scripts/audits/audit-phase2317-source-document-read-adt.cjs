const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['upstream reader contract exists', /interface PhpSourceDocumentReaderInterface/.test(read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts'))],
  ['read result is a closed complete/blocked ADT', /type PhpSourceDocumentReadResult\s*=\s*\n\s*\| Readonly<\{ readonly kind: 'php_source_document_read_complete'/.test(read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts')) && /readonly kind: 'php_source_document_read_blocked'/.test(read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts'))],
  ['source acquisition does not throw on read failures', !/documentFromFile/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['composition preserves blocked read evidence', /controller_invocation_manifest_source_documents_blocked/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts')) && /blockedReads/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts'))],
  ['reader implementation is wired through upstream interface', /const sourceDocumentReader: PhpSourceDocumentReaderInterface/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['scan consumes source-read blocker', /controller_invocation_manifest_source_documents_blocked/.test(read('packages/cli/src/commands/scan.ts'))],
  ['sync consumes source-read blocker', /controller_invocation_manifest_source_documents_blocked/.test(read('packages/cli/src/commands/sync.ts'))],
  ['drift audit consumes source-read blocker', /controller_invocation_manifest_source_documents_blocked/.test(read('packages/cli/src/commands/audit/driftAuditor.ts'))],
  ['no foundation or relations imports in changed CLI path', !/(semantic\/foundation|semantic\/relations)/.test(['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts','packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts','packages/cli/src/commands/scan.ts','packages/cli/src/commands/sync.ts','packages/cli/src/commands/audit/driftAuditor.ts'].map(read).join('\n'))],
];
let failures = 0;
for (const [name, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`); failures += Number(!ok); }
process.stdout.write(`${checks.length - failures}/${checks.length} structural checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
