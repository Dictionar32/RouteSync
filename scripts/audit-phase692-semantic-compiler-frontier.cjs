const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const frontier = [
  'packages/core/src/compiler/domain/common/ZodSchemaLowerer.ts',
  'packages/core/src/compiler/domain/common/ResolvedSemanticType.ts',
  'packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts',
  'packages/core/src/compiler/scanner/binders/SemanticResourceBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/analysis/astAnalysisInterface.ts',
  'packages/core/src/compiler/diagnostics/Diagnostic.ts',
  'packages/core/src/compiler/diagnostics/DiagnosticBag.ts',
];
const diagnostics = [];
for (const rel of frontier) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true }, reportDiagnostics: true });
  for (const d of result.diagnostics || []) diagnostics.push({ file: rel, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') });
}
const zod = fs.readFileSync(path.join(root, frontier[0]), 'utf8');
const scanner = fs.readFileSync(path.join(root, frontier[2]), 'utf8');
const binder = fs.readFileSync(path.join(root, frontier[3]), 'utf8');
const legacyDescriptorRefs = [];
for (const rel of ['packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorClass.ts','packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorTypes.ts']) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8').trim();
  if (text) legacyDescriptorRefs.push({ file: rel, state: 'non_empty' });
}
const resourceSource = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/descriptors/resourceDescriptors.ts'), 'utf8');
if (/ScannedResourceDescriptor|ScannedResourceParams/.test(resourceSource)) legacyDescriptorRefs.push({ file: 'packages/core/src/compiler/scanner/descriptors/resourceDescriptors.ts', state: 'exported' });
const productionCore = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.ts') && !p.includes('__tests__')) productionCore.push(p);
  }
}
walk(path.join(root, 'packages/core/src'));
const parsedResourceRefs = productionCore.filter(p => /ParsedResource/.test(fs.readFileSync(p, 'utf8'))).map(p => path.relative(root,p));
const forbidden = ['if\\s*\\(', 'while\\s*\\(', 'for\\s*\\(', 'switch\\s*\\(', '\\.map\\s*\\(', '\\.filter\\s*\\(', '\\.reduce\\s*\\(', '\\.flatMap\\s*\\(', '\\?\\?', '===', 'as unknown', '\\bnew\\s+'];
const hotspotDirs = ['packages/core/src/compiler/scanner/lexer','packages/core/src/compiler/scanner/binders','packages/core/src/compiler/analysis','packages/core/src/compiler/domain/common'];
const leakage = {};
for (const dir of hotspotDirs) {
  const counts = Object.fromEntries(forbidden.map(p => [p, 0]));
  const files = [];
  const walkHot = d => { for (const e of fs.readdirSync(path.join(root,d), {withFileTypes:true})) { const rel=path.join(d,e.name); if(e.isDirectory()) walkHot(rel); else if(e.name.endsWith('.ts')&&!rel.includes('__tests__')) files.push(rel); } };
  walkHot(dir);
  for (const rel of files) { const t=fs.readFileSync(path.join(root,rel),'utf8'); for(const pat of forbidden) counts[pat]+= (t.match(new RegExp(pat,'g'))||[]).length; }
  leakage[dir]=counts;
}
const inactive = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
const structural = {
  zodUsesClosedCatamorphism: /matchResolvedSemanticType/.test(zod),
  scannerProducesResourceAst: /bindResourceAst\(/.test(scanner) && /Promise<readonly ResourceAst\[\]>/.test(scanner),
  semanticBinderHasNoParsedResource: !/import[^;]*ParsedResource|\):\s*ParsedResource|:\s*ParsedResource/.test(binder),
  legacyDescriptorRetired: legacyDescriptorRefs.length === 0,
  parsedResourceProductionReferences: parsedResourceRefs,
};
const pass = diagnostics.length === 0 && structural.zodUsesClosedCatamorphism && structural.scannerProducesResourceAst && structural.semanticBinderHasNoParsedResource && structural.legacyDescriptorRetired && inactive.allCandidatesEmpty;
console.log(JSON.stringify({ phase: 692, kind: 'semantic-compiler-frontier', transpileDiagnostics: diagnostics, structural, hotspotLeakage: leakage, inactive, localBuild: 'not executed: assistant workspace has no node_modules/tsup', status: pass ? 'PASS' : 'FAIL' }, null, 2));
process.exit(pass ? 0 : 1);
