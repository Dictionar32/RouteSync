const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts');
const compositionInterface = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const coreIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const test = read('packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts');

assert('upstream identity-binding interface exists', contract.includes('interface PhpSourceDocumentIdentityBindingInterface'));
assert('binding returns a closed bound/rejected judgment', contract.includes("kind: 'php_source_document_identity_bound'") && contract.includes("kind: 'php_source_document_identity_rejected'"));
assert('contract requires result and blocker identity equality', contract.includes('read-result-source-identity-and-any-blocker-source-identity-must-equal-the-exact-requested-source-file-identity'));
assert('named upstream operation is exported', authority.includes('export const phpSourceDocumentIdentityBinding: PhpSourceDocumentIdentityBindingInterface'));
assert('complete reads bind against document source identity', authority.includes('result.document.sourceFile'));
assert('blocked reads bind both read and blocker source identities', authority.includes('result.blocker.sourceFile') && authority.includes('result.sourceFile'));
assert('composition dependency injects identity binding', compositionInterface.includes('sourceDocumentIdentityBinding: PhpSourceDocumentIdentityBindingInterface'));
assert('composition invokes injected binding operation', composition.includes('dependencies.sourceDocumentIdentityBinding.bind'));
assert('identity rejection terminates composition before semantic pipeline', composition.indexOf('controller_invocation_manifest_source_document_identity_rejected') < composition.indexOf('dependencies.sourceInvocationPipeline.analyze'));
assert('inventory source list is formed only from identity-bound documents', composition.includes('const boundReadResults = Object.freeze(identityBindings.flatMap') && composition.includes('documents.map(document => document.sourceFile)'));
assert('CLI scan handles identity rejection as terminal', scan.includes("scannedManifest.kind === 'controller_invocation_manifest_source_document_identity_rejected'"));
assert('CLI sync handles identity rejection as terminal', sync.includes("scannedManifest.kind === 'controller_invocation_manifest_source_document_identity_rejected'"));
assert('public core barrel exports contract and operation', coreIndex.includes('phpSourceDocumentIdentityBindingInterface') && coreIndex.includes('phpSourceDocumentIdentityBindingAuthority'));
assert('upstream barrel exports contract and operation', upstreamIndex.includes('phpSourceDocumentIdentityBindingInterface') && upstreamIndex.includes('phpSourceDocumentIdentityBindingAuthority'));
assert('behavioral test covers success and mismatch outcomes', test.includes('binds a complete read only to its requested source identity') && test.includes('rejects a complete document returned for another source identity') && test.includes('rejects a blocker whose source identity differs'));

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
const failed = checks.filter((check) => !check.passed);
console.log(`Phase 2567 source-document identity binding: ${checks.length - failed.length}/${checks.length} assertions passed`);
if (failed.length) process.exitCode = 1;
