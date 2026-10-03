const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const size = rel => fs.statSync(path.join(root, rel)).size;

const compilerIndex = read('packages/core/src/compiler/index.ts');
const queryIndex = read('packages/core/src/compiler/query/index.ts');
const diagnostic = read('packages/core/src/compiler/diagnostics/Diagnostic.ts');
const diagnosticBag = read('packages/core/src/compiler/diagnostics/DiagnosticBag.ts');
const eloquent = read('packages/core/src/types/domain/eloquentTypes.ts');
const model = read('packages/core/src/types/upstream/model.ts');
const modelParser = read('packages/core/src/compiler/scanner/subscanners/model/modelParser.ts');
const modelBuilder = read('packages/core/src/compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts');
const modelNodes = read('packages/core/src/semantic/modelNodes.ts');
const domainModels = read('packages/core/src/types/domain/models.ts');

const legacyDescriptorFiles = [
  'packages/core/src/compiler/scanner/descriptors/model/modelAccessorDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelCastDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelColumnDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelRelationDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/index.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/relationFactories.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/types.ts',
];

const sourceFiles = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.ts')) sourceFiles.push(full);
  }
};
walk(path.join(root, 'packages'));
const productionFiles = sourceFiles.filter(p => !p.includes('__tests__') && !p.includes('/tests/'));
const production = productionFiles.map(p => fs.readFileSync(p, 'utf8')).join('\n');

const legacyNames = [
  'ModelCastDescriptor',
  'ModelAccessorDescriptor',
  'ModelRelationDescriptor',
  'ScannedModelAccessorDescriptor',
  'ScannedModelCastDescriptor',
  'ScannedModelColumnDescriptor',
  'ScannedModelRelationDescriptor',
  'ModelAccessorExpression',
  'ModelAccessorMatchArm',
];
const productionLegacyReferences = productionFiles.flatMap(file => {
  const text = fs.readFileSync(file, 'utf8');
  return legacyNames.filter(name => new RegExp(`\\b${name}\\b`).test(text))
    .map(name => `${path.relative(root, file)}:${name}`);
});

const layerDirs = {
  scanner_lexer: 'packages/core/src/compiler/scanner',
  resolver_graph: 'packages/core/src/semantic',
  ast_upstream: 'packages/core/src/types/upstream',
  analysis: 'packages/core/src/compiler/analysis',
  semantic_type_lowering: 'packages/core/src/types',
  diagnostic: 'packages/core/src/compiler/diagnostics',
};
const patterns = {
  if: /\bif\s*\(/g,
  while: /\bwhile\s*\(/g,
  for: /\bfor\s*\(/g,
  switch: /\bswitch\s*\(/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefined: /\bundefined\b/g,
  '??': /\?\?/g,
  null: /\bnull\b/g,
  '===/!==': /===|!==/g,
  'as unknown': /\bas\s+unknown\b/g,
  any: /\bany\b/g,
  new: /\bnew\s+/g,
  set: /\b(set|add)\s*\(/g,
  optional: /\?\s*:/g,
};
const inventory = {};
for (const [layer, rel] of Object.entries(layerDirs)) {
  const files = [];
  const base = path.join(root, rel);
  if (exists(rel)) {
    const collect = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(full);
        else if (entry.isFile() && full.endsWith('.ts') && !full.includes('__tests__') && !full.includes('/tests/')) files.push(full);
      }
    };
    collect(base);
  }
  const text = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
  inventory[layer] = { files: files.length };
  for (const [name, re] of Object.entries(patterns)) inventory[layer][name] = (text.match(re) || []).length;
}

const compilerBarrelClean = [
  'SourceLocation', 'ImmutableList', 'FileSnapshot', 'VirtualFileSystem', 'FileSpan'
].every(name => !new RegExp(`\\b${name}\\b`).test(compilerIndex));
const queryCycleExported = /createQueryCycleError/.test(queryIndex);
const diagnosticADT = /type DiagnosticLocation\s*=/.test(diagnostic)
  && /type DiagnosticFixState\s*=/.test(diagnostic)
  && /type DiagnosticGate\s*=/.test(diagnosticBag)
  && /evaluateGate/.test(diagnosticBag);
const canonicalModelSurface = /export type ModelSemanticRelation/.test(model)
  && /export type ModelSemanticDefinition/.test(model)
  && /ModelSemanticRelation/.test(modelNodes)
  && /ModelCastFact/.test(domainModels)
  && /buildModelSemanticDefinition/.test(modelBuilder)
  && /buildModelSemanticDefinition/.test(modelParser);

const result = {
  phase: 704,
  kind: 'semantic-interface-build-frontier-diagnostic-trace',
  dtsFrontier: {
    staleCompilerBarrelExportsRemoved: compilerBarrelClean,
    createQueryCycleErrorExported: queryCycleExported,
    compilerIndexNoLegacyDiagnosticLocationExport: compilerBarrelClean,
  },
  diagnostic: {
    closedLocationADT: /DiagnosticLocation/.test(diagnostic),
    closedFixADT: /DiagnosticFixState/.test(diagnostic),
    gateADT: /DiagnosticGate/.test(diagnosticBag),
    gateEvaluation: /evaluateGate/.test(diagnosticBag),
  },
  modelDescriptorCutover: {
    canonicalSemanticRelation: /export type ModelSemanticRelation/.test(model),
    canonicalSemanticAccessor: /export type ModelSemanticAccessor/.test(model),
    canonicalCastFact: /export type ModelCastFact/.test(read('packages/core/src/types/upstream/modelSourceFacts.ts')),
    canonicalBuilder: /buildModelSemanticDefinition/.test(modelBuilder),
    parserTargetsCanonicalBuilder: /buildModelSemanticDefinition/.test(modelParser),
    domainUsesCanonicalCastFact: /ModelCastFact/.test(domainModels),
    semanticBoundaryUsesCanonicalRelation: /ModelSemanticRelation/.test(modelNodes),
    legacyDescriptorFilesEmpty: legacyDescriptorFiles.every(exists) && legacyDescriptorFiles.every(file => size(file) === 0),
    productionLegacyReferences,
  },
  layerInventory: inventory,
  status: compilerBarrelClean
    && queryCycleExported
    && diagnosticADT
    && canonicalModelSurface
    && legacyDescriptorFiles.every(file => size(file) === 0)
    && productionLegacyReferences.length === 0
    ? 'PASS' : 'FAIL',
};

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : 1;
