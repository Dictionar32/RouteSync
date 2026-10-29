const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const scopes = [
  'packages/cli/src',
  'packages/core/src/compiler/scanner',
];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__test__' && entry.name !== 'node_modules') walk(full);
    } else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(full);
  }
}
for (const scope of scopes) walk(path.join(root, scope));
const exportedFunctions = [];
const diagnostics = [];
for (const file of files) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const diagnostic of source.parseDiagnostics) diagnostics.push({ file, diagnostic });
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      exportedFunctions.push({ file: path.relative(root, file), name: node.name.text, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const cli = fs.readFileSync(path.join(root, 'packages/cli/src/index.ts'), 'utf8');
const core = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const builder = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'), 'utf8');
const checks = [
  ['CLI entrypoint exposes typed program operation', /routeSyncCliProgram:\s*RouteSyncCliProgramInterface\s*=\s*Object\.freeze/.test(cli)],
  ['core barrel exposes canonical manifest builder ADT', /ManifestBuilderBlocker/.test(core) && /ManifestBuilderSourceAstBlocker/.test(core) && /ManifestBuilderSourceModelBlocker/.test(core)],
  ['manifest builder preserves explicit AST blocker discriminator', /manifest_builder_source_ast_blocked/.test(builder)],
  ['manifest builder preserves explicit source-model blocker discriminator', /manifest_builder_source_model_blocked/.test(builder)],
  ['TypeScript AST parser reports no syntax diagnostics in audited scopes', diagnostics.length === 0],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Scanned TypeScript files: ${files.length}`);
console.log(`Exported function declarations remaining in audited scopes: ${exportedFunctions.length}`);
for (const item of exportedFunctions.slice(0, 100)) console.log(`REMAIN ${item.file}:${item.line} export function ${item.name}`);
if (exportedFunctions.length > 100) console.log(`... ${exportedFunctions.length - 100} additional declarations omitted`);
console.log(`Phase 2761 runtime export inventory: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
