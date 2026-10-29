const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const contractPath = 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts';
const authorityPath = 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts';
const compositionPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const contract = fs.readFileSync(path.join(root, contractPath), 'utf8');
const authority = fs.readFileSync(path.join(root, authorityPath), 'utf8');
const composition = fs.readFileSync(path.join(root, compositionPath), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['identity binding contract defines named continuation handlers', /interface PhpSourceDocumentIdentityBindingHandlers<Result>[\s\S]*onBound[\s\S]*onRejected/.test(contract)],
  ['identity binding judgment exposes continueWith', /interface PhpSourceDocumentIdentityBindingJudgmentOperations[\s\S]*continueWith/.test(contract)],
  ['bound and rejected judgments retain distinct domain evidence', /interface PhpSourceDocumentIdentityBindingJudgmentOperations[\s\S]*export type PhpSourceDocumentIdentityBoundEvidence[\s\S]*export type PhpSourceDocumentIdentityRejectedEvidence/.test(contract)],
  ['judgment union requires the domain operation on both variants', /PhpSourceDocumentIdentityBoundEvidence & PhpSourceDocumentIdentityBindingJudgmentOperations/.test(contract) && /PhpSourceDocumentIdentityRejectedEvidence & PhpSourceDocumentIdentityBindingJudgmentOperations/.test(contract)],
  ['producer attaches continuation to bound result', /continueWith:[\s\S]*handlers\.onBound\(evidence\)/.test(authority)],
  ['producer attaches continuation to rejected result', /continueWith:[\s\S]*handlers\.onRejected\(evidence\)/.test(authority)],
  ['composition gathers rejections through ADT operation', /identityBindings\.flatMap\(binding => binding\.continueWith\([\s\S]*onRejected: rejectedBinding/.test(composition)],
  ['composition gathers bound read results through ADT operation', /identityBindings\.flatMap\(binding => binding\.continueWith\([\s\S]*onBound: boundBinding/.test(composition)],
  ['composition no longer directly dispatches on identity binding kind', !/binding\.kind === 'php_source_document_identity_rejected'/.test(composition) && !/binding\.kind === 'php_source_document_identity_bound'/.test(composition)],
  ['existing upstream contract remains exported from barrel', /export \* from '\.\/phpSourceDocumentIdentityBindingInterface'/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8'))],
  ['collections.ts remains empty', collections.length === 0],
  ['phase report exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/PHASE2875_IDENTITY_BINDING_DOMAIN_CONTINUATION.md'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
