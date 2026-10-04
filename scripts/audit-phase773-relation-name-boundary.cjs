const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const binder = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/binders/resource/whenLoadedBinder.ts'), 'utf8');
const semantic = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/binders/resource/whenLoadedSemanticBinder.ts'), 'utf8');
const result = {
  boundaryAcceptsCanonicalRelationName: /relationName:\s*RelationName/.test(binder),
  semanticResolverAcceptsCanonicalRelationName: /relationName:\s*RelationName/.test(semantic),
  noReconstructionFromRelationName: !/createRelationName\(relationName\)/.test(semantic),
  modelLookupConsumesCanonicalRelationName: /modelSymbol\.relation\(relationName\)/.test(semantic),
  noUnsafeCastInBoundary: !/\bas\s+(?:unknown|any)\b/.test(binder + semantic),
  noFreeStringRelationBoundary: !/relationName:\s*string/.test(semantic),
};
for (const [k,v] of Object.entries(result)) console.log(`${k}=${v}`);
console.log(`ALL_PASS=${Object.values(result).every(Boolean)}`);
process.exit(Object.values(result).every(Boolean) ? 0 : 1);
