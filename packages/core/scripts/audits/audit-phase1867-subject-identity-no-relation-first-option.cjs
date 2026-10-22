const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const authority = fs.readFileSync(path.join(root, 'src/compiler/semantic/resourceModelBindingAuthority.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'src/compiler/scanner/wiring/laravelResourceScanner.ts'), 'utf8');
const checks = [
  ['batch subject lookup uses direct subject identity lookup', /judgmentForSubject[\s\S]*?judgments\.find\([\s\S]*?outcome\.subject === subject/.test(authority)],
  ['batch state correlation does not use relationFirstOption', !/relationFirstOption\(right, candidate => candidate\.outcome\.subject/.test(authority)],
  ['cycle transition correlation does not use relationFirstOption', !/relationFirstOption\(next, judgment => judgment\.outcome\.subject/.test(authority)],
  ['scanner subject correlation does not use relationFirstOption', !/relationFirstOption\(bindingBatch\.bindings/.test(scanner)],
  ['scanner correlates the exact subject object', /binding\.subject === subjectEntry\.subject/.test(scanner)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
