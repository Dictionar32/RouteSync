const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const evidenceType = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const evidenceProducer = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const boundaryTypes = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const provenanceBuilder = read('packages/core/src/compiler/scanner/resolvers/boundary/provenanceBuilder.ts');
const boundaryInput = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const flow = read('packages/core/src/types/domain/routes.ts');
const requestType = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const authorityLowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const checks = [
  ['route declaration evidence requires SourceSpan, not absent', /readonly span: SourceSpan;/.test(evidenceType) && !/readonly span: SourceSpan \|/.test(evidenceType)],
  ['AST evidence producer creates exact start/end offsets', /span: Object\.freeze\(\{[\s\S]*?start: Object\.freeze\(\{ kind: 'number_value' as const, value: declaration\.source\.startOffset \}\)[\s\S]*?end: Object\.freeze\(\{ kind: 'number_value' as const, value: declaration\.end\.endOffset \}\)/.test(evidenceProducer)],
  ['active scanner forwards the same evidence span to route producer input', /const sourceSpan = evidence\.span/.test(scanner) && /source: sourceSpan/.test(scanner)],
  ['route boundary options carry declaration span', /readonly sourceSpan: SourceSpan;/.test(boundaryTypes)],
  ['boundary provenance preserves declaration span', /declarationSpan: params\.sourceSpan/.test(provenanceBuilder) && /sourceSpan: params\.sourceSpan/.test(boundaryInput)],
  ['RouteSemanticFlow exposes declaration span', /readonly declarationSpan: import\('\.\.\/upstream\/provenance'\)\.SourceSpan/.test(flow)],
  ['RequestType route occurrence location carries exact span', /kind: 'route_declaration_location'[\s\S]*?span: RouteSemanticFlow\['provenance'\]\['declarationSpan'\]/.test(requestType)],
  ['legacy RequestType lowering remains an unresolved blocker', /requestTypeDerivationProjectionPipeline\.derive\(/.test(lowering) && /createAuthorityBackedRouteManifestTypeLowering/.test(authorityLowering) && !/createAuthorityBackedRouteManifestTypeLowering/.test(lowering)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
