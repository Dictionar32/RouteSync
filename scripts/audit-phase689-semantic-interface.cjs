const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/generators/contract-generation/ContractActionGenerator.ts',
  'packages/core/src/compiler/generators/contract-generation/ContractSchemaMapper.ts',
  'packages/core/src/compiler/passes/FormGeneratorPass.ts',
  'packages/core/src/compiler/domain/common/ResponseFieldLowering.ts',
  'packages/core/src/compiler/domain/common/response-lowering/mapper/fieldConverter.ts',
  'packages/core/src/compiler/domain/common/response-lowering/mapper/wrapperResolver.ts',
  'packages/core/src/compiler/domain/common/SemanticTypeResolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintCalculus.ts',
  'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
];
const strip = source => source
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/[^\n]*/g, ' ')
  .replace(/'(?:\\.|[^'\\])*'/g, ' ')
  .replace(/"(?:\\.|[^"\\])*"/g, ' ')
  .replace(/`(?:\\.|[^`\\])*`/gs, ' ');
const forbidden = [
  ['as unknown', /\bas\s+unknown\b/g],
  ['??', /\?\?/g],
  ['===', /===/g],
  ['new', /\bnew\s+/g],
  ['.map(', /\.map\s*\(/g],
  ['.filter(', /\.filter\s*\(/g],
  ['.reduce(', /\.reduce\s*\(/g],
  ['.flatMap(', /\.flatMap\s*\(/g],
  ['if(', /\bif\s*\(/g],
  ['while(', /\bwhile\s*\(/g],
  ['for(', /\bfor\s*\(/g],
  ['switch(', /\bswitch\s*\(/g],
  [' Set', /\bSet\b/g],
  [' any', /\bany\b/g],
];
const diagnostics = [];
const leaks = [];
for (const rel of files) {
  const file = path.join(root, rel);
  const source = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { strict: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }, reportDiagnostics: true, fileName: file });
  for (const d of result.diagnostics || []) diagnostics.push({ file: rel, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') });
  const clean = strip(source);
  for (const [name, re] of forbidden) {
    const count = (clean.match(re) || []).length;
    if (count) leaks.push({ file: rel, construct: name, count });
  }
}
const action = fs.readFileSync(path.join(root, files[0]), 'utf8');
const schema = fs.readFileSync(path.join(root, files[1]), 'utf8');
const form = fs.readFileSync(path.join(root, files[2]), 'utf8');
const interfaceBoundary = [action, schema, form].every(s => s.includes('SemanticTypeResolverLike'));
const concreteTypeLeak = [action, schema, form].some(s => /:\s*SemanticTypeResolver\b/.test(s));
const report = { phase: 689, kind: 'semantic-interface-build-frontier', files: files.length, transpileDiagnostics: diagnostics, currentInterfaceLeaks: leaks.filter(item => !['.map(', '.reduce(', '.flatMap(', 'new', 'if(', 'for(', '==='].includes(item.construct)), remainingHostFrontier: leaks, semanticResolverPort: interfaceBoundary && !concreteTypeLeak, inactiveVacuum: 'run separately via audit-phase525-inactive-file-vacuum.cjs', status: diagnostics.length === 0 && interfaceBoundary && !concreteTypeLeak ? 'PASS' : 'FAIL' };
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === 'PASS' ? 0 : 1);
