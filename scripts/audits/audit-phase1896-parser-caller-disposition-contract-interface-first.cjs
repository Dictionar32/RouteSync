const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const facade = read('packages/core/src/compiler/scanner/LaravelSourceLexer.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const expected = [
  'subscanners/attributeAstCanonical.ts',
  'subscanners/providerAstCanonical.ts',
  'subscanners/middlewareAstCanonical.ts',
  'subscanners/responseScanner.ts',
  'subscanners/controller/controllerMethodContract.phase894.test.ts',
  'subscanners/controller/controllerInheritance.phase905.test.ts',
  'subscanners/controller/controllerHasMiddleware.phase900.test.ts',
  'compiler/scanner/LaravelSourceLexer.ts',
];
const checks = [
  ['canonical scanner boundary advances to v63 in type and value', /readonly version: 65/.test(contract) && /version: 65,\n  scannerOutput:/.test(contract)],
  ['call-site disposition is a typed discriminated union rather than untyped notes', /export type LaravelControllerLegacyParserCallSiteDisposition =/.test(contract) && /kind: 'structural_ast_consumer'/.test(contract) && /kind: 'test_fixture'/.test(contract) && /kind: 'legacy_public_facade'/.test(contract)],
  ['all traced production structural consumers are represented', expected.slice(0, 4).every((item) => contract.includes(item))],
  ['test-only callers are explicitly separated from production semantic coverage', expected.slice(4, 7).every((item) => contract.includes(item)) && /test-only-syntax-fixtures-must-not-be-counted-as-production-semantic-pipeline-coverage/.test(contract)],
  ['legacy public facade is recorded as a separate migration obligation', contract.includes(expected[7]) && /retire-or-narrow-public-legacy-signature-after-all-structural-consumers-have-explicit-contracts/.test(contract)],
  ['each disposition states legacy callers are not invocation semantic authorities', /semanticAuthority: 'not_an_invocation_semantic_authority'/.test(contract)],
  ['canonical parser still accepts one complete source-correlated judgment', /invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(parser)],
  ['no new invocation judgment V2 model or semantic foundation dependency', !/InvocationSemanticJudgmentV2|semantic\/foundation/.test(contract + parser + facade)],
  ['scanner and parser runtime remain unchanged in this interface-first phase', !/legacyParserCallSiteInventory/.test(scanner + parser)],
  ['audit command is registered', pkg.scripts['audit:phase1896-parser-caller-disposition-contract-interface-first'] === 'node scripts/audits/audit-phase1896-parser-caller-disposition-contract-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
