const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/subscanners/ResourceScanner.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = {
  controllerDataflowPath: source.includes('import("./controller/resourceDataflowAggregator")'),
  resourceRelationFactory: source.includes('createResourceRelationFact('),
  relationEdgeVariantFold: source.includes("relationVariantFold(entry.value, 'resource_single'") && source.includes("relationVariantFold(rest, 'resource_collection'"),
  presenceFoldResolution: source.includes('presenceFold(resolution, () => [], value => [value])'),
  lookupIsEliminated: source.includes('matchLookup(lookup, {') && source.includes('createResourceModelResolutionFact('),
  boundEvidencePreserved: source.includes('evidence: file'),
  finalAstReturnClosed: source.includes('presenceFold<ResourceModelResolutionFact, ResourceAst>'),
  arrayKeyClosedAdt: source.includes("relationVariantFold(entry, 'keyed'") && source.includes("relationVariantFold(keyed.key, 'string'"),
  noParsedDescriptor: !/Parsed[A-Za-z]+Descriptor/.test(source),
  noDeadFsImport: !source.includes('node:fs'),
  noDeadResourceFieldExpressionImport: !source.includes('ResourceFieldExpression'),
};
const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 809, checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
