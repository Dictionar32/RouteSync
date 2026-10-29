const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestProducerInterface.ts'), 'utf8');
const producer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/requestProducer.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/FormRequestScanner.ts'), 'utf8');
const assertions = [
  ['request producer contract imports upstream SourceFile value object', /import type \{ RequestName, FormTypeName, SourceFile \} from '\.\/names'/.test(contract)],
  ['request producer input carries SourceFile rather than primitive path', /readonly sourceFile: SourceFile;/.test(contract) && !/readonly sourceFile: string;/.test(contract)],
  ['scanner passes canonical source identity object', /sourceFile: source\.sourceFile,/.test(scanner)],
  ['scanner does not flatten source identity at producer boundary', !/sourceFile: source\.sourceFile\.value\.value,/.test(scanner)],
  ['producer derives path at implementation edge', /const sourcePath = input\.sourceFile\.value\.value;/.test(producer)],
  ['validation rule parser receives path projection', /parseCanonicalValidationRuleEntries\(input\.rules, sourcePath\)/.test(producer)],
  ['authorization projection receives path projection', /authorization\(input\.authorize, sourcePath\)/.test(producer)],
  ['lifecycle projection receives path projection', /lifecycle\(input\.methods, sourcePath\)/.test(producer)],
  ['existing interface-first producer adapter remains authoritative', /export const requestProducer: RequestProducerInterface = Object\.freeze\(/.test(producer)],
];
for (const [label, passed] of assertions) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${assertions.filter(([, passed]) => passed).length}/${assertions.length} assertions passed`);
if (assertions.some(([, passed]) => !passed)) process.exitCode = 1;
