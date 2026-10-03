const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const forbidden = /\b(if|while|for|switch|map|filter|reduce|flatMap|undefined|any|new)\b|\?\?|\bnull\b|===|!==|as unknown/g;
const boundaries = [
  'packages/core/src/types/upstream/astSemanticInterface.ts',
  'packages/core/src/types/upstream/astSemanticStageInterface.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxJudgmentRewriteEngine.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
];
const inactive = [
  'packages/core/src/semantic/kernel/requirementSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingPathBuilder.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingSemanticInterface.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingTraversalBuilder.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingOriginResolver.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceBindingProvenanceBuilder.ts',
  'packages/core/src/compiler/scanner/subscanners/validationArrayPropLowerer.ts',
  'packages/core/src/compiler/scanner/lexer/phpLexicalSymbols.ts',
  'packages/core/src/compiler/scanner/descriptors/manifestDescriptors.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerErrorDetector.ts',
  'packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts',
  'packages/core/src/compiler/scanner/subscanners/form-request/fieldAssembler.ts',
  'packages/core/src/compiler/scanner/descriptors/channel/channelDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/validation/schemaPayload.ts',
  'packages/core/src/compiler/scanner/descriptors/route/routeSecurity.ts',
  'packages/core/src/compiler/scanner/descriptors/route/ScannedRouteDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/route/routePropertyAssigner.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/modelEntityFactory.ts',
  'packages/core/src/compiler/domain/common/ManifestArtifactLowerer.ts',
  'packages/core/src/compiler/generators/mapper-generation/MapperCodeBuilder.ts',
];
const source = read('packages/core/src/types/upstream/astSemanticStageInterface.ts');
const stages = [
  'scanner_evidence_fact',
  'upstream_mapping_fact',
  'resolver_graph_fact',
  'analysis_fact',
  'semantic_type_lowering_fact',
  'target_projection_fact',
];
const stagePorts = [
  'createScannerEvidencePort',
  'createUpstreamMappingPort',
  'createResolverGraphPort',
  'createAnalysisPort',
  'createSemanticTypeLoweringPort',
  'createTargetProjectionPort',
];
const canonicalForbidden = Object.fromEntries(boundaries.map(file => [file, [...read(file).matchAll(forbidden)].length]));
const result = {
  phase: 660,
  model: 'closed stage-specific AST semantic ADTs plus declarative rewrite interfaces',
  stageFacts: stages.every(name => source.includes(name)),
  stagePorts: stagePorts.every(name => source.includes(name)),
  decisionRewriteEngine: size('packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts') > 0,
  legacySolverEmpty: size('packages/core/src/semantic/kernel/requirementSolver.ts') === 0,
  legacyRouteSolverEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts') === 0,
  legacySyntaxCoreEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts') === 0,
  inactiveVacuum: inactive.every(file => size(file) === 0),
  noLegacySolverImports: !read('packages/core/src/semantic/kernel/index.ts').includes("requirementSolver"),
  canonicalForbidden,
};
result.cleanCanonicalBoundaries = Object.values(canonicalForbidden).every(count => count === 0);
result.success = Object.values(result).every(value => typeof value !== 'boolean' || value) && result.cleanCanonicalBoundaries;
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
