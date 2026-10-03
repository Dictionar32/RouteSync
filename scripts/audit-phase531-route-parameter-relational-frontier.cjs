const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const targets = [
  'packages/core/src/compiler/scanner/descriptors/route/params/routeParameterDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/route/params/types.ts',
].map(file => path.join(process.cwd(), file));
const checks = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\bmap\b/g,
  filter: /\bfilter\b/g,
  reduce: /\breduce\b/g,
  flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  null: /\bnull\b/g,
  strictEquality: /===/g,
  asUnknown: /as\s+unknown/g,
  or: /\|\|/g,
  and: /&&/g,
  trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g,
  never: /\bnever\b/g,
  indexPlus123: /index\s*\+\s*123/g,
  ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};
const results = targets.map(target => {
  const source = fs.readFileSync(target, 'utf8');
  const counts = Object.fromEntries(Object.entries(checks).map(([name, regex]) => [name, (source.match(regex) || []).length]));
  const transpiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, fileName: target, reportDiagnostics: true });
  const diagnostics = transpiled.diagnostics || [];
  return { target: path.relative(process.cwd(), target), counts, transpileDiagnostics: diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), closedSurfaceClean: Object.values(counts).every(count => count === 0), transpileDiagnosticsClean: diagnostics.length === 0 };
});
const ok = results.every(result => result.closedSurfaceClean && result.transpileDiagnosticsClean);
console.log(JSON.stringify({ phase: 531, results, ok, architecture: 'route evidence -> semantic option relation -> binding/type witness -> canonical route parameter -> solver/rewrite authority' }, null, 2));
process.exitCode = ok ? 0 : 1;
