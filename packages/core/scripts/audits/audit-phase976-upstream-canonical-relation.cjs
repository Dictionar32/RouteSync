const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const stat = p => fs.statSync(path.join(root, p)).size;
const modelCanonical = read('src/compiler/scanner/subscanners/model/modelCanonical.ts');
const modelProducer = read('src/compiler/scanner/subscanners/modelProducer.ts');
const reconciliation = read('src/types/upstream/semanticReconciliation.ts');
const modelRelation = read('src/types/upstream/modelRelation.ts');
const manifest = read('src/types/upstream/semanticDataflowManifestSurface.ts');
const routeBinding = read('src/types/upstream/routeBinding.ts');
const migration = read('src/compiler/scanner/subscanners/migrationProducer.ts');
const legacy = 'src/compiler/scanner/subscanners/model/migrationScanner.ts';
const checks = {
  canonicalModelUsesSemanticSurface: modelCanonical.includes('model.surface.properties') && !modelCanonical.includes('const semanticRelations = relations'),
  canonicalModelDoesNotAcceptEloquentRelations: !modelCanonical.includes('EloquentRelationAst'),
  producerDoesNotPassRawRelationsToCanonical: !/modelAstFromSemantic\([\s\S]*relations,\s*input\.sourceSpan/.test(modelProducer),
  reconciliationIsSingleAuthority: reconciliation.includes('export const reconcileSemanticRelation') && modelRelation.includes('reconcile'),
  modelRelationOwnsReconciliations: modelRelation.includes('readonly reconciliations'),
  manifestSeedOnly: manifest.includes('SemanticDataflowInput') && !manifest.includes('createSemanticDataflowJudgment'),
  routeBindingSeparate: routeBinding.includes('RouteBindingInterface'),
  explicitConstrainedHandled: migration.includes("tokenIs(tokens, cursor, 'constrained')") && migration.includes('candidate => tokens[candidate].value'),
  legacyScannerPreservedEmpty: fs.existsSync(path.join(root, legacy)) && stat(legacy) === 0,
};
console.log(JSON.stringify({ phase: 976, checks, clean: Object.values(checks).every(Boolean) }, null, 2));
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
