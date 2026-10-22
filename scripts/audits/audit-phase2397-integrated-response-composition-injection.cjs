const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const implementation = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const checks = [
  ['existing controller dataflow authority contract evolved in place to v17', /interface ControllerDataflowSemanticJudgmentAuthorityInterface\s*\{[\s\S]*?contractVersion: 17;/.test(contract)],
  ['integrated-response composition is an explicit authority dependency', /readonly integratedResponseComposition: InvocationSemanticIntegratedResponseCompositionInterface/.test(contract)],
  ['authority implementation composes through the injected operation', /integratedResponseComposition\.integrate\(\{/.test(implementation) && !/invocationSemanticIntegratedResponseComposition\.integrate\(\{/.test(implementation)],
  ['factory preserves exact injected operation instance', /integratedResponseComposition: dependencies\.integratedResponseComposition/.test(implementation) && /derive: input => derive\(input, dependencies\)/.test(implementation)],
  ['production wiring explicitly supplies existing canonical composition', /createControllerDataflowSemanticJudgmentAuthority\(\{[\s\S]*?integratedResponseComposition: invocationSemanticIntegratedResponseComposition,[\s\S]*?\}\)/.test(implementation)],
  ['existing integrated-response composition remains pipeline-owned', /createInvocationSemanticIntegratedResponseComposition/.test(pipeline) && /dependencies\.pipeline\.analyzeKnowledge/.test(pipeline)],
  ['no duplicate authority interface or v2 facade introduced', !/ControllerDataflowSemanticJudgmentAuthorityInterfaceV2|LegacyControllerDataflowSemanticJudgmentAuthorityInterface/.test(contract + implementation)],
  ['no semantic foundation dependency introduced in changed authority path', !/semantic\/foundation/.test(contract + implementation)],
];
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, ok]) => ok).length}/${checks.length}\n`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
