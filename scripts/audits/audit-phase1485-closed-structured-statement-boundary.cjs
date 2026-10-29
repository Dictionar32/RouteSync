const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['structured result is a closed judgment', () => {
    const source = read('packages/core/src/types/upstream/scannerStatementSequenceInterface.ts');
    return ['not_applicable', 'resolved', 'malformed', 'contract_violation'].every((kind) => source.includes(`kind: '${kind}'`));
  }],
  ['runtime normalizes malformed diagnostics at the structured boundary', () => {
    const source = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
    return source.includes("diagnostic.startsWith('Malformed ')") && source.includes("{ kind: 'malformed', diagnostic }") && source.includes("reason: 'invalid_resolution'");
  }],
  ['loop and switch malformed judgments are not collapsed into not-applicable', () => {
    const source = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
    return [
      /judgment\.kind === 'malformed'[\s\S]{0,100}Malformed collection iteration statement/.test(source),
      /judgment\.kind === 'malformed'[\s\S]{0,100}Malformed pretest iteration statement/.test(source),
      /judgment\.kind === 'malformed'[\s\S]{0,100}Malformed selection dispatch statement/.test(source),
      /judgment\.kind === 'malformed'[\s\S]{0,100}Malformed counted iteration statement/.test(source),
    ].every(Boolean);
  }],
  ['sequence algebra rejects out-of-range structured cursor', () => {
    const source = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
    return source.includes('resolved.nextIndex > contract.tokens.length') && source.includes("reason: 'invalid_structured_resolution'");
  }],
  ['regression test covers out-of-range structured cursor', () => {
    const source = read('packages/core/src/types/upstream/__test__/scannerStatementSequenceAlgebra.phase1419.test.ts');
    return source.includes('advances beyond the token source') && source.includes("reason: 'invalid_structured_resolution'");
  }],
];
let failed = 0;
for (const [name, check] of checks) {
  let passed = false;
  try { passed = check(); } catch {}
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 1485 audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
