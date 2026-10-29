const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const algebra = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts'), 'utf8');
const iface = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const checks = [
  ['canonical algebra implements interface', /scannerAssignmentTargetContractAlgebra:\s*ScannerAssignmentTargetInterface/.test(algebra)],
  ['canonical resolver uses interface query', /resolveTarget\(query\)/.test(algebra)],
  ['operator evidence is partition-based', /occurrence\.before/.test(algebra) && /occurrence\.after/.test(algebra)],
  ['delimiter judgment is consumed', /query\.matchLeadingDelimiter\(tokens\)/.test(algebra)],
  ['malformed judgment uses source location', /location:\s*TokenEvidenceLocation<Token>/.test(iface) && /locationFor\(contract\.tokens, result\.location\)/.test(algebra)],
  ['closed target judgment variants exist', /kind: 'resolved'/.test(iface) && /kind: 'unresolved'/.test(iface) && /kind: 'malformed'/.test(iface) && /kind: 'contract_violation'/.test(iface)],
  ['compatibility facade delegates canonical algebra', /scannerAssignmentTargetContractAlgebra\.resolve\(query\)/.test(algebra)],
  ['no duplicate legacy target resolver remains', !/const resolveTarget = <Token, Expression, Identifier, Target, Entry, Pattern>\(\s*contract: AssignmentTargetContract/.test(algebra)],
  ['upstream exports interface and algebra', /export \* from '\.\/scannerAssignmentTargetInterface'/.test(index) && /scannerAssignmentTargetContractAlgebra/.test(index)],
  ['runtime wiring remains out of scope', fs.existsSync(path.join(root, 'packages/core/src/compiler/frontend/php/astClassifierRuntime.ts'))],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 1447 audit: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
