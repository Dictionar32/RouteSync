const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const producer = read('packages/core/src/types/upstream/controllerProducerInterface.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['existing scanner boundary advances to v62 in interface and canonical value', /readonly version: 65/.test(boundary) && /version: 65,\n  scannerOutput:/.test(boundary)],
  ['canonical parser boundary accepts one invocation judgment', /parseControllerDeclarationFromInvocationJudgment[\s\S]*?invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(parser) && /parserIntegratedResponseBoundary/.test(boundary)],
  ['legacy parser escape hatch and synthetic not-connected default are explicitly non-production contract debt', /filePath = '<php-source>'/.test(parser) && /integratedResponse: InvocationPhpSourceIntegratedResponse = Object\.freeze\(\{ kind: 'php_source_invocation_integration_not_connected'/.test(parser) && /legacyParserEntryBoundary/.test(boundary) && /not-connected-default-must-not-supply-canonical-invocation-semantics/.test(boundary)],
  ['producer contract already retains the canonical judgment without defining another response model', /invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(producer) && /forwards-the-exact-source-correlated-invocation-judgment/.test(producer) && !/InvocationSemanticJudgmentV2/.test(producer)],
  ['scanner runtime remains unchanged from Phase 1893', digest(scanner) === '841016ec8b2112e8a125ccc9a624551280502c2b052eb5a7cf9a6936240e4e2b'],
  ['parser runtime remains unchanged by this interface-only phase', digest(parser) === '03d0b8e07df6add26a10b3d914d5afd3aa0b6c8b8b1979572b5837ed83e04536'],
  ['no new judgment or inventory model is introduced', !/LaravelControllerInvocationSemanticJudgmentV2|SemanticJudgmentV2Inventory/.test(boundary + parser + producer)],
  ['audit command is registered', pkg.scripts['audit:phase1894-parser-boundary-interface-first'] === 'node scripts/audits/audit-phase1894-parser-boundary-interface-first.cjs'],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(boundary + parser + producer)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
