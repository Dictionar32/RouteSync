#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
);
const files = walk(path.join(root, 'packages'))
  .filter(file => file.endsWith('.ts') && !file.includes(`${path.sep}tests${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`) && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts'));
const rel = file => path.relative(root, file).replaceAll(path.sep, '/');

const legacyNames = ['ParsedAccessor', 'ParsedCast', 'ParsedRelation', 'ModelAccessorExpression', 'ModelAccessorMatchArm'];
const legacyReferences = files.flatMap(file => {
  const source = fs.readFileSync(file, 'utf8');
  return legacyNames.filter(name => new RegExp(`\\b${name}\\b`).test(source)).map(name => ({ file: rel(file), name }));
});

const changed = [
  'packages/core/src/types/upstream/modelVocabulary.ts',
  'packages/core/src/compiler/scanner/subscanners/model/modelAccessorExpressionMapper.ts',
  'packages/core/src/compiler/scanner/subscanners/model/modelAccessorCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/model/memberAccessorsParser.ts',
  'packages/core/src/types/domain/eloquentTypes.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelAccessorDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelCastDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/relationFactories.ts',
];
const transpileDiagnostics = [];
for (const file of changed) {
  const source = read(file);
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, strict: true },
    reportDiagnostics: true,
    fileName: file,
  });
  for (const diagnostic of result.diagnostics || []) {
    transpileDiagnostics.push({ file, code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\\n') });
  }
}

const vocabulary = read('packages/core/src/types/upstream/modelVocabulary.ts');
const accessorMapper = read('packages/core/src/compiler/scanner/subscanners/model/modelAccessorExpressionMapper.ts');
const accessorCanonical = read('packages/core/src/compiler/scanner/subscanners/model/modelAccessorCanonical.ts');
const eloquent = read('packages/core/src/types/domain/eloquentTypes.ts');
const routeLegacy = read('packages/core/src/compiler/scanner/descriptors/route/params/routeParameterDescriptorClass.ts');

let inactive = { allCandidatesEmpty: false };
try {
  inactive = JSON.parse(cp.execFileSync(process.execPath, [path.join(root, 'scripts/audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
} catch (error) {
  inactive = { status: 'FAIL', error: String(error.stdout || error.message) };
}

const result = {
  phase: 700,
  kind: 'semantic-model-interface-frontier',
  buildFrontier: {
    dtsBlocker: 'ModelAccessorExpression removed; ModelAccessorComputation now carries canonical upstream Expression',
    legacyProductionReferences: legacyReferences,
  },
  canonicalAccessor: {
    computationUsesUpstreamExpression: /expression:\s*import\('\.\/expression'\)\.Expression/.test(vocabulary),
    mapperProducesUpstreamExpression: /mapResourcePhpAstToUpstream/.test(accessorMapper) && /:\s*Expression/.test(accessorMapper),
    resolverPreservesExpression: /computation\.expression/.test(accessorCanonical),
    rejectedPathPreservesDiagnosticSource: /kind: 'unsupported_expression'/.test(accessorCanonical),
  },
  descriptorCutover: {
    modelAccessorDescriptor: /interface ModelAccessorDescriptor/.test(eloquent),
    modelCastDescriptor: /interface ModelCastDescriptor/.test(eloquent),
    modelRelationDescriptor: /interface ModelRelationDescriptor/.test(eloquent),
    legacyRouteParameterDescriptorEmpty: routeLegacy.length === 0,
  },
  validation: {
    transpileDiagnostics,
    inactive,
  },
};
result.status = legacyReferences.length === 0 &&
  transpileDiagnostics.length === 0 &&
  result.canonicalAccessor.computationUsesUpstreamExpression &&
  result.canonicalAccessor.mapperProducesUpstreamExpression &&
  result.canonicalAccessor.resolverPreservesExpression &&
  result.canonicalAccessor.rejectedPathPreservesDiagnosticSource &&
  result.descriptorCutover.modelAccessorDescriptor &&
  result.descriptorCutover.modelCastDescriptor &&
  result.descriptorCutover.modelRelationDescriptor &&
  result.descriptorCutover.legacyRouteParameterDescriptorEmpty &&
  inactive.allCandidatesEmpty ? 'PASS' : 'REVIEW';

console.log(JSON.stringify(result, null, 2));
