const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const policyPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts');
const surfacePath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const upstreamBarrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const coreBarrelPath = path.join(root, 'packages/core/src/index.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/semanticDataflowRuntimeOperations.phase2980.test.ts');
const policy = fs.readFileSync(policyPath, 'utf8');
const surface = fs.readFileSync(surfacePath, 'utf8');
const upstreamBarrel = fs.readFileSync(upstreamBarrelPath, 'utf8');
const coreBarrel = fs.readFileSync(coreBarrelPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');

const report = {
  phase: 3101,
  scope: 'replace query-policy selection generic continuation with a domain-owned manifest contract operation',
  genericSelectionHandlersRemoved: !policy.includes('SemanticDataflowQueryPolicySelectionHandlers'),
  genericSelectionContinuationRemoved: !/continueWith\s*:\s*<Result>/.test(policy),
  selectionOwnsPolicyContractMaterialization: /materializeQueryPolicyContracts\s*:\s*\(/.test(policy),
  defaultSelectionReturnsClosedEmptyPolicySet: /materializeQueryPolicyContracts:\s*\(\):\s*readonly SemanticDataflowQueryPolicyContract\[\]\s*=>\s*Object\.freeze\(\[\]\)/.test(policy),
  explicitSelectionMaterializesJudgmentsWithItsIntent: /materializeQueryPolicyContracts:\s*\(judgments: Sequence<SemanticDataflowJudgment>\)/.test(policy) && policy.includes('materializeSemanticDataflowQueryPolicy.materialize(items.head, intent)'),
  manifestSurfaceDelegatesToSelectionDomainOperation: /selection\.materializeQueryPolicyContracts\(judgments\)/.test(surface) && !surface.includes('selection.continueWith'),
  staleHandlerBarrelExportsRemoved: !upstreamBarrel.includes('SemanticDataflowQueryPolicySelectionHandlers') && !coreBarrel.includes('SemanticDataflowQueryPolicySelectionHandlers'),
  regressionCoverageAdded: test.includes('materializes query-policy contracts as a named selection-domain operation') || test.includes('exposes query-policy materialization as a named selection-domain operation'),
  noDeletedRelationFoundationRestored: !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationMembership.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationalSequence.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/semanticRelations.ts')),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const unverified = new Set(['fullTypecheckVerified', 'fullTestSuiteVerified', 'phpToCliManifestGeneratorE2eVerified']);
const failed = Object.entries(report).filter(([key, value]) => typeof value === 'boolean' && !value && !unverified.has(key)).map(([key]) => key);
const output = path.join(root, 'reports/PHASE3101_QUERY_POLICY_DOMAIN_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
