const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const ifacePath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const indexPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const iface = fs.readFileSync(ifacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const checks = [
  ['public assignment target interface exists', /interface ScannerAssignmentTargetInterface/.test(iface)],
  ['query has top-level occurrence evidence, not index result', /locateTopLevel:[\s\S]*TokenOccurrenceJudgment<Token>/.test(iface) && !/TokenStructureResolution|tokenIndex|readonly index:\s*number/.test(iface)],
  ['query uses typed delimiter judgment', /matchLeadingDelimiter:[\s\S]*DelimitedTokenJudgment<Token>/.test(iface)],
  ['judgment is closed over resolved/unresolved/malformed/contract violation', /kind: 'resolved'/.test(iface) && /kind: 'unresolved'/.test(iface) && /kind: 'malformed'/.test(iface) && /kind: 'contract_violation'/.test(iface)],
  ['malformed evidence uses source location contract', /location: TokenEvidenceLocation<Token>/.test(iface)],
  ['query has no slice callback or numeric cursor field', !/readonly slice:|readonly index:\s*number|tokenIndex/.test(iface)],
  ['upstream index exports target interface and types', /ScannerAssignmentTargetInterface, AssignmentTargetQuery, AssignmentTargetJudgment/.test(index)],
  ['algebra was not migrated in interface-first phase', /TokenStructureResolution/.test(algebra) && /readonly index: number/.test(algebra)],
  ['runtime wiring was not changed to consume new interface prematurely', !/ScannerAssignmentTargetInterface|AssignmentTargetQuery/.test(runtime)],
  ['scope documentation explicitly defers algebra and wiring', /does not modify `scannerAssignmentTargetAlgebra\.ts` or scanner runtime wiring/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE1446_ASSIGNMENT_TARGET_INTERFACE_FIRST.md'), 'utf8'))],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Phase 1446 assignment target interface first: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
