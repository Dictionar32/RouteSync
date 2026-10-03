const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/relational/sequence.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts',
  'packages/core/src/semantic/SymbolTable.ts',
  'packages/core/src/semantic/kernel/relationalSequence.ts',
  'packages/core/src/semantic/kernel/relationMembership.ts',
];
const forbidden = [
  ['host:new', /\bnew\s+[A-Za-z_$]/g], ['host:undefined', /\bundefined\b/g],
  ['host:unknown', /\bunknown\b/g], ['host:??', /\?\?/g], ['host:as-unknown', /\bas\s+unknown\b/g],
  ['host:===', /===/g], ['host:map', /\.map\s*\(/g], ['host:filter', /\.filter\s*\(/g],
  ['host:reduce', /\.reduce\s*\(/g], ['host:flatMap', /\.flatMap\s*\(/g],
  ['host:for', /\bfor\s*\(/g], ['host:while', /\bwhile\s*\(/g], ['host:switch', /\bswitch\s*\(/g],
  ['host:set', /\bSet\s*\(/g], ['host:any', /:\s*any\b/g],
];
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
const diagnostics = [], leaks = [];
for (const rel of files) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const out = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, strict: true }, reportDiagnostics: true });
  for (const d of out.diagnostics || []) diagnostics.push({ file: rel, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') });
  const clean = strip(source);
  for (const [name, re] of forbidden) { const hits = clean.match(re) || []; if (hits.length) leaks.push({ file: rel, construct: name, count: hits.length }); }
}
const kernel = fs.readFileSync(path.join(root, 'packages/core/src/semantic/kernel/relationalSequence.ts'), 'utf8');
for (const name of ['relationUnique','relationIndexAdd','relationIndexLookup','expandRelation']) {
  if (!new RegExp(`(?:export\\s+(?:const|function|type)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b)`, 's').test(kernel)) diagnostics.push({ file: 'semantic/kernel/relationalSequence.ts', message: `missing canonical export ${name}` });
}
const facade = fs.readFileSync(path.join(root, 'packages/core/src/compiler/relational/sequence.ts'), 'utf8');
if ((facade.match(/\bexpandRelation\b/g) || []).length !== 1) diagnostics.push({ file: 'compiler/relational/sequence.ts', message: 'expandRelation facade must have exactly one export occurrence' });
const model = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts'), 'utf8');
if ((model.match(/function\s+buildModelColumn\s*\(/g) || []).length !== 1) diagnostics.push({ file: 'modelDescriptorClass.ts', message: 'buildModelColumn must have exactly one canonical declaration' });
const symbol = fs.readFileSync(path.join(root, 'packages/core/src/semantic/SymbolTable.ts'), 'utf8');
for (const name of ['sequenceToRelation','createModelSymbol','createSymbolTable']) if (!new RegExp(`\\b${name}\\b`).test(symbol)) diagnostics.push({ file: 'semantic/SymbolTable.ts', message: `missing semantic boundary ${name}` });
const inactive = JSON.parse(require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
console.log(JSON.stringify({ phase: 687, kind: 'build-diagnostic-interface-trace', files: files.length, transpileDiagnostics: diagnostics, forbiddenHostLeaks: leaks, inactive, localBuild: 'blocked: assistant workspace has no node_modules/tsup', status: diagnostics.length || leaks.length || !inactive.allCandidatesEmpty ? 'FAIL' : 'PASS' }, null, 2));
process.exit(diagnostics.length || leaks.length || !inactive.allCandidatesEmpty ? 1 : 0);
