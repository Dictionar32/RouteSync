const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['action judgment interface owns the canonical ControllerResponse ADT', /readonly response: ControllerResponse/.test(judgment)],
  ['response is part of the completed judgment rather than a detached scanner-only value', /controller_action_semantic_judgment_completed[\s\S]*?readonly semantic: LaravelControllerActionSemanticKnowledge/.test(judgment) && /interface LaravelControllerActionSemanticKnowledge[\s\S]*readonly response: ControllerResponse/.test(judgment)],
  ['composition forwards canonical response ADT from the contract', /response: result\.contract\.semanticResponse/.test(wiring) && !/result\.contract\.response\.responseTypeName\(\)/.test(wiring)],
  ['scanner consumes the judgment-owned response ADT', /response: result\.semanticJudgment\.semantic\.response/.test(scanner)],
  ['scanner no longer reclassifies response from the descriptor', !/result\.semanticJudgment\.contract\.response\.responseTypeName\(\)/.test(scanner)],
  ['runtime still receives and returns one complete semantic judgment', /semanticJudgment: input\.semanticJudgment/.test(wiring)],
  ['audit command is registered', packageJson.scripts?.['audit:phase2120-action-response-judgment-ownership'] === 'node scripts/audits/audit-phase2120-action-response-judgment-ownership.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
