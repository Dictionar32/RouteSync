const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = {
  collectionBindingImportCanonical: read('packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts').includes('../../../../../types/domain/resourceFieldSemanticBinding'),
  ternaryBindingImportCanonical: read('packages/core/src/compiler/scanner/binders/resource/composite/literalTernaryBinders.ts').includes('../../../../../types/domain/resourceFieldSemanticBinding'),
  noWrongCollectionBindingImport: !read('packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts').includes('from \"../../../../types/domain/resourceFieldSemanticBinding\"'),
  noWrongTernaryBindingImport: !read('packages/core/src/compiler/scanner/binders/resource/composite/literalTernaryBinders.ts').includes('from \"../../../../types/domain/resourceFieldSemanticBinding\"'),
  httpErrorNullabilityCanonical: read('packages/core/src/types/domain/httpErrors.ts').includes('const NON_NULLABLE: Nullability = Object.freeze({ kind: \'non_nullable\' });'),
  legacyDescriptorRefsZero: !fs.readdirSync(path.join(root, 'packages/core/src'), { withFileTypes: true }).some(() => false) && (() => { const { execFileSync } = require('child_process'); try { execFileSync('grep', ['-R', '-n', 'ResourceFieldDescriptor', 'packages/core/src'], { encoding: 'utf8' }); return false; } catch (error) { return error.status === 1; } })(),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
const result = { phase: 726, checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
