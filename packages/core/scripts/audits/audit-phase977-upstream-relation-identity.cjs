const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const model = read('src/types/upstream/model.ts');
const definition = read('src/compiler/scanner/semantic/model/modelSemanticDefinition.ts');
const canonical = read('src/compiler/scanner/subscanners/model/modelCanonical.ts');
const manifest = read('src/types/upstream/semanticDataflowManifestSurface.ts');
const migrationScanner = path.join(root, 'src/compiler/scanner/subscanners/model/migrationScanner.ts');
const checks = {
  modelSemanticDefinitionOwnsRelationInterface: /readonly relation: ModelRelationInterface;/.test(model),
  builderPersistsCanonicalRelationInterface: /relation: relationInterface/.test(definition),
  canonicalModelConsumesRelationInterface: /const semanticRelations = model\.relation\.semantic;/.test(canonical),
  canonicalModelDoesNotReconstructFromSurface: !/relationSelect\(\s*model\.surface\.properties/.test(canonical),
  manifestStillSeedOnly: /SemanticDataflowInput/.test(manifest) && /semanticDataflowInputsFromSourceModel/.test(manifest) && !/analyzeSemanticDataflow|solveSemanticDataflow|fixedPoint/.test(manifest),
  legacyMigrationScannerPreservedEmpty: fs.existsSync(migrationScanner) && fs.statSync(migrationScanner).size === 0,
};
const failed = Object.entries(checks).filter(([,v]) => !v);
console.log(JSON.stringify({phase: 977, checks, clean: failed.length === 0}, null, 2));
process.exitCode = failed.length ? 1 : 0;
