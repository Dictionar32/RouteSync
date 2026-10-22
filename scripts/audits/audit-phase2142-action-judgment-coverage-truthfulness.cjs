const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const executor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['action judgment no longer labels partial knowledge as completed', /kind: 'controller_action_semantic_judgment_published'/.test(contract) && !/kind: 'controller_action_semantic_judgment_completed'/.test(contract + wiring)],
  ['value-level judgment carries the typed semantic coverage witness', /readonly coverage: LaravelControllerActionSemanticKnowledgeCoverage/.test(contract) && /coverage: controllerActionSemanticKnowledgeCoverage/.test(wiring)],
  ['coverage witness names remaining derivation ownership gaps', /resource_binding_domain_publication/.test(contract) && /request_binding_compatibility_adapter/.test(contract) && /body_source_ast/.test(contract)],
  ['authority contract uses the same coverage witness as the produced judgment', /knowledgeCoverage: controllerActionSemanticKnowledgeCoverage/.test(wiring)],
  ['contract version 14 is aligned between interface and production composition', /readonly version: 14;/.test(contract) && /version: 14 as const/.test(wiring)],
  ['runtime executor explicitly forwards coverage without upgrading it', /explicit value-level coverage/.test(executor) && /never upgrades partial coverage/.test(executor) && /semanticJudgment: input\.semanticJudgment/.test(wiring) && /coverage: controllerActionSemanticKnowledgeCoverage/.test(wiring)],
  ['scanner still passes the exact action judgment to the runtime executor', /this\.executionDependencies\.actionJudgment\.judge\(/.test(scanner) && /this\.executionDependencies\.actionExecution\.execute\(\{\s*semanticJudgment\s*[,}]/.test(scanner)],
  ['legacy derivation remains disclosed rather than represented as migrated', /scanControllerAction\(/.test(wiring) && /upstream-action-derivation-is-not-yet-closed/.test(wiring)],
  ['no relation/foundation or new subscanner layer is introduced', !/types\/upstream\/(relation|foundation)|semantic\/(relation|foundation)|subscanners\/(relation|foundation)/.test(contract + executor + wiring)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('TRACE: published action knowledge carries partial-coverage ADT through the executor; no false closure claim is introduced.\n');
process.exitCode = failures === 0 ? 0 : 1;
