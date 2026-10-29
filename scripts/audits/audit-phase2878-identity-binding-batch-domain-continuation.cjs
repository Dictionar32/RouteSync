const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const publicBarrelPath = path.join(root, 'packages/core/src/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const publicBarrel = fs.readFileSync(publicBarrelPath, 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['batch outcomes are identity-binding domain-specific', /php_source_document_identity_binding_batch_bound/.test(contract) && /php_source_document_identity_binding_batch_rejected/.test(contract)],
  ['batch outcomes expose domain continuation', /PhpSourceDocumentIdentityBindingBatchJudgmentOperations[\s\S]*continueWith/.test(contract)],
  ['rejected batch requires at least one identity rejection', /rejections: readonly \[[\s\S]*php_source_document_identity_rejected/.test(contract)],
  ['factory has an explicit interface-first export', /export const phpSourceDocumentIdentityBindingBatchFactory:\s*PhpSourceDocumentIdentityBindingBatchFactoryInterface/.test(authority)],
  ['batch factory consumes individual judgments through their continuation', /judgment\.continueWith\(/.test(authority)],
  ['batch factory binds read evidence through the existing binding contract', /bindReads:[\s\S]*binding\.bind\(/.test(authority)],
  ['composition delegates identity binding and aggregation to upstream', /phpSourceDocumentIdentityBindingBatchFactory\.bindReads\([\s\S]*dependencies\.sourceDocumentIdentityBinding[\s\S]*\.continueWith\(/.test(composition)],
  ['composition no longer splits identity results with flatMap', !/identityBindings\.flatMap|identityRejections/.test(composition)],
  ['rejected identity evidence is terminally preserved', /rejections: rejectedBatch\.rejections/.test(composition)],
  ['bound identity batch feeds the existing source-read batch ADT', /phpSourceDocumentReadBatchFactory\.fromResults\(boundBatch\.readResults\)/.test(composition)],
  ['upstream barrel exports the existing identity contract module', /export \* from '\.\/phpSourceDocumentIdentityBindingInterface'/.test(barrel)],
  ['upstream barrel exports batch factory', /phpSourceDocumentIdentityBindingBatchFactory/.test(barrel)],
  ['core public barrel exports batch factory', /phpSourceDocumentIdentityBindingBatchFactory/.test(publicBarrel)],
  ['collections.ts remains empty', collections.length === 0],
];
const report = {
  phase: 2878,
  title: 'Fully Typed Runtime Scanner Operations — Identity Binding Batch Domain Continuation',
  auditKind: 'structural-source-checks',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  collectionsBytes: collections.length,
  typecheck: 'not verified',
  build: 'not verified',
  endToEnd: 'not verified',
};
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2878_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const check of report.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`${report.passed}/${report.total} structural checks passed`);
if (report.passed !== report.total) process.exitCode = 1;
