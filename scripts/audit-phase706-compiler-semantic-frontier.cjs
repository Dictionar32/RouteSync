const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');

const read = file => fs.readFileSync(file, 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const tsFiles = walk(core).filter(file => file.endsWith('.ts'));
const productionFiles = tsFiles.filter(file => !/\.test\.ts$/.test(file) && !file.includes(`${path.sep}__archive__${path.sep}`));
const relative = file => path.relative(root, file).replaceAll(path.sep, '/');

const categories = Object.freeze({
  scannerLexer: file => file.includes(`${path.sep}compiler${path.sep}scanner${path.sep}lexer${path.sep}`),
  resolverGraph: file => file.includes(`${path.sep}compiler${path.sep}scanner${path.sep}resolvers${path.sep}`),
  upstreamMapping: file => file.includes(`${path.sep}types${path.sep}upstream${path.sep}`),
  analysis: file => file.includes(`${path.sep}compiler${path.sep}analysis${path.sep}`),
  semanticTypeLowering: file => file.includes(`${path.sep}compiler${path.sep}domain${path.sep}common${path.sep}ts-lowerer${path.sep}`),
  diagnostics: file => file.includes(`${path.sep}compiler${path.sep}diagnostics${path.sep}`),
});

const empty = () => ({ if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, null: 0, strictEquality: 0, asUnknown: 0, any: 0, new: 0 });
const add = (left, right) => Object.fromEntries(Object.keys(left).map(key => [key, left[key] + right[key]]));
const syntaxKind = (node, kind) => node.kind === kind;
const propertyName = node => node.expression && ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : '';
const syntaxMetrics = source => {
  const file = ts.createSourceFile('audit.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const result = empty();
  const visit = node => {
    if (syntaxKind(node, ts.SyntaxKind.IfStatement)) result.if++;
    if (syntaxKind(node, ts.SyntaxKind.ForStatement) || syntaxKind(node, ts.SyntaxKind.ForOfStatement) || syntaxKind(node, ts.SyntaxKind.ForInStatement)) result.for++;
    if (syntaxKind(node, ts.SyntaxKind.WhileStatement) || syntaxKind(node, ts.SyntaxKind.DoStatement)) result.while++;
    if (syntaxKind(node, ts.SyntaxKind.SwitchStatement)) result.switch++;
    if (ts.isCallExpression(node)) {
      const name = propertyName(node);
      if (name === 'map') result.map++;
      if (name === 'filter') result.filter++;
      if (name === 'reduce') result.reduce++;
      if (name === 'flatMap') result.flatMap++;
    }
    if (ts.isIdentifier(node) && node.text === 'undefined') result.undefined++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) result.any++;
    if (node.kind === ts.SyntaxKind.NullKeyword) result.null++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) result.strictEquality++;
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) result.asUnknown++;
    if (ts.isNewExpression(node)) result.new++;
    ts.forEachChild(node, visit);
  };
  visit(file);
  return result;
};

const metricsFor = files => files.reduce((state, file) => add(state, syntaxMetrics(read(file))), empty());
const categorizedMetrics = Object.fromEntries(Object.entries(categories).map(([name, predicate]) => [name, metricsFor(productionFiles.filter(predicate))]));
const totals = metricsFor(productionFiles);
const hotspots = productionFiles.map(file => ({ file: relative(file), metrics: syntaxMetrics(read(file)) }))
  .map(item => ({ ...item, score: Object.values(item.metrics).reduce((sum, value) => sum + value, 0) }))
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 30);

const emptyFiles = tsFiles.filter(file => fs.statSync(file).size === 0).map(relative).sort();
const legacyParsedFiles = ['packages/core/src/types/semantic/parsedAstTypes.ts', 'packages/core/src/types/semantic/parsedAstAlgebra.ts'];
const activeParsedReferences = tsFiles.filter(file => !file.includes(`${path.sep}__archive__${path.sep}`)).flatMap(file => {
  const source = read(file);
  return legacyParsedFiles.filter(name => source.includes(path.basename(name, '.ts'))).map(name => ({ file: relative(file), reference: name }));
}).filter(item => !legacyParsedFiles.includes(item.file));

const arrayParser = read(path.join(root, 'packages/core/src/compiler/scanner/lexer/arrayParser.ts'));
const routeAstIndex = read(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/index.ts'));
const calculus = read(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintCalculus.ts'));
const rewriteInterface = read(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteInterface.ts'));
const syntaxRelationProgram = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxRelationProgram.ts');
const astInterface = read(path.join(root, 'packages/core/src/types/upstream/astSemanticInterface.ts'));
const diagnostic = read(path.join(root, 'packages/core/src/compiler/diagnostics/Diagnostic.ts'));
const diagnosticBag = read(path.join(root, 'packages/core/src/compiler/diagnostics/DiagnosticBag.ts'));

const checks = {
  nestedArrayValueCarriesSource: /kind:\s*'nested_array'[^\n]*source:\s*sourceRange/.test(arrayParser),
  emptySyntaxRelationProgramNotExported: !routeAstIndex.includes("export * from './syntaxRelationProgram';"),
  syntaxRelationProgramIsIntentionalVacuum: fs.statSync(syntaxRelationProgram).size === 0,
  semanticRewriteRuleHasSingleAuthority: !/export\s+(?:interface|type)\s+SemanticRewriteRule/.test(calculus) && /export\s+type\s+SemanticRewriteRule/.test(rewriteInterface),
  parsedAstLegacyIsNotActive: activeParsedReferences.length === 0,
  astSemanticInterfaceClosedStages: /export type AstSemanticStage\s*=/.test(astInterface),
  astSemanticInterfaceClosedTerms: /export type AstSemanticTerm\s*=/.test(astInterface),
  astSemanticInterfaceClosedFacts: /export type AstSemanticFact\s*=/.test(astInterface),
  astSemanticInterfaceFixedPoint: /relationFixedPoint/.test(astInterface),
  astSemanticInterfaceProjection: /export type AstSemanticProjection\s*=/.test(astInterface),
  astSemanticInterfaceNoExtractCast: !/as\s+Extract</.test(astInterface),
  diagnosticClosedLocation: /type DiagnosticLocation\s*=/.test(diagnostic),
  diagnosticClosedFix: /type DiagnosticFixState\s*=/.test(diagnostic),
  diagnosticGate: /type DiagnosticGate\s*=/.test(diagnosticBag) && /evaluateGate/.test(diagnosticBag),
};

const report = {
  phase: 706,
  kind: 'compiler-semantic-frontier',
  buildBlockersFixed: checks.nestedArrayValueCarriesSource && checks.emptySyntaxRelationProgramNotExported && checks.semanticRewriteRuleHasSingleAuthority,
  checks,
  legacyParsedReferences: activeParsedReferences,
  emptyFiles,
  forbiddenConstructs: { totals, categories: categorizedMetrics },
  hotspots,
  policy: {
    target: 'declarative-semantic-relations-plus-solver-rewrite-engine',
    scannerLexer: 'active frontier; migrate syntax decisions into evidence relations and AST judgments',
    resolverGraph: 'active frontier; migrate candidate selection into relation judgments',
    upstreamMapping: 'active frontier; canonical AST semantic interface is authority',
    analysis: 'active frontier; preserve proof/derivation in judgments',
    semanticTypeLowering: 'active frontier; lower through rewrite relations',
    diagnostics: 'closed ADT plus diagnostic gate',
  },
  status: Object.values(checks).every(value => value === true) ? 'PASS' : 'FAIL',
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
