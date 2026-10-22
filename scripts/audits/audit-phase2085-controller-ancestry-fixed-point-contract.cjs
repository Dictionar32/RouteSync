const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const tests = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const assertions = [
  ['closure certificate models a finite canonical-identity lattice', contract.includes("lattice: 'finite_canonical_class_identity_set'")],
  ['complete ancestry carries least-fixed-point certificate', contract.includes("fixedPoint: 'least_fixed_point'")],
  ['blocked ancestry only claims closure over resolved inventory', contract.includes("fixedPoint: 'least_fixed_point_over_resolved_inventory'")],
  ['certificate records convergence rounds and known ancestors', contract.includes('readonly rounds: number') && contract.includes('readonly knownAncestors: number')],
  ['ancestry expansion is iterative and monotone over seen identities', authority.includes('while (!converged)') && authority.includes('seen.push(parent)')],
  ['cycle detection stops before duplicating repeated ancestor', authority.includes("kind: 'inheritance_cycle', repeated: parentName")],
  ['tests assert complete and partial fixed-point certificates', tests.includes('controller_ancestry_closure_complete') && tests.includes('controller_ancestry_closure_partial')],
  ['scanner retains invocation-to-response and AST artifact wiring', scanner.includes('responseSemanticPipeline.judgeIntegratedResponse') && scanner.includes('responseSemanticPipeline.astProjection.judge')],
  ['scanner still has relation dependency and is not falsely marked clean', scanner.includes("semantic/relations/") && scanner.includes("../subscanners/controller")],
];
for (const [name, passed] of assertions) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = assertions.filter(([, result]) => result).length;
process.stdout.write(`RESULT ${passed}/${assertions.length}\n`);
if (passed !== assertions.length) process.exitCode = 1;
