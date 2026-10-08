const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const candidates = [
  "packages/cli/src/generators/canonical-names.ts",
  "packages/cli/src/generators/canonical/actionMap.ts",
  "packages/cli/src/generators/canonical/namingConventions.ts",
  "packages/cli/src/generators/canonical/typeMapping.ts",
  "packages/cli/src/generators/classifier/pathClassifier.ts",
  "packages/cli/src/generators/writer/fileFormatters.ts",
  "packages/cli/src/generators/writer/summaryPrinter.ts",
  "packages/cli/src/resolvers/IntentResolver.ts",
  "packages/cli/src/resolvers/intent/cartGroupDetector.ts",
  "packages/cli/src/resolvers/intent/cartModelResolver.ts",
  "packages/cli/src/utils/incremental/cacheLoader.ts",
  "packages/core/src/compiler/analysis/legacyFlow.ts",
  "packages/core/src/compiler/emitters/ContractEmitter.ts",
  "packages/core/src/compiler/emitters/TypeScriptEmitter.ts",
  "packages/core/src/compiler/emitters/typescript/printers/declarationPrinter.ts",
  "packages/core/src/compiler/emitters/typescript/printers/typePrinter.ts",
  "packages/core/src/compiler/formatting/Formatter.ts",
  "packages/core/src/compiler/formatting/TypeScriptFormatter.ts",
  "packages/core/src/compiler/formatting/steps/importSorter.ts",
  "packages/core/src/compiler/formatting/steps/indentationApplier.ts",
  "packages/core/src/compiler/formatting/steps/syntaxNormalizer.ts",
  "packages/core/src/compiler/formatting/typescript/ast-format/declarationSorter.ts",
  "packages/core/src/compiler/formatting/typescript/ast-format/importSorter.ts",
  "packages/core/src/compiler/formatting/typescript/ast-format/types.ts",
  "packages/core/src/compiler/query/database/types.ts",
  "packages/core/src/compiler/scanner/descriptors/route/routeMethods.ts",
  "packages/core/src/compiler/scanner/descriptors/route/routeSemanticFactories.ts",
  "packages/core/src/compiler/scanner/resolvers/RouteBoundaryAdapter.ts",
  "packages/core/src/compiler/scanner/scannerLegacyDelegates.ts",
  "packages/core/src/compiler/scanner/upstream/routeManifestLowerer.ts",
  "packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts",
  "packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts",
  "packages/core/src/compiler/target/typescript/visitor/TSBaseVisitor.ts",
  "packages/core/src/compiler/target/typescript/visitor/visitorUtils.ts",
  "packages/core/src/compiler/templates/Template.ts",
  "packages/core/src/compiler/templates/TemplateEngine.ts",
  "packages/core/src/compiler/templates/typescript/InterfaceTemplate.ts",
  "packages/core/src/compiler/templates/typescript/TypeAliasTemplate.ts",
  "packages/core/src/compiler/writers/FileWriter.ts",
  "packages/core/src/compiler/writers/Writer.ts",
  "packages/core/src/compiler/writers/writerTypes.ts",
  "packages/core/src/ir/domain/SemanticTypeResolvers.ts",
  "packages/core/src/ir/domain/field-type/fieldTransform.ts",
  "packages/core/src/ir/domain/field-type/fieldTransformSemanticRelations.ts",
  "packages/core/src/ir/domain/field-type/legacyConverter.ts",
  "packages/core/src/ir/domain/field-type/semanticTypeConverter.ts",
  "packages/core/src/ir/domain/irTypes.ts",
  "packages/core/src/semantic/kernel/relationFoundation.ts",
  "packages/core/src/semantic/kernel/semanticEvidenceRelations.ts",
  "packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts",
  "packages/core/src/types/__archive__/legacyFieldAdapter.ts",
  "packages/core/src/types/domain/resourceCollectionCallbackModel.ts",
  "packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts",
  "packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts",
  "packages/core/src/types/semantic/__archive__/parsedAstTypes.ts",
  "packages/react/src/hooks/useAggregateCollectionIntent.ts"
];
const protectedSources = [
  "packages/core/src/compiler/analysis/astDataflowAuthority.ts",
  "packages/core/src/types/domain/resourceCollectionTransformation.ts",
  "packages/core/src/types/domain/resourceComputationSemantic.ts",
  "packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts",
  "packages/core/src/types/upstream/astSemanticStageContract.ts",
  "packages/core/src/types/upstream/astSemanticStagePreservation.ts",
  "packages/core/src/types/upstream/astSemanticStageTransition.ts",
  "packages/core/src/types/upstream/routeNames.ts",
  "packages/core/src/types/upstream/sourceBoundary.ts",
] ;
const entrypoints = [ 'packages/core/src/index.ts', 'packages/sdk/src/index.ts', 'packages/react/src/index.ts', 'packages/cli/src/index.ts' ];
const missing = candidates.filter(file => !fs.existsSync(path.join(root, file)));
const retainedCandidates = candidates.filter(file => fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).size !== 0);
const emptyProtectedSources = protectedSources.filter(file => !fs.existsSync(path.join(root, file)) || fs.statSync(path.join(root, file)).size === 0);
const missingEntrypoints = entrypoints.filter(file => !fs.existsSync(path.join(root, file)) || fs.statSync(path.join(root, file)).size === 0);
const emptyCandidates = candidates.filter(file => fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).size === 0);
const result = { phase: 1341, rule: 'vacuum is conservative: protected semantic source remains non-empty; candidates with live or unresolved references are retained pending wiring proof', candidates: candidates.length, missing, emptyCandidates, retainedCandidates, protectedSources: protectedSources.length, emptyProtectedSources, entrypoints: entrypoints.length, missingEntrypoints, pass: missing.length === 0 && emptyProtectedSources.length === 0 && missingEntrypoints.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
