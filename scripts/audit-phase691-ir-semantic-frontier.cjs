const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/ir/ContractIRBuilder.ts',
  'packages/core/src/types/ir/manifestIrTypes.ts',
  'packages/core/src/types/domain/base.ts',
  'packages/core/src/types/upstream/ast.ts',
  'packages/core/src/types/upstream/highLevelContracts.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/binders/SemanticResourceBinder.ts',
  'packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/manifest/routeManifestDescriptor.ts',
];
const diagnostics = [];
const legacy = [];
for (const rel of files) {
  const abs = path.join(root, rel);
  const source = fs.readFileSync(abs, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true }, reportDiagnostics: true });
  for (const d of result.diagnostics || []) diagnostics.push({ file: rel, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') });
}
const sourceFiles = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.ts') && !p.includes('__tests__')) sourceFiles.push(p);
  }
}
walk(path.join(root, 'packages/core/src'));
for (const p of sourceFiles) {
  const text = fs.readFileSync(p, 'utf8');
  if (p.endsWith('index.ts') || p.endsWith('ContractIRBuilder.ts')) continue;
  if (/OptimizedContractIRBuilder|from ['\"].*ir\/ContractIRBuilder['\"]/.test(text)) legacy.push(path.relative(root, p));
}
const builder = fs.readFileSync(path.join(root, 'packages/core/src/ir/ContractIRBuilder.ts'), 'utf8').trim();
if (builder && !/Legacy ContractIRBuilder retired/.test(builder)) diagnostics.push({ file: 'packages/core/src/ir/ContractIRBuilder.ts', message: 'legacy builder implementation is non-empty' });
if (legacy.length) diagnostics.push({ file: 'packages/core/src', message: `legacy ContractIRBuilder references: ${legacy.join(', ')}` });
const indexText = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
if (/OptimizedContractIRBuilder/.test(indexText)) diagnostics.push({ file: 'packages/core/src/index.ts', message: 'legacy builder remains publicly exported' });
const inactive = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
console.log(JSON.stringify({ phase: 691, kind: 'ir-semantic-interface-frontier', files: files.length, transpileDiagnostics: diagnostics, legacyContractBuilder: { retired: true, productionReferences: legacy }, inactive, localBuild: 'not executed: assistant workspace has no node_modules/tsup', status: diagnostics.length || !inactive.allCandidatesEmpty ? 'FAIL' : 'PASS' }, null, 2));
process.exit(diagnostics.length || !inactive.allCandidatesEmpty ? 1 : 0);
