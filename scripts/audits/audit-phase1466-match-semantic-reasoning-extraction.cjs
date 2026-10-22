const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const algebraPath = 'packages/core/src/types/upstream/scannerMatchExpressionAlgebra.ts';
const interfacePath = 'packages/core/src/types/upstream/scannerMatchExpressionInterface.ts';
const runtimePath = 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts';
const algebra = read(algebraPath);
const contract = read(interfacePath);
const runtime = read(runtimePath);
const checks = [
  ['typed interface is source evidence and closed judgments', /ScannerMatchExpressionJudgment/.test(contract) && /SCANNER_MATCH_CONTRACT_VIOLATION/.test(contract)],
  ['semantic partitioning is implemented in upstream algebra', /const parseArm/.test(algebra) && /const splitTopLevel/.test(algebra)],
  ['delimiter and top-level evidence use shared structure interface', /structure\.matchLeadingDelimiter/.test(algebra) && /structure\.locateTopLevelCandidates/.test(algebra)],
  ['token identity preserves source partition proof', /sameSequence/.test(algebra) && /sameToken/.test(algebra)],
  ['runtime delegates match reasoning to upstream algebra', /scannerMatchExpressionAlgebra\.resolve/.test(runtime)],
  ['runtime no longer performs match-arm splitting', !/function parseMatchArms\(/.test(runtime)],
  ['public upstream index exports the algebra', /scannerMatchExpressionAlgebra/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['focused algebra tests exist', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/__test__/scannerMatchExpressionAlgebra.phase1466.test.ts'))],
];
let failures = 0;
for (const [label, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`); if (!ok) failures++; }
process.exitCode = failures ? 1 : 0;
