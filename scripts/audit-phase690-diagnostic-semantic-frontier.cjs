const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/diagnostics/Diagnostic.ts',
  'packages/core/src/compiler/diagnostics/DiagnosticBag.ts',
  'packages/core/src/compiler/artifacts/DiagnosticArtifact.ts',
  'packages/core/src/compiler/domain/common/SemanticTypeResolver.ts',
  'packages/core/src/compiler/domain/common/ResponseFieldLowering.ts',
  'packages/core/src/compiler/domain/common/response-lowering/loweringContracts.ts',
  'packages/core/src/compiler/domain/common/response-lowering/mapper/fieldConverter.ts',
  'packages/core/src/compiler/domain/common/response-lowering/mapper/wrapperResolver.ts',
  'packages/core/src/compiler/generators/contract-generation/response-field/types.ts',
  'packages/core/src/compiler/generators/contract-generation/response-field/fieldParser.ts',
  'packages/core/src/compiler/generators/contract-generation/ArraySchemaBuilder.ts',
  'packages/core/src/compiler/generators/contract-generation/NestedObjectSchemaBuilder.ts',
];
const forbidden = [
  ['host:undefined', /\bundefined\b/g], ['host:??', /\?\?/g], ['host:as-unknown', /\bas\s+unknown\b/g],
  ['host:===', /===/g], ['host:new', /\bnew\s+[A-Za-z_$]/g], ['host:map', /\.map\s*\(/g],
  ['host:filter', /\.filter\s*\(/g], ['host:reduce', /\.reduce\s*\(/g], ['host:flatMap', /\.flatMap\s*\(/g],
  ['host:for', /\bfor\s*\(/g], ['host:while', /\bwhile\s*\(/g], ['host:switch', /\bswitch\s*\(/g],
  ['host:Set', /\bSet\s*\(/g], ['host:any', /:\s*any\b/g],
];
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
const diagnostics = [], leaks = [];
for (const rel of files) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true }, reportDiagnostics: true });
  for (const d of result.diagnostics || []) diagnostics.push({ file: rel, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') });
  const clean = strip(source);
  for (const [construct, pattern] of forbidden) { const count = (clean.match(pattern) || []).length; if (count) leaks.push({ file: rel, construct, count }); }
}
const parser = path.join(root, 'packages/core/src/compiler/generators/contract-generation/ResponseFieldParser.ts');
const production = [];
function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.ts') && !p.includes('__tests__')) production.push(p); } }
walk(path.join(root, 'packages/core/src'));
const productionText = production.map(p => fs.readFileSync(p, 'utf8')).join('\n');
if (fs.readFileSync(parser, 'utf8').trim()) diagnostics.push({ file: path.relative(root, parser), message: 'legacy parser implementation is non-empty' });
if (/ResponseFieldParser/.test(productionText)) diagnostics.push({ file: 'packages/core/src', message: 'legacy parser is referenced by production source' });
if (!productionText.includes('ResponseFieldProjection')) diagnostics.push({ file: 'packages/core/src', message: 'semantic ResponseFieldProjection is absent from production source' });
const inactive = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
console.log(JSON.stringify({ phase: 690, kind: 'diagnostic-semantic-frontier', files: files.length, transpileDiagnostics: diagnostics, hostFrontier: leaks, legacyParser: { empty: !fs.readFileSync(parser, 'utf8').trim(), productionReferences: /ResponseFieldParser/.test(productionText) }, inactive, localBuild: 'not executed: assistant workspace has no node_modules/tsup', status: diagnostics.length || !inactive.allCandidatesEmpty ? 'FAIL' : 'PASS' }, null, 2));
process.exit(diagnostics.length || !inactive.allCandidatesEmpty ? 1 : 0);
