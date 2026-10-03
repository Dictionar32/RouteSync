const fs = require('fs');
const ts = require('typescript');

const targets = [
  'packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts',
  'packages/core/src/compiler/scanner/subscanners/scannerUtils.ts',
];

function auditFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const counts = {
    if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0,
    reduce: 0, flatMap: 0, undefined: 0, null: 0, never: 0,
    strictEqual: 0, logicalOr: 0, logicalAnd: 0, asUnknown: 0,
    trim: 0, slice: 0, index123: 0, ternary: 0,
  };
  const visit = node => {
    switch (node.kind) {
      case ts.SyntaxKind.IfStatement: counts.if++; break;
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement: counts.for++; break;
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement: counts.while++; break;
      case ts.SyntaxKind.SwitchStatement: counts.switch++; break;
      case ts.SyntaxKind.ConditionalExpression: counts.ternary++; break;
      case ts.SyntaxKind.BinaryExpression: {
        const op = node.operatorToken.kind;
        if (op === ts.SyntaxKind.EqualsEqualsEqualsToken) counts.strictEqual++;
        if (op === ts.SyntaxKind.BarBarToken) counts.logicalOr++;
        if (op === ts.SyntaxKind.AmpersandAmpersandToken) counts.logicalAnd++;
        break;
      }
      case ts.SyntaxKind.AsExpression:
        if (node.type.kind === ts.SyntaxKind.UnknownKeyword) counts.asUnknown++;
        break;
      case ts.SyntaxKind.Identifier:
        if (node.text === 'undefined') counts.undefined++;
        if (node.text === 'never') counts.never++;
        break;
      case ts.SyntaxKind.NullKeyword: counts.null++; break;
      case ts.SyntaxKind.PropertyAccessExpression: {
        const name = node.name.text;
        if (name === 'map') counts.map++;
        if (name === 'filter') counts.filter++;
        if (name === 'reduce' || name === 'reduceRight') counts.reduce++;
        if (name === 'flatMap') counts.flatMap++;
        if (name === 'trim') counts.trim++;
        if (name === 'slice') counts.slice++;
        break;
      }
      case ts.SyntaxKind.ElementAccessExpression: {
        const text = node.argumentExpression.getText(sf);
        if (/\+\s*123/.test(text)) counts.index123++;
        break;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  const diagnostics = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  }).diagnostics || [];
  return {
    file,
    counts,
    transpileDiagnostics: diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')),
  };
}

const results = targets.map(auditFile);
const closedSurfaceClean = results.every(r => Object.values(r.counts).every(v => v === 0));
const transpileDiagnosticsClean = results.every(r => r.transpileDiagnostics.length === 0);
console.log(JSON.stringify({ results, closedSurfaceClean, transpileDiagnosticsClean, ok: closedSurfaceClean && transpileDiagnosticsClean }, null, 2));
process.exitCode = closedSurfaceClean && transpileDiagnosticsClean ? 0 : 1;
