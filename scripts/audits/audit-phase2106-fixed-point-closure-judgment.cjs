const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/compiler/analysis/dataflow/controlFlowDataFlowInterface.ts');
const judgment = read('packages/core/src/compiler/analysis/dataflow/dataFlowSolveJudgment.ts');
const forward = read('packages/core/src/compiler/analysis/dataflow/forwardSolver.ts');
const backward = read('packages/core/src/compiler/analysis/dataflow/backwardSolver.ts');
const facade = read('packages/core/src/compiler/analysis/DataFlowAnalysis.ts');
const dataflowBarrel = read('packages/core/src/compiler/analysis/dataflow/index.ts');
const rootExports = read('packages/core/src/index.ts');
const checks = [
  ['solver interface exposes a forward judgment API', contract.includes('readonly analyzeWithJudgment:')],
  ['solver interface exposes a backward judgment API', contract.includes('readonly analyzeBackwardWithJudgment:')],
  ['judgment preserves the fixed-point discriminated union', contract.includes('RelationFixedPoint<RelationIndex<number, FlowState<T>>>')],
  ['forward solver returns the complete fixed-point judgment', forward.includes('runForwardAnalysisWithJudgment') && /return fixedPoint;/.test(forward)],
  ['backward solver returns the complete fixed-point judgment', backward.includes('runBackwardAnalysisWithJudgment') && /return fixedPoint;/.test(backward)],
  ['legacy forward projection rejects round-limit exhaustion', forward.includes('requireConvergedDataFlow(runForwardAnalysisWithJudgment')],
  ['legacy backward projection rejects round-limit exhaustion', backward.includes('requireConvergedDataFlow(runBackwardAnalysisWithJudgment')],
  ['non-converged error retains the exact round-limit judgment', judgment.includes('readonly judgment: Extract<RelationFixedPoint') && judgment.includes("case 'fixed_point_round_limit_reached':")],
  ['closed projection only returns the converged branch', judgment.includes("case 'fixed_point_converged':") && judgment.includes('return judgment.value;')],
  ['DataFlowAnalysis implements both judgment methods', facade.includes('public analyzeWithJudgment(') && facade.includes('public analyzeBackwardWithJudgment(')],
  ['dataflow barrel exports judgment APIs and error', dataflowBarrel.includes('runForwardAnalysisWithJudgment') && dataflowBarrel.includes('runBackwardAnalysisWithJudgment') && dataflowBarrel.includes('DataFlowFixedPointIncompleteError')],
  ['package root exports the public solve judgment and error', rootExports.includes('DataFlowSolveJudgment') && rootExports.includes('DataFlowFixedPointIncompleteError')],
  ['no solver silently returns fixedPoint.value', !forward.includes('return fixedPoint.value;') && !backward.includes('return fixedPoint.value;')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
