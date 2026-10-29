const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const model = read('packages/core/src/types/upstream/model.ts');
const relation = read('packages/core/src/types/upstream/modelRelation.ts');
const primaryKey = read('packages/core/src/types/upstream/modelPrimaryKey.ts');
const scanner = read('packages/core/src/compiler/scanner/laravelModelScanner.ts');
const producerContract = read('packages/core/src/types/upstream/modelProducerInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const upstreamModelOwners = [model, relation, primaryKey];
const checks = [
  ['upstream model contract no longer imports semantic/relations or semantic/foundation', upstreamModelOwners.every(source => !/semantic\/(?:relations|foundation)/.test(source))],
  ['model property index is a model-owned tuple contract, not RelationIndex from relationMembership', /export type ModelSemanticPropertyIndex = readonly \(readonly \[PropertyName, ModelSemanticProperty\]\)\[\]/.test(model) && !/RelationIndex</.test(model)],
  ['model relation index is a model-owned tuple contract, not RelationIndex from relationMembership', /export type ModelSemanticRelationIndex = readonly \(readonly \[RelationName, ModelSemanticRelation\]\)\[\]/.test(model)],
  ['property index factory is explicitly interface-typed', /export const modelSemanticPropertyIndexFrom: ModelSemanticPropertyIndexFactoryInterface/.test(model)],
  ['property lookup and membership operations have explicit interfaces', /export const modelSemanticPropertyLookup: ModelSemanticPropertyLookupInterface/.test(model) && /export const modelSemanticPropertyHas: ModelSemanticPropertyMembershipInterface/.test(model)],
  ['relation index operations have explicit interfaces', /export const modelSemanticRelationIndexFrom: ModelSemanticRelationIndexFactoryInterface/.test(model) && /export const modelSemanticRelationLookup: ModelSemanticRelationLookupInterface/.test(model)],
  ['model relation composition operation is explicitly interface-typed', /export const modelRelationInterfaceFrom: ModelRelationInterfaceFactoryInterface/.test(relation)],
  ['primary-key reconciliation operation is explicitly interface-typed', /export const reconcileModelPrimaryKey: ModelPrimaryKeyReconciliationOperationInterface/.test(primaryKey)],
  ['canonical Laravel scanner remains wired through LaravelModelScannerInterface', /export const laravelModelScanner: LaravelModelScannerInterface/.test(scanner)],
  ['model producer operation is integrated into the canonical scanner through the upstream interface', !/operations\/modelProducer/.test(scanner) && /export const modelProducer: ModelProducerInterface/.test(scanner)],
  ['model producer operation contract is upstream-owned', /export interface ModelProducerInterface/.test(producerContract) && /export interface ModelProducerInput/.test(producerContract)],
  ['audit is registered in package scripts', Boolean(packageJson.scripts['audit:phase2477-model-upstream-relation-independence'])],
];
const failed = checks.filter(([, passed]) => !passed);
console.log(JSON.stringify({ phase: 2477, name: 'model-upstream-relation-independence', passed: checks.length - failed.length, total: checks.length, failed: failed.map(([name]) => name), checks: checks.map(([name, passed]) => ({ name, passed })) }, null, 2));
process.exitCode = failed.length ? 1 : 0;
