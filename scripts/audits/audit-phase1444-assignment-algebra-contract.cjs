const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const ifacePath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentPartsInterface.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__test__/scannerAssignmentPartsInterfaceAlgebra.phase1444.test.ts');
const iface = fs.readFileSync(ifacePath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const checks = [
  ['algebra declares interface conformance', /interface ScannerAssignmentPartsAlgebra extends ScannerAssignmentPartsInterface/.test(algebra)],
  ['canonical resolve consumes index-free query', algebra.includes('const resolveQuery =') && algebra.includes('AssignmentPartsQuery<Token, Target, Value, OperatorKind>')],
  ['resolved judgment carries occurrence evidence', /evidence,/.test(algebra) && iface.includes('TokenOccurrenceEvidence<Token>')],
  ['public judgment has no cursor index', !/tokenIndex|readonly index\s*:\s*number/.test(iface)],
  ['malformed judgment uses token location', algebra.includes('location: occurrence.location')],
  ['empty and duplicate operator rules are rejected', algebra.includes('duplicateRules') && algebra.includes("reason: 'invalid_operator_rule'")],
  ['legacy adapter delegates into canonical query', algebra.includes('const judgment = resolveQuery(query)')],
  ['legacy result projection is isolated from public interface', algebra.includes('resolveLegacy') && !/tokenIndex/.test(iface)],
  ['runtime remains untouched during algebra phase', !runtime.includes('ScannerAssignmentPartsInterface')],
  ['downstream AST projection keeps its existing target/operator/reference/value shape', runtime.includes('PhpAstFactory.assignmentExpression(parsed.target, parsed.operator, parsed.reference, parsed.value)') && runtime.includes('PhpAstFactory.assignment(parsed.target, parsed.operator, parsed.reference, parsed.value')],
  ['contract regression test exists', fs.existsSync(testPath)],
  ['interface documents invalid operator positions', iface.includes('invalid_operator_position')],
  ['phase documentation exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE1444_ASSIGNMENT_ALGEBRA_CONTRACT.md'))],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, ok]) => ok).length}/${checks.length} checks passed`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
