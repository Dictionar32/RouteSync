const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'packages/core/src/types/upstream/semanticMapping.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const checks = [
  ['mapping runtime has interface-typed exported object', /export const semanticMappingRuntimeOperations:\s*SemanticMappingRuntimeOperationsInterface\s*=\s*Object\.freeze\(/.test(source)],
  ['legacy relationProject import removed', !/from ['"]\.\.\/\.\.\/semantic\/relations\/relationalSequence['"]/.test(source)],
  ['domain-owned projection operation exists', /interface SemanticMappingProjectionOperationsInterface/.test(source) && /semanticMappingProjectionOperations\.project/.test(source)],
  ['nested property projection uses domain operation', /semanticMappingProjectionOperations\.project\(type\.properties/.test(source)],
  ['read mapping projection uses domain operation', /fields: Object\.freeze\(semanticMappingProjectionOperations\.project\(fields, item => resolveField/.test(source)],
  ['write mapping projection uses domain operation', /fields: Object\.freeze\(semanticMappingProjectionOperations\.project\(fields, item => Object\.freeze/.test(source)],
  ['no exported standalone function declarations in mapping domain', !/^export\s+function\s/m.test(source)],
  ['no old relation foundation modules recreated', !['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections remains intentionally empty', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8').trim() === ''],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed).length;
console.log(`\n${checks.length - failed}/${checks.length} structural checks passed`);
process.exitCode = failed ? 1 : 0;
