const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const routeScanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const routeDataFlow = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts');
const contractExtraction = read('packages/core/src/compiler/passes/contract-domain/contractExtraction.ts');
const sourceAstScanner = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');

const frontierFiles = [routeScanner, routeDataFlow, contractExtraction, sourceAstScanner];
const forbidden = [
  ['hostUndefined', /\bundefined\b/],
  ['nullCoalescing', /\?\?/],
  ['hostCastFallback', /as unknown as|as any/],
  ['semanticMap', /\.map\s*\(/],
  ['semanticFilter', /\.filter\s*\(/],
  ['semanticReduce', /\.reduce\s*\(/],
  ['semanticFlatMap', /\.flatMap\s*\(/],
];

const checks = [
  ['singleRouteAstImport', (routeScanner.match(/import type \{ RouteAst \} from "\.\.\/\.\.\/\.\.\/types\/upstream\/ast"/g) || []).length === 1],
  ['routeProducerIsExecutionAuthority', /return routeProducer\.produce\(producerInput\);/.test(routeScanner)],
  ['noLegacyFormRequestConsumerInRouteScanner', !routeScanner.includes('FormRequestSource')],
  ['routeScannerUsesUpstreamRouteFileContext', /const fileContext: RouteFileContext = routeSourceFileContextKnowledge\(sourceFilePath\);/.test(routeScanner)],
  ['routeDataFlowUsesUpstreamRouteFileContext', /export type RouteSourceFileContext = RouteFileContext;/.test(routeDataFlow)],
  ['routeSourceFileKnowledgeProducesCanonicalSourceFile', /createSourceFile\(normalized\)/.test(routeDataFlow)],
  ['routeScannerUsesVariantFoldsForClosedBindings', /relationVariantFold\(\s*route\.binding\.request/.test(routeScanner)],
  ['routeScannerUsesHandlerCatamorphism', /matchRouteHandler\(route\.binding\.operation\.handler/.test(routeScanner)],
  ['routeScannerUsesMiddlewareNameVocabulary', /createMiddlewareName/.test(routeScanner)],
  ['contractExtractionUsesCanonicalResponseFieldShape', /fields,\s*itemType/.test(contractExtraction)],
  ['contractExtractionUsesUpstreamDomainImportPath', /from '\.\.\/\.\.\/\.\.\/types\/domain\/request'/.test(contractExtraction)],
  ['sourceAstScannerPassesControllerRelationOption', /RouteScanner\.scanAsts\(sourceProject, relationSome\(controllerBundle\.controllerIndex\)/.test(sourceAstScanner)],
  ['noParsedDescriptorInFrontier', !frontierFiles.some(source => /Parsed[A-Za-z0-9_]*Descriptor/.test(source))],
];

const forbiddenResults = Object.fromEntries(
  forbidden.map(([name, pattern]) => [name, frontierFiles.some(source => pattern.test(source))]),
);

const result = {
  phase: 813,
  frontier: 'upstream-highest-model',
  checks: Object.fromEntries(checks),
  forbidden: forbiddenResults,
  allChecksPass: checks.every(([, pass]) => pass),
  forbiddenFrontierClean: Object.values(forbiddenResults).every(value => !value),
};

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.allChecksPass && result.forbiddenFrontierClean ? 0 : 1;
