const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const productionFiles = (() => {
  const files = [];
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach(entry => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__tests__' && !entry.name.includes('test')) return walk(rel);
    if (entry.isFile() && rel.endsWith('.ts') && !rel.endsWith('.test.ts')) files.push(rel);
  });
  walk('packages/core/src');
  walk('packages/cli/src');
  return files;
})();

const productionText = productionFiles.map(read).join('\n');
const parsedDescriptorLeak = /\bParsed[A-Za-z0-9_]*Descriptor\b|\bparsedDescriptor\b/.test(productionText);
const legacyParsedAstReservoirs = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];
const canonicalAst = read('packages/core/src/types/upstream/ast.ts');
const stageInterface = read('packages/core/src/types/upstream/astSemanticStageInterface.ts');
const forbidden = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|any)\b|\?\?|===|!==|as\s+unknown/;
const executable = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'[^'\n]*'|\"[^\"\n]*\"|`[^`\n]*`/g, '');

const targeted = [
  'packages/core/src/types/upstream/ast.ts',
  'packages/core/src/types/upstream/astSemanticInterface.ts',
  'packages/core/src/types/upstream/astSemanticStageInterface.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
  'packages/cli/src/parsers/php/boundaryAdapter.ts',
];

const tsc = spawnSync('tsc', [
  '--noEmit', '--pretty', 'false', '--target', 'ES2020', '--module', 'ESNext',
  '--moduleResolution', 'Bundler', '--skipLibCheck', '--typeRoots', '/tmp/empty-types',
  ...targeted.slice(0, 3),
], { cwd: root, encoding: 'utf8' });
const compilerDiagnostics = `${tsc.stdout || ''}${tsc.stderr || ''}`.trim();

const report = {
  phase: 756,
  model: 'highest AST authority + diagnostic frontier + parsed-descriptor vacuum',
  diagnostics: {
    targetedAstCompilerExit: tsc.status === 0,
    targetedAstCompilerDiagnostics: compilerDiagnostics,
    workspaceBuildBlockedByDependencies: !fs.existsSync(path.join(root, 'node_modules/.bin/tsup')),
  },
  parsedDescriptorAuthority: {
    productionLeak: parsedDescriptorLeak,
    legacyParsedAstReservoirsEmpty: legacyParsedAstReservoirs.every(file => size(file) === 0),
    legacyParsedAstReservoirs: legacyParsedAstReservoirs.map(file => ({ file, bytes: size(file) })),
  },
  astAuthority: {
    registry: canonicalAst.includes('export type AstJudgmentRegistry = {'),
    closedJudgment: canonicalAst.includes('export type AstJudgment = AstJudgmentRegistry[AstSemanticSchemaKind];'),
    semanticProjection: canonicalAst.includes('SemanticAstNode<Kind extends AstSemanticSchemaKind> = AstJudgmentContract<Kind>'),
    canonicalProjection: canonicalAst.includes('CanonicalAstNode<Kind extends AstSemanticSchemaKind> = AstJudgmentContract<Kind>'),
    crossStageClosed: stageInterface.includes("'scanner_evidence'") && stageInterface.includes("'upstream_mapping'") && stageInterface.includes("'resolver_graph'") && stageInterface.includes("'analysis'") && stageInterface.includes("'semantic_type_lowering'") && stageInterface.includes("'target_projection'"),
    stageFactConstructors: ['scannerEvidenceFact','upstreamMappingFact','resolverGraphFact','analysisFact','semanticTypeLoweringFact','targetProjectionFact'].every(name => stageInterface.includes(`export { scannerStageFact as ${name}`) || stageInterface.includes(`const ${name}`)),
  },
  forbiddenBoundary: Object.fromEntries(targeted.map(file => [file, { matches: forbidden.test(executable(read(file))) }])),
};
report.pass = report.diagnostics.targetedAstCompilerExit
  && !report.parsedDescriptorAuthority.productionLeak
  && report.parsedDescriptorAuthority.legacyParsedAstReservoirsEmpty
  && report.astAuthority.registry
  && report.astAuthority.closedJudgment
  && report.astAuthority.semanticProjection
  && report.astAuthority.canonicalProjection
  && report.astAuthority.crossStageClosed
  && report.astAuthority.stageFactConstructors;
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
