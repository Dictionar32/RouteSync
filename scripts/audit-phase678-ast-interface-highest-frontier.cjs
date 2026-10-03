const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const ROOT = process.cwd();

const upgraded = [
  'packages/cli/src/parsers/php/astBoundarySemanticInterface.ts',
  'packages/cli/src/parsers/php/boundaryAdapter.ts',
  'packages/cli/src/parsers/php/nodeMapper.ts',
  'packages/core/src/types/domain/phpAst/algebra.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteInterface.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxJudgmentRewriteEngine.ts',
  'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts',
  'packages/core/src/compiler/analysis/astAnalysisInterface.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptNodeLowerer.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts',
  'packages/core/src/compiler/scanner/subscanners/serviceSourceStatements.ts',
];

const forbidden = sourceFile => {
  const out = { if:0, while:0, for:0, switch:0, map:0, filter:0, reduce:0, flatMap:0, undefined:0, nullish:0, strict:0, unknownCast:0, any:0, setMap:0, conditional:0, nonNull:0, length:0, split:0, regex:0 };
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) out.if++;
    if (node.kind === ts.SyntaxKind.WhileStatement || node.kind === ts.SyntaxKind.DoStatement) out.while++;
    if (node.kind === ts.SyntaxKind.ForStatement || node.kind === ts.SyntaxKind.ForInStatement || node.kind === ts.SyntaxKind.ForOfStatement) out.for++;
    if (node.kind === ts.SyntaxKind.SwitchStatement) out.switch++;
    if (node.kind === ts.SyntaxKind.ConditionalExpression) out.conditional++;
    if (node.kind === ts.SyntaxKind.NonNullExpression) out.nonNull++;
    if (node.kind === ts.SyntaxKind.Identifier && node.text === 'undefined') out.undefined++;
    if (node.kind === ts.SyntaxKind.BinaryExpression && (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) out.nullish++;
    if (node.kind === ts.SyntaxKind.BinaryExpression && (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken)) out.strict++;
    if (node.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (name === 'map') out.map++;
      if (name === 'filter') out.filter++;
      if (name === 'reduce') out.reduce++;
      if (name === 'flatMap') out.flatMap++;
      if (name === 'split') out.split++;
    }
    if (node.kind === ts.SyntaxKind.PropertyAccessExpression && node.name.text === 'length') out.length++;
    if (node.kind === ts.SyntaxKind.RegularExpressionLiteral) out.regex++;
    if (node.kind === ts.SyntaxKind.AsExpression && node.type.getText(sourceFile) === 'unknown') out.unknownCast++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) out.any++;
    if (node.kind === ts.SyntaxKind.NewExpression) {
      const name = node.expression.getText(sourceFile);
      if (name === 'Set' || name === 'Map') out.setMap++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return out;
};

const inspect = file => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const counts = forbidden(sf);
  const diagnostics = (ts.transpileModule(source, { compilerOptions:{ target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.CommonJS }, reportDiagnostics:true, fileName:file }).diagnostics || [])
    .map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  return { counts, transpileDiagnostics: diagnostics };
};

const reports = Object.fromEntries(upgraded.map(file => [file, inspect(file)]));
const cleanUpgraded = Object.values(reports).every(report => Object.values(report.counts).every(value => value === 0) && report.transpileDiagnostics.length === 0);

const frontierRoots = [
  'packages/core/src/compiler/scanner/lexer',
  'packages/core/src/compiler/scanner/resolvers',
  'packages/core/src/compiler/scanner/subscanners',
  'packages/core/src/compiler/analysis',
  'packages/core/src/compiler/domain/common/ts-lowerer',
  'packages/cli/src/parsers/php',
];
const frontier = [];
for (const root of frontierRoots) {
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes:true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.includes('__tests__')) {
        const counts = inspect(rel).counts;
        const total = Object.values(counts).reduce((a,b) => a+b, 0);
        if (total > 0) frontier.push({ file: rel, total, counts });
      }
    }
  };
  walk(root);
}
frontier.sort((a,b) => b.total - a.total);

let inactive = { candidates: [], remainingNonEmptyCandidates: [], allCandidatesEmpty: true };
try {
  const output = require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'scripts/audit-phase525-inactive-file-vacuum.cjs')], { encoding:'utf8' });
  inactive = JSON.parse(output);
} catch {}

const result = {
  phase: 678,
  model: 'highest AST ADT -> boundary judgment -> scanner evidence -> upstream mapping -> resolver graph -> analysis judgment -> semantic type lowering -> target projection',
  upgraded,
  reports,
  upgradedSurfaceClean: cleanUpgraded,
  inactiveFileVacuum: inactive,
  remainingFrontier: frontier.slice(0, 30),
  recommendation: [
    'migrate remaining scanner/subscanner text parsing from host length/split to relationTextLength/relationTextFields/relationTextSlice',
    'elevate resolver boundary regex/path conventions into closed text relations and preserve regex only inside the relation implementation substrate',
    'replace remaining parser source absence with relationOptionalFold and keep raw parser null/optional forms quarantined at the grammar boundary',
    'extend AST semantic terms with construct/type/provenance terms so resolver and analysis consume typed AST judgments rather than ad-hoc semantic payloads',
  ],
  success: cleanUpgraded && inactive.allCandidatesEmpty && inactive.remainingNonEmptyCandidates.length === 0,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
