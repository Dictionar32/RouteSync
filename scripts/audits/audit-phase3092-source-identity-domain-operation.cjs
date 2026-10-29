const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const frontendPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const identityInterfacePath = path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts');
const identityAuthorityPath = path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts');
const frontend = fs.readFileSync(frontendPath, 'utf8');
const identityInterface = fs.readFileSync(identityInterfacePath, 'utf8');
const identityAuthority = fs.readFileSync(identityAuthorityPath, 'utf8');
const report = {
  phase: 3092,
  scope: 'focused PHP source-read result to source identity-binding domain operation',
  genericReadResultHandlersRemoved: !frontend.includes('PhpSourceDocumentReadResultHandlers'),
  genericReadResultContinueWithRemoved: !frontend.includes('readonly continueWith: <Result>(handlers: PhpSourceDocumentReadResultHandlers<Result>) => Result'),
  explicitBindIdentityOperationDeclared: frontend.includes('readonly bindIdentity: (') && frontend.includes('PhpSourceDocumentReadIdentityBindingOperations'),
  completeAndBlockedOperationsDeclared: frontend.includes('bindCompleteResult:') && frontend.includes('bindBlockedResult:'),
  identityAuthorityImplementsNamedOperations: identityInterface.includes('extends PhpSourceDocumentReadIdentityBindingOperations') && identityAuthority.includes('bindCompleteResult:') && identityAuthority.includes('bindBlockedResult:'),
  identityAuthorityDelegatesThroughDomainOperation: identityAuthority.includes('input.result.bindIdentity(input.requestedSourceFile, phpSourceDocumentIdentityBinding)'),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const outDir = path.join(root, 'reports');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'PHASE3092_SOURCE_IDENTITY_DOMAIN_OPERATION_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
const requiredChecks = [
  report.genericReadResultHandlersRemoved,
  report.genericReadResultContinueWithRemoved,
  report.explicitBindIdentityOperationDeclared,
  report.completeAndBlockedOperationsDeclared,
  report.identityAuthorityImplementsNamedOperations,
  report.identityAuthorityDelegatesThroughDomainOperation,
];
if (requiredChecks.some(value => value !== true)) process.exitCode = 1;
