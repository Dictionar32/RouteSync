const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const policyPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const identityPath = path.join(root, 'packages/core/src/types/upstream/sourceProjectIdentity.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/semanticDataflowRuntimeOperations.phase2980.test.ts');
const policy = fs.readFileSync(policyPath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const identity = fs.readFileSync(identityPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');

const report = {
  phase: 3102,
  scope: 'close the stale query-policy selection call on the canonical source-project identity path with a selection-owned domain operation',
  selectionContractOwnsIdentityCreation: /readonly createSourceProjectIdentity:\s*\(/.test(policy),
  defaultSelectionDelegatesToCanonicalIdentityFactory: /createSourceProjectIdentity:\s*\(sourceRoot: SourceFile, factory: LaravelSourceProjectIdentityFactoryInterface\): SourceProjectIdentity => factory\.create\(sourceRoot\)/.test(policy),
  explicitSelectionPreservesPolicyIntent: /createSourceProjectIdentity:\s*\(sourceRoot: SourceFile, factory: LaravelSourceProjectIdentityFactoryInterface\): SourceProjectIdentity => factory\.createWithPolicy\([\s\S]*?policyIntent: intent/.test(policy),
  cliCompositionDelegatesToSelectionOperation: /queryPolicySelection\.createSourceProjectIdentity\([\s\S]*?createLaravelSourceProjectIdentity/.test(composition),
  staleSelectionContinuationRemovedFromCanonicalization: !/queryPolicySelection\.continueWith/.test(composition),
  sourceIdentityFactoryRemainsSingleOwner: /export const createLaravelSourceProjectIdentity: LaravelSourceProjectIdentityFactoryInterface = Object\.freeze/.test(identity),
  queryPolicyManifestMaterializationPreserved: /materializeQueryPolicyContracts/.test(policy),
  regressionCoverageAdded: /source-project identity creation as a named selection-domain operation/.test(test),
  noDeletedRelationFoundationRestored: !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationMembership.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationalSequence.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/semanticRelations.ts')),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const unverified = new Set(['fullTypecheckVerified', 'fullTestSuiteVerified', 'phpToCliManifestGeneratorE2eVerified']);
const failed = Object.entries(report).filter(([key, value]) => typeof value === 'boolean' && !value && !unverified.has(key)).map(([key]) => key);
const output = path.join(root, 'reports/PHASE3102_QUERY_POLICY_IDENTITY_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
