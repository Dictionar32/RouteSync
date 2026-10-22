const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerStatementControlInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerStatementControlAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const facade = read('packages/core/src/compiler/scanner/lexer/phpControlEvidence.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE1454_STATEMENT_CONTROL_KIND_CONTRACT.md');
const checks = [
  ['interface defines a closed structured/not-structured judgment', /interface ScannerStatementControlInterface/.test(contract) && /kind: 'structured'/.test(contract) && /kind: 'not_structured'/.test(contract)],
  ['control-kind vocabulary is a closed union', ['conditional','collection_iteration','counted_iteration','pretest_iteration','selection_dispatch','exception_guard','exception_raise'].every(kind => contract.includes(`'${kind}'`))],
  ['judgment retains leading token evidence', /readonly evidence: Token/.test(contract) && /evidence\s*\}/.test(algebra)],
  ['canonical algebra implements the interface', /scannerStatementControlContractAlgebra: ScannerStatementControlInterface/.test(algebra)],
  ['keyword mapping is owned by the algebra', /const controlKeywords/.test(algebra) && /relationFirstOption\(controlKeywords/.test(algebra)],
  ['runtime imports the upstream contract algebra', /scannerStatementControlContractAlgebra/.test(runtime) && /ScannerStatementControlKind/.test(runtime)],
  ['runtime dispatches on the closed judgment', /switch \(judgment\.kind\)/.test(runtime) && /case 'not_structured'/.test(runtime) && /case 'structured'/.test(runtime)],
  ['runtime no longer calls the local control classifier', !/phpControlEvidence\(/.test(runtime) && !/from '\.\/phpControlEvidence'/.test(runtime)],
  ['compatibility facade delegates to the canonical algebra', /scannerStatementControlContractAlgebra\.resolve/.test(facade) && !/CONTROL_KEYWORDS/.test(facade)],
  ['upstream barrel exports interface and algebra', /scannerStatementControlInterface/.test(barrel) && /scannerStatementControlAlgebra/.test(barrel)],
  ['statement boundary and sequence authorities remain in place', /scannerStatementBoundaryContractAlgebra/.test(runtime) && /scannerStatementSequenceAlgebra/.test(runtime)],
  ['docs explicitly bound the migration and verification claims', /not the grammar\/parsing/.test(docs) && /static audit does not prove AST projection equivalence/.test(docs)],
  ['no any introduced in new contract or algebra', !/\bany\b/.test(contract) && !/\bany\b/.test(algebra)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1454 statement control-kind contract: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
