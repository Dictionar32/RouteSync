const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const modelEntity = fs.readFileSync(path.join(root, 'packages/core/src/types/domain/modelEntityDefinition.ts'), 'utf8');
const upstreamModel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/model.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = {
  canonicalTargetShapeDeclaredUpstream: upstreamModel.includes('export type ModelRelationTargetShape ='),
  modelEntityImportsCanonicalTargetShape: modelEntity.includes("import type { ModelRelationTargetShape } from '../upstream/model';"),
  modelEntityUsesCanonicalTargetShape: modelEntity.includes('readonly targetShape: ModelRelationTargetShape;'),
  legacyRelationTargetShapeImportRemoved: !modelEntity.includes("RelationTargetShape } from './eloquentTypes'"),
  auditRegistered: typeof packageJson.scripts['audit:phase734-model-relation-target-interface'] === 'string',
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 734, checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
