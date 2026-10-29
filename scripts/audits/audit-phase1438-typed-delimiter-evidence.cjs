const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const provider = read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const judgment = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const algebra = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const checks = [
  ['delimiter evidence contract returns typed partitions rather than index results', /export type PhpExpressionDelimiterEvidence = DelimitedTokenJudgment<TokenDescriptor>/.test(provider) && /DelimitedTokenEvidence<Token>[\s\S]*opening: Token[\s\S]*contents: readonly Token\[\][\s\S]*closing: Token/.test(algebra)],
  ['provider contract does not expose delimiter cursor arguments', /matchingClose: \(tokens: readonly TokenDescriptor\[\]\) => PhpExpressionDelimiterEvidence/.test(provider) && !/matchingClose: \(tokens: readonly TokenDescriptor\[\], openIndex: number\)/.test(provider)],
  ['array access consumes typed malformed and matched partition variants', /case 'malformed': return \{ kind: 'malformed_source'[\s\S]*case 'not_found': return noStructure\(\);[\s\S]*case 'matched':[\s\S]*base: evidence\.evidence\.prefix[\s\S]*index: evidence\.evidence\.contents/.test(provider)],
  ['call candidate consumes typed delimiter contents', /matchingClose\(relationSlice\(tokens, 1\)\)[\s\S]*if \(close.kind === 'malformed'\)[\s\S]*arguments: close\.evidence\.contents/.test(provider)],
  ['runtime adapters delegate to consumer-facing token structure interface', /function findOuterArrayAccessEvidence[\s\S]*scannerTokenStructureInterface\.matchTrailingDelimiter/.test(runtime)],
  ['matching-close adapter delegates to leading-delimiter interface', /function matchingCloseEvidence[\s\S]*scannerTokenStructureInterface\.matchLeadingDelimiter/.test(runtime)],
  ['upstream delimiter algebra owns matching-close and matching-open rules', /readonly findMatchingClose:[\s\S]*readonly findMatchingOpen:[\s\S]*const findMatchingClose[\s\S]*const findMatchingOpen/.test(algebra)],
  ['provider wiring supplies typed interface adapters', /findOuterArrayAccess: findOuterArrayAccessEvidence,[\s\S]*matchingClose: matchingCloseEvidence/.test(runtime)],
  ['upstream token structure algebra exposes malformed delimiter evidence', /kind: 'malformed'[\s\S]*expected\?: string[\s\S]*actual: string/.test(algebra)],
  ['closed judgment retains malformed evidence provenance', /kind: 'malformed_source'[\s\S]*ruleId: string[\s\S]*location: ExpressionEvidenceLocation<Token>[\s\S]*attempts: readonly ExpressionCandidateAttempt/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts'))],
  ['typed evidence work does not add candidate arbitration to runtime', !/scannerExpressionCandidateAlgebra\.resolveFirst/.test(runtime)],
  ['legacy sentinel helpers are no longer passed directly as provider services', !/findOuterArrayAccess: findOuterArrayAccess,/.test(runtime) && !/matchingClose: matchingClose,/.test(runtime)],
  ['compound expression still projects only a structured judgment', /case 'structured': return relationSome\(projectPhpExpressionStructure\(judgment.structure/.test(runtime)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
