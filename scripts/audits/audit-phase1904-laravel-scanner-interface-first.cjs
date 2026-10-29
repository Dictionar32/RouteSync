const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['upstream evidence adapter contract exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts'))],
  ['canonical model is referenced by upstream contract', read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts').includes("from './semanticDataflowKnowledge'")],
  ['scanner compatibility module imports upstream contract', read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeEvidenceAdapter.ts').includes("../../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface")],
  ['producer uses upstream interface', read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts').includes("../../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface")],
  ['Laravel boundary contract advanced to version 71', read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').includes('readonly version: 71;') && read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').includes('version: 71,')],
  ['runtime reduction explicitly remains gated', read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').includes('controllerDataflowRuntimeReductionGate')],
  ['semantic foundation is not reintroduced', !read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts').includes('semantic/foundation') && !read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts').includes('semantic/foundation')],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
