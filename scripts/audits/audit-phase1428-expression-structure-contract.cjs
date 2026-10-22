const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const structure = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const projector = read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureProjector.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const tests = read('packages/core/src/compiler/scanner/__test__/upstream-contracts/scannerExpressionStructure.phase1428.test.ts');
const compoundStart = runtime.indexOf('function classifyCompoundExpression(');
const compoundEnd = runtime.indexOf('\nfunction classifyInstanceOf(', compoundStart);
const compound = runtime.slice(compoundStart, compoundEnd);
const checks = [
  ['closed structure ADT declares syntax shapes independently of AST types', /type ExpressionStructure[\s\S]*kind: 'short_ternary'[\s\S]*kind: 'ternary'[\s\S]*kind: 'array_access'[\s\S]*kind: 'call'[\s\S]*kind: 'binary'[\s\S]*kind: 'unary'/.test(structure)],
  ['compound classification resolves a structural judgment before projection', /scannerExpressionCandidateAlgebra\.resolveFirst/.test(compound) && /relationOptionFold\(resolution\.value/.test(compound)],
  ['candidate providers do not construct AST nodes before resolution', !/candidates:[\s\S]*PhpAstFactory\.(?:shortTernary|ternaryExpression|arrayAccess|functionCall|callableCall|nullCoalesce|binaryExpression|unaryExpression)/.test(compound.slice(0, compound.indexOf('switch (resolution.kind)')))],
  ['AST construction is delegated to the post-resolution structure projector', /projectPhpExpressionStructure\(value, tokens/.test(compound) && /switch \(structure\.kind\)[\s\S]*PhpAstFactory\.shortTernary[\s\S]*PhpAstFactory\.ternaryExpression[\s\S]*PhpAstFactory\.arrayAccess[\s\S]*PhpAstFactory\.functionCall[\s\S]*PhpAstFactory\.nullCoalesce[\s\S]*PhpAstFactory\.unaryExpression/.test(projector)],
  ['old compound function-call AST resolver is removed', !/function classifyFunctionCall\(/.test(runtime)],
  ['old unary AST resolver is removed', !/function classifyUnary\(/.test(runtime)],
  ['structure contract is exported from upstream type surface', /ExpressionStructure.*scannerExpressionStructure/.test(index)],
  ['integration tests cover precedence, coalescing, calls, and array access', /multiplication/.test(tests) && /null_coalesce/.test(tests) && /function_call/.test(tests) && /array_access/.test(tests)],
];
let failed = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
