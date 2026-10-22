const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const facade = read('packages/core/src/compiler/scanner/LaravelSourceLexer.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const callsites = [
  'packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/middlewareAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/responseScanner.ts',
].map(read).join('\n');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['existing canonical scanner boundary advances to v62 in interface and value', /readonly version: 65/.test(boundary) && /version: 65,\n  scannerOutput:/.test(boundary)],
  ['one existing invocation judgment remains the only canonical semantic model', /canonicalInvocationJudgmentModel/.test(boundary) && !/InvocationSemanticJudgmentV2/.test(boundary + parser + facade)],
  ['canonical parser entry takes a whole source-correlated judgment', /invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(parser) && /parseControllerDeclarationFromInvocationJudgment/.test(facade)],
  ['legacy entry is explicitly structural-only and cannot supply canonical invocation semantics', /parserEntryOwnership/.test(boundary) && /legacyParserCallSiteDisposition/.test(boundary) && /not-connected-default-must-not-supply-canonical-invocation-semantics/.test(boundary)],
  ['actual structural subscanner call sites are inventoried rather than misrepresented as canonical scanner path', /parseControllerDeclaration\(/.test(callsites) && /legacyParserCallSiteDisposition/.test(boundary)],
  ['retirement is gated on call-site contracts, not performed in this interface-only phase', /legacyParserRetirementGate/.test(boundary) && /no-runtime-change-is-authorized/.test(boundary)],
  ['controller scanner runtime remains unchanged from Phase 1894', digest(scanner) === '841016ec8b2112e8a125ccc9a624551280502c2b052eb5a7cf9a6936240e4e2b'],
  ['parser runtime remains unchanged from Phase 1894', digest(parser) === '03d0b8e07df6add26a10b3d914d5afd3aa0b6c8b8b1979572b5837ed83e04536'],
  ['no parallel judgment or integrated-response model is introduced', !/LaravelControllerInvocationSemanticJudgmentV2|SemanticJudgmentV2Inventory/.test(boundary + parser + facade)],
  ['audit command is registered', pkg.scripts['audit:phase1895-parser-callsite-contract-closure-interface-first'] === 'node scripts/audits/audit-phase1895-parser-callsite-contract-closure-interface-first.cjs'],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(boundary + parser + facade)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
