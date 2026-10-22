const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['pipeline implementation exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticPipeline.ts'))],
  ['pipeline declares interface contract', read('packages/core/src/types/upstream/invocationSemanticPipeline.ts').includes('InvocationSemanticPipelineInterface')],
  ['pipeline delegates single invocation to runtime executor', read('packages/core/src/types/upstream/invocationSemanticPipeline.ts').includes('invocationSemanticRuntimeExecutor.execute(input)')],
  ['pipeline delegates whole knowledge to runtime executor', read('packages/core/src/types/upstream/invocationSemanticPipeline.ts').includes('invocationSemanticRuntimeExecutor.executeAll(knowledge)')],
  ['controller analyzer uses high-level pipeline', read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts').includes('invocationSemanticPipeline.analyzeKnowledge(semanticKnowledgeDataFlow)')],
  ['controller analyzer no longer calls lower-level executor', !read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts').includes('invocationSemanticRuntimeExecutor')],
  ['legacy subscanner implementation not falsely marked as removed', read('PHASE1695_SUBSCANNER_FACADE_AND_INVOCATION_JUDGMENT.md').includes('Do not delete `subscanners/` wholesale yet')],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
