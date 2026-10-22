const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const methodParser = read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');
const facade = read('packages/core/src/compiler/scanner/LaravelSourceLexer.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const callers = [
  'packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/middlewareAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/responseScanner.ts',
];
const checks = [
  ['canonical boundary advances to v66 in interface and value', /readonly version: 66/.test(boundary) && /version: 66,\n  scannerOutput:/.test(boundary)],
  ['contract accurately identifies structural parsing as still coupled to body analysis', /structuralParserSemanticLeakBoundary/.test(boundary) && /consumers-still-require-body-semantic-projection/.test(boundary)],
  ['contract requires exact AST field-use trace before structural projection is separated', /structuralProjectionRetirementGate/.test(boundary) && /trace-exact-AST-fields-consumed-by-each-producer/.test(boundary)],
  ['legacy parser forwards source path and response into method parsing', /parseControllerMethod\(source, tokens, index, filePath, integratedResponse\)/.test(parser)],
  ['method parser forwards both values into body parsing', /filePath,\s*integratedResponse,/.test(methodParser) && /parseControllerBody\(/.test(methodParser)],
  ['four production structural callers remain inventoried in the upstream contract', ['subscanners/attributeAstCanonical.ts', 'subscanners/providerAstCanonical.ts', 'subscanners/middlewareAstCanonical.ts', 'subscanners/responseScanner.ts'].every((file) => boundary.includes(file))],
  ['canonical parser keeps the single canonical invocation judgment', /invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(parser)],
  ['public independent-argument facade remains identified as a projection-boundary obligation', /parseControllerDeclaration: \(source: string/.test(facade) && /public_parser_facade/.test(boundary)],
  ['scanner production wiring continues to use the canonical judgment entry', /parseControllerDeclarationFromInvocationJudgment\(source, tokens, createAstIdentifier\(controllerName\), invocationJudgment\)/.test(scanner)],
  ['no parallel V2 judgment or semantic foundation is introduced', !/InvocationSemanticJudgmentV2|semantic\/foundation/.test(boundary + parser + methodParser + facade)],
  ['runtime parser, method parser, and scanner have no new boundary metadata wired into them', !/legacyParserSemanticLeakBoundary|structuralProjectionRetirementGate/.test(parser + methodParser + scanner)],
  ['audit command is registered', pkg.scripts['audit:phase1897-parser-semantic-leak-boundary-interface-first'] === 'node scripts/audits/audit-phase1897-parser-semantic-leak-boundary-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
