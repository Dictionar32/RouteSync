const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerConditionalStatementInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerConditionalStatementAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE1455_CONDITIONAL_STATEMENT_EVIDENCE_CONTRACT.md');
const conditionalParser = runtime.slice(runtime.indexOf('function parseConditionalStatement('), runtime.indexOf('function parseCollectionIterationStatement('));
const checks = [
  ['interface defines resolved/not-applicable/malformed closed judgments', /kind: 'resolved'/.test(contract) && /kind: 'not_applicable'/.test(contract) && /kind: 'malformed'/.test(contract)],
  ['contract carries condition, then-body, branch, and remaining partitions', /readonly condition: readonly Token\[\]/.test(contract) && /readonly thenBody: readonly Token\[\]/.test(contract) && /readonly elseBranch: ScannerConditionalElseBranch<Token>/.test(contract) && /readonly remaining: readonly Token\[\]/.test(contract)],
  ['else branch is a closed discriminated union', /kind: 'none'/.test(contract) && /kind: 'else_if'/.test(contract) && /kind: 'else_block'/.test(contract)],
  ['malformed judgment preserves source location and bounded reasons', /TokenEvidenceLocation<Token>/.test(contract) && /expected_condition/.test(contract) && /expected_then_body/.test(contract) && /expected_else_body/.test(contract) && /malformed_delimiter/.test(contract)],
  ['canonical algebra implements the interface', /scannerConditionalStatementContractAlgebra: ScannerConditionalStatementInterface/.test(algebra)],
  ['algebra delegates delimiter evidence to existing token-structure interface', /scannerTokenStructureInterface\.matchLeadingDelimiter/.test(algebra) && !/findMatchingClose\(/.test(algebra)],
  ['algebra recursively resolves else-if without dropping the suffix', /resolveConditional\(\{ tokens: elseTail/.test(algebra) && /remaining: nested\.evidence\.remaining/.test(algebra)],
  ['runtime calls canonical conditional contract', /scannerConditionalStatementContractAlgebra\.resolve/.test(conditionalParser)],
  ['runtime projects condition/body/else evidence into AST', /projectConditionalStatement\(judgment\.evidence\)/.test(conditionalParser) && /classifyAstTokens\(evidence\.condition\)/.test(runtime) && /parseBlock\(evidence\.thenBody\)/.test(runtime)],
  ['conditional parser no longer performs local delimiter searches', !/matchingClose\(|matchingBrace\(|indexOf\(tokens, '\('/.test(conditionalParser)],
  ['runtime cursor is derived from the remaining partition', /relationCount\(tokens\) - relationCount\(judgment\.evidence\.remaining\)/.test(conditionalParser)],
  ['upstream barrel exports the interface and algebra', /scannerConditionalStatementInterface/.test(barrel) && /scannerConditionalStatementAlgebra/.test(barrel)],
  ['scope limits and verification boundary are documented', /Loop, `switch`, and `try\/catch\/finally`/.test(docs) && /does not claim whole-project type-check/.test(docs)],
  ['no any introduced in new contract or algebra', !/\bany\b/.test(contract) && !/\bany\b/.test(algebra)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1455 conditional statement evidence contract: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
