const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const modelPath = 'packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts';
const model = read(modelPath);
const ast = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const audit1922 = read('scripts/audits/audit-phase1922-controller-semantic-model-ownership.cjs');
const report1922 = read('reports/phase1922-controller-semantic-model-ownership-interface-first.md');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['model exists as an upstream contract, not a retired compatibility facade', /export interface ControllerDataflowInvocationSemanticModelInterface/.test(model)],
  ['production ControllerDataflowAst directly extends the model', /interface ControllerDataflowAst extends ControllerDataflowInvocationSemanticModelInterface<SemanticKnowledgeDataFlow>/.test(ast)],
  ['model owns canonical judgment and distinct integrated response', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(model) && /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult/.test(model)],
  ['model owns source-correlated knowledge projection', /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection/.test(model)],
  ['scanner contract identifies this model as the current semantic owner', /the-existing-ControllerDataflowInvocationSemanticModelInterface-owns-the-complete-knowledge-projection-provenance-canonical-judgment-and-integrated-response-values/.test(scannerContract)],
  ['Phase 1922 report no longer incorrectly labels the active model legacy', !/The legacy `ControllerDataflowInvocationSemanticModelInterface`/.test(report1922)],
  ['Phase 1922 audit no longer labels the active model legacy', !/legacy top-level model/.test(audit1922)],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
