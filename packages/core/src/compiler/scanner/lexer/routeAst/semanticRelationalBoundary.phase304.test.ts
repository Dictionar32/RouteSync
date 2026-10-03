import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const routeAstRoot = path.resolve(__dirname);
const parserRoot = path.resolve(__dirname, '../../../../../../cli/src/parsers/php');
const bannedMethods = new Set(['map', 'filter', 'reduce', 'flatMap']);
const bannedNodes = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.SwitchStatement,
  ts.SyntaxKind.ConditionalExpression,
]);

const productionFiles = (directory: string): readonly string[] => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const result: string[] = [];
  const visit = (index: number): void => {
    const entry = entries[index];
    if (entry === undefined) return;
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) productionFiles(candidate).forEach(file => result.push(file));
    if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('.phase') && !entry.name.includes('__tests__')) result.push(candidate);
    visit(index + 1);
  };
  visit(0);
  return Object.freeze(result);
};

const files = [...productionFiles(routeAstRoot), ...productionFiles(parserRoot)];
const violations: string[] = [];

files.forEach(file => {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const inspect = (node: ts.Node): void => {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    if (bannedNodes.has(node.kind)) violations.push(`${file}:${line}:${ts.SyntaxKind[node.kind]}`);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && bannedMethods.has(node.expression.name.text)) {
      violations.push(`${file}:${line}:.${node.expression.name.text}()`);
    }
    ts.forEachChild(node, inspect);
  };
  inspect(sourceFile);
});

if (violations.length > 0) throw new Error(violations.join('\n'));
console.log('PHASE304-PRODUCTION-AST-CLEAN');
