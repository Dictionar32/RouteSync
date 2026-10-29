const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const runtime = fs.readFileSync(path.join(root, 'packages/core/src/compiler/frontend/php/astClassifierRuntime.ts'), 'utf8');
const algebra = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/scannerAssignmentPartsInterface.ts'), 'utf8');
const assignmentWiring = runtime.split('function parseAssignmentParts(')[1]?.split('function classifyAssignment(')[0] ?? '';
const checks = [
  ['runtime passes AssignmentPartsQuery locator', /locateOperator:\s*\(source, target\)\s*=>\s*scannerTokenStructureInterface\.locateTopLevel/.test(assignmentWiring)],
  ['runtime no longer passes legacy findTopLevelOperator to assignment algebra', !/findTopLevelOperator:/.test(assignmentWiring)],
  ['runtime no longer passes legacy tokenValue/slice adapter fields to assignment algebra', !/slice: relationSlice/.test(assignmentWiring)],
  ['runtime consumes index-free malformed location', /resolution\.location\.kind/.test(assignmentWiring)],
  ['runtime uses canonical assignment algebra', /scannerAssignmentPartsAlgebra\.resolve\(\{/.test(assignmentWiring)],
  ['contract exports AssignmentPartsQuery', /export type AssignmentPartsQuery/.test(contract)],
  ['contract result has source occurrence evidence', /readonly evidence: TokenOccurrenceEvidence<Token>/.test(contract)],
  ['algebra implements public interface', /interface ScannerAssignmentPartsAlgebra extends ScannerAssignmentPartsInterface/.test(algebra)],
  ['legacy adapter is retained only in algebra compatibility boundary', /const resolveLegacy/.test(algebra)],
  ['runtime does not define a new assignment parsing helper', !/function\s+resolveAssignmentParts|function\s+findAssignmentOperatorEvidence/.test(assignmentWiring)],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Phase 1445 assignment wiring contract: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
