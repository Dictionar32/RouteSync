const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const parser = read('packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts');
const methodParser = read('packages/core/src/compiler/frontend/php/controllerMethodParser.ts');
const bodyParser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['canonical scanner boundary advances to v66 in type and value', /readonly version: 66/.test(boundary) && /version: 66,\n  scannerOutput:/.test(boundary)],
  ['obsolete AST field inventory is removed rather than expanded', !/LaravelControllerLegacyParserAstFieldInventory|LARAVEL_CONTROLLER_LEGACY_PARSER_AST_FIELD_INVENTORY|legacyParserAstFieldInventory/.test(boundary)],
  ['four structural production callers remain explicitly traced', ['attributeAstCanonical.ts', 'providerAstCanonical.ts', 'middlewareAstCanonical.ts', 'responseScanner.ts'].every((file) => boundary.includes(file)) && /structuralParserCallSiteInventory/.test(boundary)],
  ['parser paths are not mislabeled legacy', !/LaravelControllerLegacyParser|legacyParser(?:Entry|Semantic|CallSite|AstField|Retirement)/.test(boundary)],
  ['independent-argument parser still forwards response into method parsing', /parseControllerMethod\(source, tokens, index, filePath, integratedResponse\)/.test(parser) && /filePath,\s*integratedResponse,/.test(methodParser)],
  ['body parser is the downstream semantic leak that must be separated before runtime migration', /analyzeControllerDataflowWithIntegratedResponse/.test(bodyParser) && /buildDataflow\(parsedBlock, parameters, parameterSemantics, filePath, integratedResponse\)/.test(bodyParser)],
  ['canonical production parser still binds source identity and response from one judgment', /invocationJudgment\.sourceFile\.value\.value/.test(parser) && /invocationJudgment\.response/.test(parser)],
  ['contract states syntax-only projection is still required before structural migration', /structuralProjectionRetirementGate/.test(boundary) && /syntax-only-AST-projection-that-does-not-run-invocation-body-analysis/.test(boundary)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(boundary + parser + methodParser + bodyParser)],
  ['audit command is registered', pkg.scripts['audit:phase1898-parser-ast-field-inventory-interface-first'] === 'node scripts/audits/audit-phase1898-parser-ast-field-inventory-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
