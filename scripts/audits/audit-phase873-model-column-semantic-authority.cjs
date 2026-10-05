const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const resolver = read('packages/core/src/semantic/plugins/ModelColumnResolver.ts');
const symbols = read('packages/core/src/semantic/SymbolTable.ts');
const report = {
  symbolExposesSemanticColumn: /readonly column:\s*\(name: string\).*Lookup<ModelSemanticColumn>/.test(symbols),
  resolverUsesSemanticColumnLookup: /symbol\.column\(meta\.column\.value\)/.test(resolver),
  resolverLowersCanonicalSemanticType: /typeExpressionToSemanticType\(column\.semanticType\)/.test(resolver),
  resolverDoesNotReconstructPrimitiveMap: !/primitiveEntries|primitiveFor\(/.test(resolver),
  resolverRetainsSourceEvidenceForDbAndCast: /fact\.databaseType/.test(resolver) && /fact\.type\.cast/.test(resolver),
  resolverRetainsNullabilityEvidence: /fact\.nullability/.test(resolver),
  allChecksPassed: false,
};
report.allChecksPassed = Object.entries(report).filter(([k]) => k !== 'allChecksPassed').every(([,v]) => v === true);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.allChecksPassed ? 0 : 1;
