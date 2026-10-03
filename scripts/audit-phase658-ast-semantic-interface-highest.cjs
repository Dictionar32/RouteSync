const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = [
  'packages/core/src/types/upstream/ast.ts',
  'packages/core/src/types/upstream/astSemanticInterface.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingSemanticInterface.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
];
const forbidden = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|any|new)\b|\?\?|===|!==|as unknown/;
const executableSource = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const counts = file => {
  const source = executableSource(read(file));
  return {
    if: (source.match(/\bif\b/g) || []).length,
    while: (source.match(/\bwhile\b/g) || []).length,
    for: (source.match(/\bfor\b/g) || []).length,
    switch: (source.match(/\bswitch\b/g) || []).length,
    map: (source.match(/\bmap\b/g) || []).length,
    filter: (source.match(/\bfilter\b/g) || []).length,
    reduce: (source.match(/\breduce\b/g) || []).length,
    flatMap: (source.match(/\bflatMap\b/g) || []).length,
    undefined: (source.match(/\bundefined\b/g) || []).length,
    nullish: (source.match(/\?\?/g) || []).length,
    strictEqual: (source.match(/===/g) || []).length,
    strictNotEqual: (source.match(/!==/g) || []).length,
    asUnknown: (source.match(/as\s+unknown/g) || []).length,
    any: (source.match(/\bany\b/g) || []).length,
    new: (source.match(/\bnew\b/g) || []).length,
  };
};
const stages = [
  'scanner_evidence',
  'upstream_mapping',
  'resolver_graph',
  'analysis',
  'semantic_type_lowering',
  'target_projection',
];
const interfaceSource = executableSource(read(files[1]));
const resourceSource = executableSource(read(files[2]));
const targetSource = executableSource(read(files[3]));
const result = {
  phase: 658,
  model: 'closed AST semantic interface algebra across scanner, upstream mapping, resolver graph, analysis, type lowering, and target projection',
  astSemanticInterface: {
    stagesClosed: stages.every(stage => interfaceSource.includes(`'${stage}'`)),
    closedFact: interfaceSource.includes("kind: 'ast_semantic_fact'"),
    closedRule: interfaceSource.includes("kind: 'ast_semantic_rule'"),
    closedDerivation: interfaceSource.includes("kind: 'ast_semantic_derivation'"),
    fixedPoint: interfaceSource.includes('relationFixedPoint'),
    projectBoundary: interfaceSource.includes("stage: 'target_projection'"),
    genericPayload: !interfaceSource.includes('Record<string, any>'),
  },
  resourceBindingBoundary: {
    judgmentAdapter: resourceSource.includes('createResourceBindingAstJudgment'),
    resolverStage: resourceSource.includes("'resolver_graph'"),
    traversalFacts: resourceSource.includes('traversalFacts'),
  },
  targetBoundary: {
    closedFact: targetSource.includes('TypeScriptSurfaceFact'),
    carriesAstSemanticFact: targetSource.includes('readonly semantic: AstSemanticFact'),
    projectionStage: targetSource.includes("'target_projection'"),
    genericSolverImport: targetSource.includes('semanticRelationSolver'),
  },
  forbiddenBoundary: Object.fromEntries(files.map(file => [file, { matches: forbidden.test(executableSource(read(file))), counts: counts(file) }])),
};
console.log(JSON.stringify(result, null, 2));
