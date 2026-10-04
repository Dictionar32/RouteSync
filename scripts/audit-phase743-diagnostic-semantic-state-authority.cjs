const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const state = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticStateDataFlow.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const contract = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const sourceFiles = [state, analyzer, contract, canonical];
const forbidden = /\b(?:if|while|for|switch|undefined|unknown|any|new)\b|\?\?|\bnull\b|===|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.flatMap\s*\(/;
const legacy = /\.dataflow\.(?:definitions|references)|LegacyController|ControllerDataflowReference|ControllerVariableDefinitionOrigin|LegacyControllerDefinitionAvailability/;
const emptyUnused = [
  'packages/core/src/compiler/analysis/legacyFlow.ts',
  'packages/core/src/compiler/contracts.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParserHelpers.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxRelationProgram.ts',
  'packages/core/src/compiler/scanner/scannerLegacyDelegates.ts',
  'packages/core/src/types/domain/resourceAggregateResolver.ts',
  'packages/core/src/types/domain/resourceCollectionGroupModel.ts',
  'packages/core/src/types/domain/resourceCollectionMethodSurface.ts',
  'packages/core/src/types/domain/resourceCollectionSurfaceResolver.ts',
  'packages/core/src/types/domain/resourceEloquentFlow.ts',
  'packages/core/src/types/domain/resourceGroups.ts',
];
const result = {
  phase: 743,
  diagnostic: {
    reportedDtsSymbols: ['SemanticAccessMember', 'SemanticPresence'],
    semanticStateImportsCanonicalSymbols: /SemanticAccessMember/.test(state) && /SemanticPresence/.test(state),
  },
  controllerAuthority: {
    noLegacyDataflowFields: sourceFiles.every(file => !legacy.test(file)),
    canonicalContractPresent: /semanticVariables/.test(contract),
    canonicalConsumerPresent: /semanticVariables/.test(canonical),
  },
  semanticStateSurface: {
    noForbiddenHostConstructs: !forbidden.test(state),
    noHostCasts: !/\bas\s+(?:const|unknown|any)\b/.test(state),
    usesTypedRelations: /typedSelect/.test(state) && /typedProject/.test(state) && /typedExpand/.test(state),
    usesCanonicalSemanticFacts: /SemanticFact/.test(state) && /SemanticKnowledgeDataFlow/.test(state),
  },
  provenEmptyUnusedSurfaces: Object.fromEntries(emptyUnused.map(file => [file, fs.statSync(path.join(root, file)).size === 0])),
};
result.failed = Object.entries(result).flatMap(([group, values]) => typeof values === 'object' && values ? Object.entries(values).filter(([, value]) => value === false).map(([name]) => `${group}.${name}`) : []);
result.pass = result.failed.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
