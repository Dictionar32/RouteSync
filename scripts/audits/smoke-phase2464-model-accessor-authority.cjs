const fs = require('node:fs');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  module._compile(output, filename);
};
const { modelAccessorFactsAuthority } = require('../../packages/core/src/types/upstream/modelAccessorFactsAuthority.ts');
const { createMethodName, createClassName } = require('../../packages/core/src/types/upstream/names.ts');
const { stringValue } = require('../../packages/core/src/types/upstream/valueObjects.ts');
const { eloquentRelationMultiplicity } = require('../../packages/core/src/types/upstream/modelVocabulary.ts');
const source = {
  kind: 'source_span',
  file: { kind: 'source_file', value: stringValue('/app/Models/User.php') },
  start: { kind: 'number_value', value: 0 },
  end: { kind: 'number_value', value: 120 },
};
const expression = { kind: 'literal', value: { kind: 'string_value', value: 'Ada' }, source };
const evidence = (method, returnType, returnedExpressions = [expression]) => ({
  kind: 'model_accessor_method_evidence',
  method: createMethodName(method),
  visibility: { kind: 'protected' },
  returnType,
  returnedExpressions,
  source,
});
const facts = modelAccessorFactsAuthority.judge({ evidence: [
  evidence('getFirstNameAttribute', { kind: 'class_reference', className: createClassName('string') }),
  evidence('getIsActiveAttribute', { kind: 'class_reference', className: createClassName('bool') }),
  evidence('fullName', { kind: 'class_reference', className: createClassName('Attribute') }),
  evidence('getMissingAttribute', { kind: 'absent' }, []),
] });
const checks = [
  ['legacy accessor resolves camel-case property', facts[0]?.property.value.value === 'firstName'],
  ['legacy string return hint remains textual', facts[0]?.result.type.value.kind === 'string'],
  ['boolean return hint maps to boolean', facts[1]?.result.type.value.kind === 'boolean'],
  ['modern Attribute accessor retains method property name', facts[2]?.property.value.value === 'fullName'],
  ['missing return is a complete rejected computation', facts[3]?.computation.kind === 'rejected' && facts[3]?.computation.expression.kind === 'unsupported_expression'],
  ['one relation cardinality maps to single without relation engine', eloquentRelationMultiplicity({ kind: 'one' }).kind === 'single'],
  ['many relation cardinality maps to collection without relation engine', eloquentRelationMultiplicity({ kind: 'many' }).kind === 'collection'],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.stdout.write(`Phase2464 authority smoke: ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
