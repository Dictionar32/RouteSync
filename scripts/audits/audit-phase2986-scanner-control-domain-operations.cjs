const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/scannerStatementControlAlgebra.ts');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const iface = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/scannerStatementControlInterface.ts'), 'utf8');
const astRuntime = fs.readFileSync(path.join(root, 'packages/core/src/compiler/frontend/php/astClassifierRuntime.ts'), 'utf8');
const phpFacade = fs.readFileSync(path.join(root, 'packages/core/src/compiler/frontend/php/phpControlEvidence.ts'), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8');
const relationDir = path.join(root, 'packages/core/src/semantic/relations');
const checks = [
  ['runtime export is interface typed', /export const scannerStatementControlContractAlgebra:\s*ScannerStatementControlInterface\s*=\s*Object\.freeze\(/.test(algebra)],
  ['runtime scanner consumer imports upstream operation', /scannerStatementControlContractAlgebra/.test(astRuntime)],
  ['keyword knowledge is owned by scanner domain', /controlKeywordIndex/.test(algebra) && /controlKeywordJudgment/.test(algebra)],
  ['token presence has continuation-bearing ADT', /TokenEvidenceJudgment/.test(algebra) && /onPresent/.test(algebra) && /onAbsent/.test(algebra)],
  ['keyword recognition has continuation-bearing ADT', /ControlKeywordJudgment/.test(algebra) && /onRecognized/.test(algebra) && /onUnrecognized/.test(algebra)],
  ['old semantic relation imports removed from control algebra', !/semantic\/relations\/(?:semanticRelations|relationalSequence)/.test(algebra)],
  ['no exported standalone function declaration in control algebra', !/^export\s+function\s/m.test(algebra)],
  ['closed output judgment remains structured/not_structured', /kind: 'structured'/.test(iface) && /kind: 'not_structured'/.test(iface)],
  ['collections remains intentionally empty', collections.trim() === ''],
  ['deleted relation foundations are not restored', !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationDir, name)))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed).length;
console.log(`\n${checks.length - failed}/${checks.length} structural checks passed`);
console.log(`TRACE consumer: ${/scannerStatementControlContractAlgebra/.test(astRuntime) ? 'astClassifierRuntime.ts -> scannerStatementControlContractAlgebra.resolve' : 'NOT FOUND'}`);
console.log(`BLOCKER phpControlEvidence still imports relation option: ${/semantic\/relations\/relationalSequence/.test(phpFacade) ? 'YES' : 'NO'}`);
process.exitCode = failed ? 1 : 0;
