const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const walk = dir => {
  const files = [];
  if (!exists(dir)) return files;
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(relative));
    else if (entry.name.endsWith('.ts')) files.push(relative);
  }
  return files;
};
const coreSources = walk('packages/core/src').filter(file => !file.includes('/__tests__/') && !file.includes('/__test__/') && !file.includes('.phase') && !/\.(?:test|spec)\.ts$/.test(file));
const production = coreSources.map(file => ({ file, text: read(file) }));
const result = {
  audit: 'phase938-upstream-dataflow-interface',
  topology: 'AST/source evidence -> canonical SemanticDataflowInput -> upstream judgment authority -> closed DataFlow/AST interface',
  checks: {
    canonicalInputADTExists: /export type SemanticDataflowInput\s*=/.test(read('packages/core/src/types/upstream/semanticDataflow.ts')),
    producerNeutralOrigin: /source: 'semantic_dataflow_input'/.test(read('packages/core/src/types/upstream/semanticDataflow.ts')),
    inputProducerMaterializesCanonicalInput: /const create\s*=\s*\(/.test(read('packages/core/src/types/upstream/semanticDataflowInputFactory.ts')) && /kind: 'semantic_dataflow_input'/.test(read('packages/core/src/types/upstream/semanticDataflowInputFactory.ts')),
    judgmentAuthorityOwnsClosure: /createSemanticDataflowJudgment/.test(read('packages/core/src/types/upstream/semanticDataflowAuthority.ts')) && /least_fixed_point/.test(read('packages/core/src/types/upstream/semanticDataflowAuthority.ts')),
    astDataflowUsesCanonicalADT: /type AstDataflowInput = SemanticDataflowInput/.test(read('packages/core/src/types/upstream/astDataflowInterface.ts')) && /type AstDataflowJudgment = SemanticDataflowJudgment/.test(read('packages/core/src/types/upstream/astDataflowInterface.ts')),
    dataflowAdapterPreservesJudgmentProof: /reasoning: judgment\.reasoningContract/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts')),
    manifestBuilderOwnsUpstreamReasoning: /semanticDataflowJudgmentsFromInputs\(dataflowInputs\)/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts')),
    legacyAnalyzerNotProductionAuthority: production.every(({ text }) => !/(?:from|export \*) ['"][^'"]*semanticDataFlowAnalyzer['"]/.test(text)),
    noProductionExamplePathCoupling: production.every(({ text }) => !/examples\/(?:ecomerce-shop-source|ecommerce-shop-source)/.test(text)),
  },
};
result.passed = Object.values(result.checks).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
