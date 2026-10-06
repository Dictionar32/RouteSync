const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const pipeline = fs.readFileSync(path.join(root, 'src/compiler/analysis/semanticDataflowPipeline.ts'), 'utf8');
const route = fs.readFileSync(path.join(root, 'src/compiler/analysis/routeSyncDataflowAnalysis.ts'), 'utf8');
const ir = fs.readFileSync(path.join(root, 'src/compiler/ir/SemanticDataflowIRProjection.ts'), 'utf8');
const policy = fs.readFileSync(path.join(root, 'src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts'), 'utf8');
const state = fs.readFileSync(path.join(root, 'src/compiler/analysis/dataflow/semanticDataflowStatePolicy.ts'), 'utf8');
const testsDir = path.join(root, 'src/compiler/analysis/__tests__');
const testFiles = fs.readdirSync(testsDir).filter(name => name.endsWith('.ts')).map(name => fs.readFileSync(path.join(testsDir, name), 'utf8')).join('\n');

const checks = {
  analysisResultHasInterface: /readonly interface:\s*SemanticDataflowInterface/.test(pipeline),
  analysisResultDoesNotDuplicateJudgment: !/readonly judgment:\s*SemanticDataflowJudgment/.test(pipeline) && !/judgment:\s*semanticInterface\.judgment/.test(pipeline),
  routeReturnsInterfaceBackedAnalysis: /analysis:\s*analyzeSemanticDataflowInput/.test(route),
  irConsumesSemanticInterface: /SemanticDataflowInterface/.test(ir) && /dataflow\.judgment\.closure/.test(ir),
  policyConsumesInterface: /SemanticDataflowInterface/.test(policy) && /\.reaches\(dataflow\.judgment/.test(policy),
  statePolicyConsumesInterface: /SemanticDataflowInterface/.test(state) && /\.reaches\(dataflow\.judgment/.test(state),
  noProductionAnalysisJudgmentConsumer: !/analysis\.judgment/.test(route + ir + policy + state),
  testsUseInterfaceJudgment: !/analysis\.judgment/.test(testFiles),
};

const passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ...checks, passed }, null, 2));
process.exitCode = passed ? 0 : 1;
