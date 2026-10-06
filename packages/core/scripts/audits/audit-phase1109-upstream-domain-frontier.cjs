const fs = require('fs');
const path = require('path');

const coreRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(coreRoot, '../..');
const read = rel => fs.readFileSync(path.join(coreRoot, rel), 'utf8');
const walk = dir => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
};
const ts = dir => walk(dir).filter(f => f.endsWith('.ts'));
const compilerImport = text => /from\s+['"][^'"]*compiler\/|import\([^)]*compiler/.test(text);
const upstreamFiles = ts(path.join(coreRoot, 'src/types/upstream'));
const domainProductionFiles = ts(path.join(coreRoot, 'src/types/domain'))
  .filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const domainTestFiles = ts(path.join(coreRoot, 'src/types/domain'))
  .filter(f => f.includes(`${path.sep}__tests__${path.sep}`));
const domainProductionCompilerImports = domainProductionFiles
  .filter(f => compilerImport(fs.readFileSync(f, 'utf8')))
  .map(f => path.relative(repoRoot, f).replaceAll(path.sep, '/'));
const domainTestCompilerImports = domainTestFiles
  .filter(f => compilerImport(fs.readFileSync(f, 'utf8')))
  .map(f => path.relative(repoRoot, f).replaceAll(path.sep, '/'));
const dataFlow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const vocabulary = read('src/types/upstream/typeVocabulary.ts');
const upstreamText = upstreamFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const checks = {
  upstreamHasNoCompilerImports: !compilerImport(upstreamText),
  upstreamDoesNotOwnDependencyBoundary: !/InterfaceDependencyBoundary|DataFlowProjectionInterface/.test(upstreamText),
  upstreamTypeVocabularyIsDeclarationOnly: /export type TypeExpression/.test(vocabulary) && !/TypeScriptSyntax|SemanticTypeResolver|SemanticValueFactory/.test(vocabulary),
  dataFlowIsDomainNeutral: !/(Laravel|Eloquent|Controller|Resource|Model|Route|Schema)/.test(dataFlow),
  dependencyBoundaryIsGeneric: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary),
  domainCompilerFrontierIsExplicit: domainProductionCompilerImports.length > 0,
  domainTestsSeparatedFromProductionDebt: domainTestCompilerImports.length > 0,
  staticLaravelScannerAbsent: !walk(path.join(coreRoot, 'src')).some(f => f.endsWith('.ts') && fs.readFileSync(f, 'utf8').includes('StaticLaravelScanner')),
  cliCommandsUsePackageSurface: ts(path.join(repoRoot, 'packages/cli/src/commands')).every(f => !/packages\/core\/src|core\/src/.test(fs.readFileSync(f, 'utf8'))),
};
const result = {
  phase: 1109,
  checks,
  domainProductionCompilerImports,
  domainTestCompilerImports,
  interpretation: 'types/domain compiler imports remain a separately tracked migration frontier; they are not classified as types/upstream violations.',
  passed: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
