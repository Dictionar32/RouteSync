const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const policyPath = 'packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts';
const policy = read(policyPath);
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const callers = [
  ['packages/core/src/types/upstream/semanticDataflowManifestSurface.ts', 'materializeSemanticDataflowQueryPolicy.materialize('],
  ['packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts', 'semanticDataflowQueryPolicyMatches.matches('],
  ['packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts', 'decodeSemanticDataflowQueryPolicyContract.decode('],
  ['packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts', 'semanticDataflowFactContractKey.key('],
];
const objectOperations = [
  ['semanticDataflowFactContractKey', 'SemanticDataflowFactContractKeyInterface', 'key'],
  ['materializeSemanticDataflowQueryPolicy', 'SemanticDataflowQueryPolicyMaterializerInterface', 'materialize'],
  ['validateSemanticDataflowQueryPolicyContract', 'SemanticDataflowQueryPolicyContractValidatorInterface', 'validate'],
  ['decodeSemanticDataflowQueryPolicyContract', 'SemanticDataflowQueryPolicyContractDecoderInterface', 'decode'],
  ['semanticDataflowQueryPolicyMatches', 'SemanticDataflowQueryPolicyContractMatcherInterface', 'matches'],
];
const checks = {
  collectionsEmpty: fs.existsSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')) && fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0,
  noExportFunctionInPolicy: !/^\s*export\s+function\s+/m.test(policy),
  interfaceFirstOperations: objectOperations.every(([name, contract, method]) => new RegExp(`export const ${name}: ${contract} = Object\\.freeze\\(\\{[\\s\\S]*?${method}:`, 'm').test(policy)),
  explicitUpstreamBarrelValues: objectOperations.every(([name]) => new RegExp(`\\b${name}\\b`).test(upstreamBarrel)) && !/export \* from '\.\/semanticDataflowQueryPolicy'/.test(upstreamBarrel),
  migratedCallSites: callers.every(([file, token]) => read(file).includes(token)),
  noOldCallSyntax: !/\b(?:materializeSemanticDataflowQueryPolicy|semanticDataflowQueryPolicyMatches|semanticDataflowFactContractKey|validateSemanticDataflowQueryPolicyContract|decodeSemanticDataflowQueryPolicyContract)\s*\(/.test(policy) && !callers.some(([file]) => /\b(?:materializeSemanticDataflowQueryPolicy|semanticDataflowQueryPolicyMatches|semanticDataflowFactContractKey|validateSemanticDataflowQueryPolicyContract|decodeSemanticDataflowQueryPolicyContract)\s*\(/.test(read(file))),
};
console.log(JSON.stringify({ phase: 2887, scope: 'semantic dataflow query-policy runtime operations', checks }, null, 2));
if (Object.values(checks).some(value => value !== true)) process.exitCode = 1;
