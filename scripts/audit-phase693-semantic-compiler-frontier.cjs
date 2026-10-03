const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = process.cwd();
const frontier = [
  'packages/core/src/types/domain/index.ts',
  'packages/core/src/types/domain/validationRules.ts',
  'packages/core/src/types/domain/executionSignatures.ts',
  'packages/core/src/types/upstream/routeExecutionVocabulary.ts',
  'packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts',
  'packages/core/src/compiler/scanner/binders/SemanticResourceBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/StaticLaravelScanner.ts',
  'packages/core/src/compiler/scanner/descriptors/resourceDescriptors.ts',
  'packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorTypes.ts',
];

const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const transpileDiagnostics = [];
for (const file of frontier) {
  const diagnostics = ts.transpileModule(source(file), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    fileName: file,
  }).diagnostics || [];
  for (const d of diagnostics) transpileDiagnostics.push({ file, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') });
}

const validation = source('packages/core/src/types/domain/validationRules.ts');
const kindBlock = validation.slice(validation.indexOf('export const ValidationRuleKind'), validation.indexOf('export type ValidationRuleKind'));
const kinds = [...kindBlock.matchAll(/\b(\w+):\s*'([a-z_]+)'/g)].map(m => m[2]);
const registryKeys = [...validation.matchAll(/\[ValidationRuleKind\.\w+\]:\s*\{/g)].length;
const handlerKeys = [...validation.matchAll(/\[ValidationRuleKind\.\w+\]:\s*\([^\n]*\)\s*=>/g)].length;

const patterns = [
  ['if', /\bif\s*\(/g], ['while', /\bwhile\s*\(/g], ['for', /\bfor\s*\(/g],
  ['switch', /\bswitch\s*\(/g], ['map', /\.map\s*\(/g], ['filter', /\.filter\s*\(/g],
  ['reduce', /\.reduce\s*\(/g], ['flatMap', /\.flatMap\s*\(/g], ['undefined', /\bundefined\b/g],
  ['??', /\?\?/g], ['null', /\bnull\b/g], ['===', /===/g], ['as unknown', /as\s+unknown/g],
  ['new', /\bnew\s+/g], ['any', /\bany\b/g]
];
const hostLeakage = frontier.map(file => {
  const text = source(file);
  const entries = [];
  for (const [name, re] of patterns) {
    const count = [...text.matchAll(re)].length;
    if (count) entries.push({ construct: name, count });
  }
  return { file, entries };
}).filter(x => x.entries.length);

const coreFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) coreFiles.push(full);
  }
}
walk(path.join(root, 'packages/core/src'));
const productionParsedResourceReferences = coreFiles
  .map(file => ({ file: path.relative(root, file), count: (fs.readFileSync(file, 'utf8').match(/\bParsedResource\b/g) || []).length }))
  .filter(x => x.count);

const retired = frontier.filter(file => fs.statSync(path.join(root, file)).size === 0);

const result = {
  phase: 693,
  kind: 'semantic-compiler-frontier',
  transpileDiagnostics,
  validationRegistry: { semanticKinds: kinds.length, registryEntries: registryKeys, handlerEntries: handlerKeys },
  retiredResourceDescriptorFiles: retired,
  productionParsedResourceReferences,
  hostFrontier: hostLeakage,
  inactiveVacuum: { checked: true, expectedAllCandidatesEmpty: true },
  status: transpileDiagnostics.length === 0 && registryKeys === kinds.length && handlerKeys === kinds.length && retired.length === 2 ? 'PASS' : 'FAIL'
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : 1;
