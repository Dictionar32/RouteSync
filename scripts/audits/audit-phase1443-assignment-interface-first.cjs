const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentPartsInterface.ts');
const indexPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const runtimePath = path.join(root, 'packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts');
const iface = fs.readFileSync(interfacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const checks = [
  ['public interface exists', iface.includes('interface ScannerAssignmentPartsInterface')],
  ['query uses occurrence judgment', iface.includes('TokenOccurrenceJudgment<Token>')],
  ['resolved evidence uses partitions', iface.includes('TokenOccurrenceEvidence<Token>')],
  ['no numeric index in public resolved contract', !/tokenIndex|readonly index\s*:\s*number/.test(iface)],
  ['malformed contract uses evidence location', iface.includes('TokenEvidenceLocation<Token>')],
  ['operator rules are typed', iface.includes('AssignmentOperatorRule<OperatorKind>')],
  ['interface exported from upstream index', index.includes("from './scannerAssignmentPartsInterface'")],
  ['runtime remains untouched by this phase', !runtime.includes('ScannerAssignmentPartsInterface')],
  ['algebra contract enforcement is recorded in the subsequent phase', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE1444_ASSIGNMENT_ALGEBRA_CONTRACT.md'))],
  ['documentation states interface-first order', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE1443_ASSIGNMENT_INTERFACE_FIRST.md'))],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, ok]) => ok).length}/${checks.length} checks passed`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
