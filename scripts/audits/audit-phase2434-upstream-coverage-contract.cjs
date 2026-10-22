const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const coveragePath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationCoverage.ts');
const source = fs.readFileSync(coveragePath, 'utf8');
const checks = [
  ['required-law coverage reads the typed contract map directly', /contract\.laws\[law\]\s*!==\s*'required'/.test(source)],
  ['verified-law coverage reads the typed verification map directly', /verification\.verifiedLaws\[law\]\s*!==\s*'verified'/.test(source)],
  ['coverage no longer downgrades typed law maps to unknown', !/const laws:\s*unknown/.test(source)],
  ['coverage no longer uses reflective property access', !/Reflect\.get/.test(source)],
  ['coverage remains an evidence operation and does not construct judgments', !/kind:\s*'derived'|kind:\s*'incomplete'|kind:\s*'conflict'/.test(source)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exitCode = 1;
