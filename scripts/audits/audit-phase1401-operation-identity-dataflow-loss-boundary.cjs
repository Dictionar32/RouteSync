const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = directory => {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { recursive: true })
    .filter(file => typeof file === 'string' && /\.(ts|tsx|cjs|json)$/.test(file))
    .map(file => path.join(directory, file));
};
const projectionType = read('packages/core/src/types/interfaces/operationIdentityProjectionInterface.ts');
const projectionImpl = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const capability = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const dataflowType = read('packages/core/src/types/upstream/semanticDataflow.ts');
const dataflowAdapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const dataflowIr = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const packageJson = JSON.parse(read('package.json'));
const roots = [
  'packages/core/src/types/upstream', 'packages/core/src/compiler',
  'packages/sdk/src', 'packages/react/src', 'packages/cli/src',
  'examples/ecommerce-shop-source', 'scripts/audits'
];
const files = roots.flatMap(walk).filter(file => !file.endsWith('audit-phase1401-operation-identity-dataflow-loss-boundary.cjs'));
const all = files.map(read).join('\n');
const checks = {
  identityProjectionDeclaresUpstreamToDownstreamDirection: projectionType.includes("readonly direction: 'upstream_to_downstream'") || projectionType.includes('UpstreamWiringInterface<'),
  identityProjectionDeclaresUpstreamAuthority: projectionType.includes('UpstreamWiringInterface<') && projectionImpl.includes("upstreamAuthority: 'upstream'"),
  identityProjectionMakesLossPolicyExplicit: projectionType.includes("policy: 'identity_reference_only'") && projectionImpl.includes("policy: 'identity_reference_only'"),
  identityProjectionPreservesCanonicalIdentityTuple: projectionType.includes("readonly ['key', 'method', 'path']") && projectionImpl.includes("['key', 'method', 'path']"),
  identityProjectionDeclaresOmittedProofFields: ['evidence', 'derivation', 'provenance', 'reasoning'].every(field => projectionType.includes(`'${field}'`) && projectionImpl.includes(`'${field}'`)),
  identityProjectionDoesNotClaimToRebuildOmittedEvidence: !projectionImpl.includes('deriveIdentity') && !projectionImpl.includes('resolveIdentity') && !projectionImpl.includes('classifyRoute'),
  operationIdentityContractRetainsReasoningAndEvidence: capability.includes('readonly reasoning: SemanticReasoningContract') && capability.includes('OperationIdentityCapabilityEvidence') && capability.includes('derivation') && capability.includes('provenance'),
  dataflowJudgmentContainsClosureAndDerivations: dataflowType.includes('readonly closure: readonly SemanticDataflowFact[]') && dataflowType.includes('readonly derivations: readonly SemanticDataflowDerivation[]'),
  dataflowAdapterPreservesExactJudgmentAsInputAndState: /input: judgment/.test(dataflowAdapter) && /state: judgment/.test(dataflowAdapter),
  dataflowAdapterUsesJudgmentReasoningContract: /reasoning: judgment\.reasoningContract/.test(dataflowAdapter),
  dataflowIrConsumesJudgmentAuthorityRatherThanReclassifying: dataflowIr.includes('DataFlowAuthorityInterface') && dataflowIr.includes('SemanticDataflowJudgment') && !/classify|infer|resolveSemantic/.test(dataflowIr),
  sdkConsumesOperationIdentityReference: /OperationIdentityReference/.test(all) && /operationIdentity/.test(read('packages/cli/src/generators/sdk/apiObjectEmitter.ts')),
  targetPackagesDoNotImportAstClassifierRuntime: !/(from ['"][^'"]*astClassifierRuntime['"])/.test(files.filter(file => /packages\/(sdk|react|cli)\//.test(file)).map(read).join('\n')),
  packageVersionAndBuildScriptUnchanged: packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
};
const result = {
  phase: 1401,
  audit: 'operation-identity-dataflow-loss-boundary',
  trace: { scannedFiles: files.length, upstreamTypeFiles: walk('packages/core/src/types/upstream').filter(file => file.endsWith('.ts')).length, cliFiles: walk('packages/cli/src').length, sdkFiles: walk('packages/sdk/src').length, reactFiles: walk('packages/react/src').length, ecommerceFiles: walk('examples/ecommerce-shop-source').length },
  checks: Object.entries(checks).map(([name, passed]) => ({ name, passed })),
  passedChecks: Object.values(checks).filter(Boolean).length,
  totalChecks: Object.keys(checks).length,
  failures: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name),
};
const report = path.join(root, 'scripts/audits/reports/phase1401-operation-identity-dataflow-loss-boundary.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.failures.length) process.exitCode = 1;
