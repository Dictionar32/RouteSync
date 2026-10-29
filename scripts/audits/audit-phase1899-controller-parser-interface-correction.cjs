const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const parser = read('packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts');
const methodParser = read('packages/core/src/compiler/frontend/php/controllerMethodParser.ts');
const bodyParser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['existing scanner ownership contract advances to v66', /readonly version: 66/.test(boundary) && /version: 66,\n  scannerOutput:/.test(boundary)],
  ['canonical judgment remains one source-identity plus integrated-response value', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['canonical parser entry derives source identity and response from the same judgment', /invocationJudgment\.sourceFile\.value\.value/.test(parser) && /invocationJudgment\.response/.test(parser)],
  ['production scanner uses the judgment-based parser entry', /parseControllerDeclarationFromInvocationJudgment\(source, tokens, createAstIdentifier\(controllerName\), invocationJudgment\)/.test(scanner)],
  ['structural consumers are identified by purpose, not mislabeled legacy parser paths', /LaravelControllerStructuralParserCallSiteDisposition/.test(boundary) && /public_parser_facade/.test(boundary) && !/LaravelControllerLegacyParser|legacyParser(?:Entry|Semantic|CallSite|AstField|Retirement)/.test(boundary)],
  ['superficial AST field inventory has been removed', !/LaravelControllerLegacyParserAstFieldInventory|LARAVEL_CONTROLLER_LEGACY_PARSER_AST_FIELD_INVENTORY|structuralParserAstFieldInventory/.test(boundary)],
  ['contract explicitly admits structural callers still trigger body analysis', /structuralParserSemanticLeakBoundary/.test(boundary) && /parseControllerMethod-into-parseControllerBody/.test(boundary) && /consumers-still-require-body-semantic-projection/.test(boundary)],
  ['no semantic foundation dependency is introduced in the touched ownership/parser contracts', !/semantic\/foundation/.test(boundary + judgment + parser + methodParser + bodyParser)],
  ['canonical invocation judgment remains the only model; no V2 copy', !/InvocationSemanticJudgmentV2/.test(boundary + judgment)],
  ['audit command is registered', pkg.scripts['audit:phase1899-controller-parser-interface-correction'] === 'node scripts/audits/audit-phase1899-controller-parser-interface-correction.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
