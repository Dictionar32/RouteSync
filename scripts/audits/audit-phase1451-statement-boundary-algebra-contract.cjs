const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerStatementBoundaryInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const algebra = read('packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts');
const sequence = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE1451_STATEMENT_BOUNDARY_ALGEBRA_CONTRACT.md');
const legacy = algebra.slice(algebra.indexOf('export const scannerStatementBoundaryAlgebra:'));
const checks = [
  ['canonical algebra implements the interface', /scannerStatementBoundaryContractAlgebra:\s*ScannerStatementBoundaryInterface/.test(algebra)],
  ['canonical judgment is partition-based and has no numeric cursor', /kind: 'terminator'[\s\S]*statement: query\.tokens\.slice\(0, index\)[\s\S]*terminator: token[\s\S]*remaining: query\.tokens\.slice/.test(algebra) && !/StatementBoundaryJudgment[\s\S]{0,500}readonly index\s*:/.test(contract)],
  ['canonical end-of-input judgment returns statement partition', /kind: 'end_of_input', statement: query\.tokens/.test(algebra)],
  ['malformed judgments retain token or end-of-source evidence', /location: tokenLocation\(token\)/.test(algebra) && /location: endLocation<Token>\(\)/.test(algebra)],
  ['mismatched delimiters compare exact opener/closer stack', /top\.closer !== value/.test(algebra) && /stack\.slice\(0, -1\)/.test(algebra)],
  ['legacy facade delegates to canonical judgment', /scannerStatementBoundaryContractAlgebra\.resolve\(\{ tokens: suffix, tokenValue: input\.tokenValue \}\)/.test(legacy)],
  ['legacy facade contains no delimiter scan or opener/closer lookup', !/openerFor\(|closerFor\(|resolveAt\(/.test(legacy)],
  ['canonical and compatibility algebra are exported', /scannerStatementBoundaryAlgebra, scannerStatementBoundaryContractAlgebra/.test(barrel)],
  ['sequence wiring remains untouched for the next phase', /boundary\.index/.test(sequence) && /findBoundary: \(tokens: readonly Token\[\], start: number\) => StatementBoundaryResolution/.test(sequence)],
  ['runtime still uses compatibility adapter; no premature migration', /scannerStatementBoundaryAlgebra\.resolve\(\{ tokens, start, tokenValue: token => token\.value \}\)/.test(runtime)],
  ['migration order and validation boundary are documented', /1\. Define the public interface[\s\S]*2\. Enforce it in the algebra[\s\S]*3\. Migrate sequence wiring[\s\S]*4\. Simplify runtime[\s\S]*5\. Verify downstream/.test(docs)],
  ['no any introduced in boundary algebra', !/\bany\b/.test(algebra)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1451 statement-boundary algebra contract: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
