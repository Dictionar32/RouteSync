#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, pass) => { checks.push({ name, pass: Boolean(pass) }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); };
const runtimeFiles = [
  'packages/cli/src/parsers/PhpCodeParser.ts',
  'packages/cli/src/parsers/php/expressionParser.ts',
  'packages/cli/src/parsers/php/nodeMapper.ts',
  'packages/cli/src/parsers/php/sourceSlice.ts',
  'packages/cli/src/parsers/php/boundaryAdapter.ts',
  'packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts',
  'packages/cli/src/parsers/php/sourceInvocationPipeline.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/cli/src/upstreamCompositionFactory.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/ast/grammarCatamorphism.ts',
  'packages/cli/src/parsers/php/ast/calleeCatamorphism.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/actionContribution.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/responseContribution.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts',
  'packages/core/src/compiler/scanner/operations/request-deriver/actionDeriver.ts',
  'packages/core/src/compiler/scanner/operations/request-deriver/responseDeriver.ts',
  'packages/core/src/compiler/scanner/operations/request-deriver/index.ts',
];
const source = Object.fromEntries(runtimeFiles.map(file => [file, read(file)]));
check('critical PHP AST/runtime semantic files contain no exported function declarations', runtimeFiles.every(file => !/^export\s+function\s/m.test(source[file])));
check('critical PHP AST/runtime semantic files contain no exported function-valued const aliases', runtimeFiles.every(file => !/^export\s+const\s+\w+\s*(?::[^=]+)?=\s*(?:async\s*)?(?:function\s*\(|\([^\n]*\)\s*(?::[^=]+)?=>)/m.test(source[file])));
check('public PHP parsing entrypoint is an interface-typed operation object over canonical PhpAstNode', /export const phpCodeParsingOperation:\s*PhpCodeParsingOperationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/PhpCodeParser.ts']) && /PhpAstNode/.test(source['packages/cli/src/parsers/PhpCodeParser.ts']) && !/FieldNode/.test(source['packages/cli/src/parsers/PhpCodeParser.ts'] + source['packages/cli/src/parsers/php/expressionParser.ts'] + source['packages/cli/src/parsers/php/nodeMapper.ts']));
check('PHP expression parsing is exposed as an interface-typed operation object', /export const phpExpressionParsingOperation:\s*PhpExpressionParsingOperationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/expressionParser.ts']));
check('PHP AST lowering, source slicing, and boundary adaptation are exposed as operation objects', /export const phpAstNodeMappingOperation:\s*PhpAstNodeMappingOperationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/nodeMapper.ts']) && /export const phpNodeSourceSliceOperation:\s*PhpNodeSourceSliceOperationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/sourceSlice.ts']) && /export const phpAstBoundaryAdapter:\s*PhpAstBoundaryAdapterInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/boundaryAdapter.ts']));
check('callee and grammar recursion dispatch through typed operation objects', /export const phpGrammarMatchingOperation:\s*PhpGrammarMatchingOperationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/ast/grammarCatamorphism.ts']) && /export const phpCalleeAstVisitorFactory:\s*PhpCalleeAstVisitorFactoryInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/ast/calleeCatamorphism.ts']) && /export const phpCalleeMatchingOperation:\s*PhpCalleeMatchingOperationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/ast/calleeCatamorphism.ts']));
check('RequestType action/response producers are interface-typed operation objects', /export const requestTypeRouteActionDerivation:\s*RequestTypeRouteActionDerivationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/core/src/compiler/semantic/request-type-derivation/actionContribution.ts']) && /export const requestTypeResponseContributionDerivation:\s*RequestTypeResponseContributionDerivationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/core/src/compiler/semantic/request-type-derivation/responseContribution.ts']));
check('source identity/inventory operations are exported through the aggregate domain interface', /export const requestTypeDerivationSourceEvidenceInventory:\s*RequestTypeDerivationSourceEvidenceInventoryInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts']) && !/^export const canonical(Route|Resource|Request)(OccurrenceKey|Identity)\s*:/m.test(source['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts']));
check('actual manifest path uses interface-typed frontend, source pipeline, composition authority and scan operation', /export const phpSourceFrontendAstAdapter:\s*PhpSourceFrontendInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts']) && /export const phpSourceInvocationSemanticPipelineOperations:\s*PhpSourceInvocationSemanticPipelineOperationsInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/sourceInvocationPipeline.ts']) && /export const controllerInvocationManifestCompositionAuthorityFactory:\s*ControllerInvocationManifestCompositionAuthorityFactoryInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts']) && /export const routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/upstreamCompositionFactory.ts']) && /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/cli/src/manifestScanOperationInterface.ts']));
check('proof replay and source/AST checks are operation objects, not loose callable exports', /export const requestTypeDerivationIncomingContributionAstVerification:\s*RequestTypeDerivationIncomingContributionAstVerificationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts']) && /export const requestTypeDerivationIncomingSourceVerification:\s*RequestTypeDerivationIncomingSourceVerificationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts']) && /export const requestTypeDerivationGroupReceiptsReplayVerification:\s*RequestTypeDerivationGroupReceiptsReplayVerificationInterface\s*=\s*Object\.freeze\(\{/.test(source['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts']));
check('verifier still fails closed while canonical law coverage is incomplete', /kind: 'verification_incomplete' as const/.test(source['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts']) && /missingLaws: REQUEST_TYPE_DERIVATION_LAW_IDS/.test(source['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts']));
const failed = checks.filter(check => !check.pass);
console.log(`\nPhase 2704 runtime operation-object audit: ${checks.length - failed.length}/${checks.length} assertions passed.`);
console.log('SCOPE: static source assertions only. Typecheck, runtime tests, and complete canonical-law proof verification are separate gates.');
if (failed.length) process.exitCode = 1;
