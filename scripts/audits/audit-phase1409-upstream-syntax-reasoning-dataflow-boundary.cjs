const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const producer = read('packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts');
const parser = read('packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts');
const parserContract = read('packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts');
const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const astContract = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const semanticDataflowInterface = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const analysisInterface = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['syntax parsing has its own closed upstream contract', /SourceAstSyntaxParserInterface/.test(parserContract) && /SourceAstSyntaxParseContract/.test(parserContract) && /closed: true/.test(parserContract)],
  ['syntax parser owns lexical tokenization and method parsing', /LaravelSourceLexer\.tokenize/.test(parser) && /parsePhpMethod/.test(parser) && /parsePropertySyntax/.test(parser) && /parseProperties\(tokens: readonly TokenSyntax\[\]\)/.test(parserContract)],
  ['syntax parser returns typed syntax evidence without semantic capability classification', /SourceAstParsedFile/.test(parser) && /methods: Object\.freeze\(methods\)/.test(parser) && /properties: Object\.freeze\(properties\)/.test(parser)],
  ['semantic producer consumes parsed syntax rather than lexing or parsing methods itself', /sourceAstSyntaxParser\.parse\(evidence\.files\)/.test(producer) && !/LaravelSourceLexer|parsePhpMethod|parseModelPropertyAsts/.test(producer)],
  ['semantic producer retains semantic origin and expression/assignment/property production', /expressionAstsFromMethod/.test(producer) && /statementAssignments/.test(producer) && /propertyProducer\.produce/.test(producer)],
  ['syntax contract is exported from upstream type surface', upstreamBarrel.includes("export * from './sourceAstSyntaxParserInterface';")],
  ['AST dataflow aliases are owned by the canonical semantic interface', /type AstDataflowFact = SemanticDataflowFact/.test(semanticDataflowInterface) && /type AstDataflowJudgment = SemanticDataflowJudgment/.test(semanticDataflowInterface) && /semanticDataflowInterface/.test(analysisInterface)],
  ['legacy AST dataflow path is compatibility-only, not a production import', /@deprecated Compatibility-only/.test(astContract) && !/astDataflowInterface/.test(analysisInterface) && !/astDataflowInterface/.test(upstreamIndex)],
  ['runtime dataflow projection does not invoke semantic reasoning', /semanticDataflowIdentityEqual/.test(adapter) && !/createSemanticDataflowJudgment|semanticDataflowReasoningAuthority/.test(adapter)],
  ['reachability closure remains owned by upstream authority', /relationFixedPoint/.test(authority) && /reachClosure/.test(authority) && /createSemanticDataflowJudgment/.test(authority)],
  ['phase 1408 audit is wired into package scripts without changing package identity', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown' && Boolean(pkg.scripts['audit:phase1408-upstream-evidence-and-action-identity'])],
  ['phase 1409 audit is wired into package scripts', Boolean(pkg.scripts['audit:phase1409-upstream-syntax-reasoning-dataflow-boundary'])],
];
const failed = checks.filter(([, passed]) => !passed);
const report = {
  phase: 1409,
  name: 'upstream-syntax-reasoning-dataflow-boundary',
  status: failed.length ? 'failed' : 'passed_with_residuals',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  residuals: [
    'Source syntax parsing is now separated from semantic product construction, but the syntax parser still uses the existing PHP lexer and method/property parser implementations rather than a full language-neutral parser port.',
    'The semantic producer still assigns semantic origin from source-family and owner context; that reasoning should eventually be represented as a source-family capability/judgment upstream of AST projection.',
    'Other Laravel source families are still produced through their existing scanner paths and have not all been migrated onto the same evidence/parse/semantic contract pipeline.',
    'The parser runtime smoke test is blocked during module initialization by a pre-existing ReferenceError: relationRuleEntries is not defined in packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts; trace and repair that relation catalog/import boundary before claiming runtime execution.',
    'Full TypeScript build and integration tests require the repository dependency toolchain, which must be verified in the target workspace.'
  ],
  flow: 'Laravel source -> SourceAstEvidenceAcquisitionInterface -> SourceAstSyntaxParserInterface -> syntax AST -> semantic producer/reasoning -> closed AST/ADT and dataflow judgment -> wiring -> runtime executor -> manifest/graph/IR/CLI/SDK/React',
};
const output = path.join(root, 'scripts/audits/reports/phase1409-upstream-syntax-reasoning-dataflow-boundary.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
for (const check of checks) console.log(`${check[1] ? 'PASS' : 'FAIL'} ${check[0]}`);
console.log(`RESULT ${report.passed}/${report.total} ${report.status}`);
if (failed.length) process.exitCode = 1;
