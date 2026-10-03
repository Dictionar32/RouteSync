#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(path.join(root, 'packages')).filter(f => f.endsWith('.ts') && !/(__tests__|__test__|\.test\.|\.spec\.)/.test(f));
const rel = f => path.relative(root, f).replaceAll(path.sep, '/');
const production = files.map(f => ({ file: rel(f), source: fs.readFileSync(f, 'utf8') }));
const sourceText = production.map(x => x.source).join('\n');
const symbolReferences = names => production.flatMap(x => names.filter(n => new RegExp(`\\b${n}\\b`).test(x.source)).map(n => ({ file: x.file, name: n })));
const eloquent = read('packages/core/src/types/domain/eloquentTypes.ts');
const vocabulary = read('packages/core/src/types/upstream/modelVocabulary.ts');
const mapper = read('packages/core/src/compiler/scanner/subscanners/model/modelAccessorExpressionMapper.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/model/modelAccessorCanonical.ts');
const legacyAccessor = read('packages/core/src/compiler/scanner/descriptors/model/modelAccessorDescriptor.ts');
const descriptorBarrel = read('packages/core/src/compiler/scanner/descriptors/index.ts');
const compilerBarrel = read('packages/core/src/compiler/index.ts');
const publicBarrel = read('packages/core/src/index.ts');
const legacyAccessorReferences = symbolReferences(['ScannedModelAccessorDescriptor','ScannedModelAccessorParams','createScannedAccessor','ModelAccessorExpression','ModelAccessorMatchArm']);
const transpileDiagnostics = [];
for (const file of [
  'packages/core/src/types/domain/eloquentTypes.ts',
  'packages/core/src/types/upstream/modelVocabulary.ts',
  'packages/core/src/compiler/scanner/subscanners/model/modelAccessorExpressionMapper.ts',
  'packages/core/src/compiler/scanner/subscanners/model/modelAccessorCanonical.ts',
  'packages/core/src/compiler/scanner/descriptors/modelDescriptors.ts',
]) {
  const result = ts.transpileModule(read(file), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, strict: true }, reportDiagnostics: true, fileName: file });
  for (const d of result.diagnostics || []) transpileDiagnostics.push({ file, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') });
}
let inactive;
try {
  inactive = JSON.parse(cp.execFileSync(process.execPath, [path.join(root,'scripts/audit-phase525-inactive-file-vacuum.cjs')], {cwd: root, encoding:'utf8'}));
} catch (e) {
  inactive = { status:'FAIL', error:String(e.stdout || e.message) };
}
const forbiddenLegacyExports = [descriptorBarrel, compilerBarrel, publicBarrel].some(s => /ScannedModelAccessorDescriptor|ScannedModelAccessorParams/.test(s));
const hostSyntax = {
  if: (sourceText.match(/\bif\s*\(/g)||[]).length,
  while: (sourceText.match(/\bwhile\s*\(/g)||[]).length,
  for: (sourceText.match(/\bfor\s*\(/g)||[]).length,
  switch: (sourceText.match(/\bswitch\s*\(/g)||[]).length,
  map: (sourceText.match(/\.map\s*\(/g)||[]).length,
  filter: (sourceText.match(/\.filter\s*\(/g)||[]).length,
  reduce: (sourceText.match(/\.reduce\s*\(/g)||[]).length,
  flatMap: (sourceText.match(/\.flatMap\s*\(/g)||[]).length,
  undefined: (sourceText.match(/\bundefined\b/g)||[]).length,
  nullishCoalesce: (sourceText.match(/\?\?/g)||[]).length,
  strictEquality: (sourceText.match(/===|!==/g)||[]).length,
  unknownAssertion: (sourceText.match(/as\s+unknown\b/g)||[]).length,
  anyType: (sourceText.match(/:\s*any\b|<any>/g)||[]).length,
  newExpression: (sourceText.match(/\bnew\s+[A-Za-z_$]/g)||[]).length,
};
const result = {
  phase: 701,
  kind: 'semantic-interface-diagnostic-trace',
  dtsFrontier: { modelAccessorComputationBinding: /readonly computation:\s*ModelAccessorComputation/.test(eloquent), canonicalExpression: /expression:\s*import\('\.\/expression'\)\.Expression/.test(vocabulary) },
  accessorCutover: {
    mapperReturnsCanonicalExpression: /:\s*Expression/.test(mapper) && /mapResourcePhpAstToUpstream/.test(mapper),
    canonicalResolverPreservesExpression: /computation\.expression/.test(canonical),
    legacyAccessorDescriptorEmpty: legacyAccessor.length === 0,
    legacyAccessorReferences,
    forbiddenLegacyExports,
  },
  validation: { transpileDiagnostics, inactive },
  hostSyntaxFrontier: hostSyntax,
};
result.status = result.dtsFrontier.modelAccessorComputationBinding &&
  result.dtsFrontier.canonicalExpression &&
  result.accessorCutover.mapperReturnsCanonicalExpression &&
  result.accessorCutover.canonicalResolverPreservesExpression &&
  result.accessorCutover.legacyAccessorDescriptorEmpty &&
  result.accessorCutover.legacyAccessorReferences.length === 0 &&
  !result.accessorCutover.forbiddenLegacyExports &&
  transpileDiagnostics.length === 0 &&
  inactive.allCandidatesEmpty ? 'PASS' : 'REVIEW';
console.log(JSON.stringify(result, null, 2));
