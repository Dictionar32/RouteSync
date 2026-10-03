const fs = require('fs');
const ts = require('typescript');
const files = [
  'packages/core/src/semantic/plugins/ModelColumnResolver.ts',
  'packages/core/src/semantic/plugins/ResourceGraphResolver.ts',
  'packages/core/src/semantic/plugins/VariableResolver.ts',
  'packages/core/src/semantic/plugins/variable/assignmentResolver.ts',
];
const forbidden = ['if','for','while','switch','map','filter','reduce','flatMap','undefined','??','null','===','!==','as','unknown'];
const counts = Object.fromEntries(forbidden.map(k => [k, 0]));
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const text = source;
  const patterns = {
    if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
    map: /\.map\s*\(/g, filter: /\.filter\s*\(/g, reduce: /\.reduce\s*\(/g, flatMap: /\.flatMap\s*\(/g,
    undefined: /\bundefined\b/g, '??': /\?\?/g, null: /\bnull\b/g, '===': /===/g, '!==': /!==/g,
    as: /\bas\b/g, unknown: /\bunknown\b/g,
  };
  for (const [key, pattern] of Object.entries(patterns)) counts[key] += (text.match(pattern) || []).length;
  const diagnostics = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true }).diagnostics || [];
  if (diagnostics.length) throw new Error(`${file}: ${diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join('; ')}`);
  void tree;
}
console.log(JSON.stringify({ phase: 379, files: files.length, counts, transpileDiagnostics: 0 }, null, 2));
