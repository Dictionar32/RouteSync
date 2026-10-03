import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname);
const bannedMethods = new Set(['map', 'filter', 'reduce', 'flatMap']);
const bannedNodes = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.SwitchStatement,
]);

const productionFiles = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const candidate = path.join(directory, entry.name);
  return entry.isDirectory()
    ? productionFiles(candidate)
    : entry.name.endsWith('.ts') && !entry.name.includes('.phase') ? [candidate] : [];
});

const violations: string[] = [];
for (const file of productionFiles(root)) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const inspect = (node: ts.Node): void => {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    if (bannedNodes.has(node.kind)) violations.push(`${path.basename(file)}:${line}:${ts.SyntaxKind[node.kind]}`);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && bannedMethods.has(node.expression.name.text)) {
      violations.push(`${path.basename(file)}:${line}:.${node.expression.name.text}()`);
    }
    ts.forEachChild(node, inspect);
  };
  inspect(sourceFile);
}

const expressionEvidence = fs.readFileSync(path.join(root, 'phpAstExpressionSyntaxEvidenceRegistry.ts'), 'utf8');
if (!expressionEvidence.includes("ternary_expression")) violations.push('ternary evidence registry missing');
if (/\bSemanticChoice\b|\bSemanticRepetition\b|\bcontrolRelations\b|\bsemanticControl\b/.test(expressionEvidence)) {
  violations.push('legacy control ontology leaked into expression evidence');
}
if (violations.length > 0) throw new Error(violations.join('\n'));
console.log('PHASE302-RELATIONAL-PRODUCTION-AUDIT-PASS');
