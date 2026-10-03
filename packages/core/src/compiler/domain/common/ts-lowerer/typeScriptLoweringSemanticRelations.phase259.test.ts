import { resolveTypeScriptLoweringOperation } from './typeScriptLoweringSemanticRelations';

const kinds = ['primitive', 'reference', 'optional', 'nullable', 'collection', 'object', 'union', 'intersection', 'unknown'] as const;
for (const kind of kinds) {
  if (resolveTypeScriptLoweringOperation(kind) !== kind) {
    throw new Error(`Phase 259 lowering operation failed for ${kind}`);
  }
}

console.log('phase259 declarative TypeScript lowering semantics: PASS');
