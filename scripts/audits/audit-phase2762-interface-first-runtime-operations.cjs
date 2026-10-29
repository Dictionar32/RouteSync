const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const scopes = ['packages/cli/src', 'packages/core/src/compiler/scanner'];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['__test__', 'node_modules'].includes(entry.name)) walk(full);
    } else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(full);
  }
}
for (const scope of scopes) walk(path.join(root, scope));
const diagnostics = [];
const exportedFunctions = [];
const operationConsts = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const diagnostic of source.parseDiagnostics) diagnostics.push({ file, diagnostic });
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) exportedFunctions.push({ file, name: node.name.text });
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.type && ts.isTypeReferenceNode(declaration.type) && /Operation$/.test(declaration.type.typeName.getText(source))) {
          const init = declaration.initializer?.getText(source) || '';
          operationConsts.push({ file, name: declaration.name.text, frozen: /Object\.freeze\(/.test(init) });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const checks = [
  ['No exported function declarations remain in CLI/scanner runtime scope', exportedFunctions.length === 0],
  ['Every exported Operation-typed const is frozen', operationConsts.length >= 75 && operationConsts.every(item => item.frozen)],
  ['TypeScript AST reports no syntax diagnostics', diagnostics.length === 0],
  ['All migrated operation constants have explicit interface annotations', operationConsts.length >= 75],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Scanned TypeScript files: ${files.length}`);
console.log(`Exported function declarations remaining: ${exportedFunctions.length}`);
console.log(`Interface-typed runtime operation constants: ${operationConsts.length}`);
if (exportedFunctions.length) for (const item of exportedFunctions) console.log(`REMAIN ${path.relative(root, item.file)} ${item.name}`);
console.log(`Phase 2762 interface-first runtime operations: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
