const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const executable = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const count = (source, pattern) => (source.match(pattern) || []).length;
const forbidden = source => ({
  if: count(source, /\bif\b/g), while: count(source, /\bwhile\b/g), for: count(source, /\bfor\b/g),
  switch: count(source, /\bswitch\b/g), map: count(source, /\.map\(/g), filter: count(source, /\.filter\(/g),
  reduce: count(source, /\.reduce\(/g), flatMap: count(source, /\.flatMap\(/g), undefined: count(source, /\bundefined\b/g),
  nullish: count(source, /\?\?/g), strictEqual: count(source, /===/g), strictNotEqual: count(source, /!==/g),
  asUnknown: count(source, /as\s+unknown/g), any: count(source, /\bany\b/g), new: count(source, /\bnew\s+(?:Set|Map)\b/g),
});
const files = [
  'packages/core/src/types/upstream/astSemanticInterface.ts',
  'packages/core/src/types/upstream/astSemanticStageInterface.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
];
const oldSolver = 'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts';
const source = executable(read(files[1]));
const oldImports = fs.readdirSync(core, { recursive: true })
  .filter(file => typeof file === 'string' && file.endsWith('.ts'))
  .map(file => path.join(core, file))
  .filter(file => fs.readFileSync(file, 'utf8').includes("semanticRelationSolver"));
const empty = file => exists(file) && fs.statSync(path.join(root, file)).size === 0;
const result = {
  phase: 659,
  model: 'cross-stage closed AST semantic ports plus declarative rewrite engine',
  stagePorts: ['scanner_evidence', 'upstream_mapping', 'resolver_graph', 'analysis', 'semantic_type_lowering', 'target_projection']
    .every(stage => source.includes(`'${stage}'`)),
  pipeline: ['AstSemanticPipeline', 'AstSemanticBoundary', 'createAstSemanticStagePort', 'stageFacts', 'pipelineFacts']
    .every(symbol => source.includes(symbol)),
  rewriteEngine: exists('packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts'),
  legacySolverEmpty: empty(oldSolver),
  legacySolverImports: oldImports.map(file => path.relative(root, file)),
  intentionallyInactiveFilesEmpty: [
    'packages/core/src/compiler/scanner/descriptors/validation/fieldNodes.ts',
    'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingPathBuilder.ts',
    'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingSemanticInterface.ts',
    'packages/core/src/compiler/scanner/subscanners/validationRuleChecker.ts',
  ].every(empty),
  forbiddenBoundary: Object.fromEntries(files.map(file => [file, forbidden(executable(read(file))) ])),
};
result.cleanCanonicalBoundaries = files.every(file => Object.values(result.forbiddenBoundary[file]).every(value => value === 0));
result.noLegacySolverImports = result.legacySolverImports.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.cleanCanonicalBoundaries && result.noLegacySolverImports && result.legacySolverEmpty && result.intentionallyInactiveFilesEmpty ? 0 : 1;
