const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const astProjectionTest = read('src/types/upstream/__test__/laravelControllerAstProjectionSemanticAuthority.phase1952.test.ts');
const controllerScanner = read('src/compiler/scanner/wiring/laravelControllerScanner.ts');
const sourceAstPipeline = read('src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const sourceAstOrchestrator = read('src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const checks = [
  ['invocation authority contract is v15 and declares one closed-ADT entry point', /readonly version: 15;/.test(contract) && /authorityEntryPoint: 'one-judge-signature/.test(contract)],
  ['upstream interface has exactly one judge signature', (contract.match(/\bjudge\(/g) || []).length === 1],
  ['runtime authority has one judge implementation and no overload declarations', (authority.match(/\bjudge\(/g) || []).length === 1 && !/judge\([^\n]*\):[^\n]*;\s*\n\s*judge\(/.test(authority)],
  ['runtime consumes the closed input ADT and emits the existing closed judgment ADT', /judge\(input: LaravelControllerInvocationSemanticInput\): LaravelControllerInvocationSemanticJudgment/.test(authority) && /LaravelControllerInvocationSemanticJudgmentInterface/.test(contract)],
  ['outcome-preservation rule remains explicit in the contract', /provided-pipeline-outcomes-preserve-source-binding-rejected-complete-or-blocked/.test(contract)],
  ['response integration remains indexed by the exact invocation judgment', /integrated_response_indexed_by_exact_invocation_judgment/.test(contract)],
  ['controller scanner consumes the closed invocation inventory before action processing', /input\.invocationInventory/.test(controllerScanner) && /invocationJudgment/.test(controllerScanner)],
  ['CLI source-AST orchestration delegates to the existing source-AST pipeline interface', /laravelSourceAstPipeline\.execute/.test(sourceAstOrchestrator) && /interface LaravelSourceAstPipelineInterface/.test(read('src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['source-AST pipeline wires the existing controller scanner instead of rebuilding invocation judgments', /controllerScanner: laravelControllerScanner/.test(sourceAstPipeline) && /controllerScanner\.scan\(/.test(sourceAstPipeline)],
  ['authority version regression test is synchronized to v15', /version: 15/.test(astProjectionTest)],
  ['invocation authority path adds no relation/foundation dependency', !/semantic\/(relations|foundation)\//.test(contract + authority)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
