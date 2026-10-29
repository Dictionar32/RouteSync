const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const contractPath = 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts';
const authorityPath = 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts';
const compositionPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const contract = fs.readFileSync(path.join(root, contractPath), 'utf8');
const authority = fs.readFileSync(path.join(root, authorityPath), 'utf8');
const composition = fs.readFileSync(path.join(root, compositionPath), 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['complete and blocked source-read evidence remain distinct', /PhpSourceDocumentReadCompleteEvidence[\s\S]*php_source_document_read_complete/.test(contract) && /PhpSourceDocumentReadBlockedEvidence[\s\S]*php_source_document_read_blocked/.test(contract)],
  ['source-read handlers explicitly distinguish complete and blocked', /interface PhpSourceDocumentReadResultHandlers<Result>[\s\S]*onComplete[\s\S]*onBlocked/.test(contract)],
  ['source-read ADT exposes continueWith', /interface PhpSourceDocumentReadResultOperations[\s\S]*continueWith/.test(contract)],
  ['both result variants require the continuation operation', /PhpSourceDocumentReadCompleteEvidence & PhpSourceDocumentReadResultOperations/.test(contract) && /PhpSourceDocumentReadBlockedEvidence & PhpSourceDocumentReadResultOperations/.test(contract)],
  ['result factory uses interface-first runtime export', /export const phpSourceDocumentReadResultFactory:\s*PhpSourceDocumentReadResultFactoryInterface/.test(contract)],
  ['complete producer invokes onComplete directly', /complete: document =>[\s\S]*handlers\.onComplete\(evidence\)/.test(contract)],
  ['blocked producer invokes onBlocked directly', /blocked: \(sourceFile, blocker\) =>[\s\S]*handlers\.onBlocked\(evidence\)/.test(contract)],
  ['identity-binding authority consumes source-read ADT through continueWith', /input\.result\.continueWith\([\s\S]*onComplete:[\s\S]*onBlocked:/.test(authority) && !/switch \(input\.result\.kind\)/.test(authority)],
  ['filesystem reader constructs complete result through domain factory', /phpSourceDocumentReadResultFactory\.complete\(/.test(composition)],
  ['filesystem reader constructs blocked result through domain factory', /phpSourceDocumentReadResultFactory\.blocked\(input\.sourceFile, blocker\)/.test(composition)],
  ['composition aggregates documents through read-result continuation', /phpSourceDocumentReadBatchFactory\.fromResults\(boundBatch\.readResults\)\.continueWith/.test(composition)],
  ['composition no longer dispatches on source-read kind while aggregating', !/boundReadResults\.flatMap\(result => result\.kind === 'php_source_document_read_/.test(composition)],
  ['source frontend contract remains exported from upstream barrel', /export \* from '\.\/phpSourceFrontendInterface'/.test(barrel)],
  ['collections.ts remains empty', collections.length === 0],
  ['phase report exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/PHASE2876_SOURCE_DOCUMENT_READ_DOMAIN_CONTINUATION.md'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const passedCount = checks.filter(([, passed]) => passed).length;
const report = {
  phase: 2876,
  title: 'Source Document Read Domain Continuation',
  auditKind: 'structural-source-checks',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: passedCount,
  total: checks.length,
  collectionsBytes: collections.length,
  typecheck: 'not-verified; project dependencies and configured ES2025 libraries are unavailable in this workspace',
};
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2876_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${passedCount}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
