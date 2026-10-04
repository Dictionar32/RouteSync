const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/passes/mapper/formMapperBuilder.ts',
  'packages/core/src/compiler/passes/mapper/formFieldLineBuilder.ts',
  'packages/core/src/compiler/passes/mapper/resourceRegistry.ts',
];

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const strip = source => source
  .replace(/\/\/[^\n]*/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/'(?:\\.|[^'\\])*'/g, "''")
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/`(?:\\.|[^`\\])*`/gs, '``');

const sources = Object.fromEntries(files.map(file => [file, read(file)]));
const code = Object.fromEntries(files.map(file => [file, strip(sources[file])]));

const forbidden = /\b(if|while|for|switch|map|filter|reduce|flatMap|undefined|null|unknown|any|new)\b|\?\?|===|\bas\b/;
const failures = [];

if (/requestType\.(resourceName|formTypeName)/.test(code[files[0]]) || /requestType\.(resourceName|formTypeName)/.test(code[files[2]])) {
  failures.push('legacy RequestType scalar projections remain in mapper boundary');
}
if (/extractObjectPropertyNames/.test(sources[files[0]]) || /extractObjectPropertyNames/.test(sources[files[1]])) {
  failures.push('unused extractObjectPropertyNames reservoir remains');
}
if (!/requestType\.identity\.resource/.test(sources[files[0]])) failures.push('form mapper does not consume canonical request identity resource');
if (!/requestType\.identity\.source\.formType/.test(sources[files[0]])) failures.push('form mapper does not consume canonical form type identity');
if (!/buildFormMapper\(requestType, action\)/.test(sources[files[2]])) failures.push('form mapper invocation still carries derived contract descriptor');
if (!/relationProject\(action\.fields/.test(sources[files[0]])) failures.push('form action traversal is not relation-backed');
if (!/relationSelect\(meaning\.fields/.test(sources[files[1]])) failures.push('object field selection is not relation-backed');
if (!/relationProject\(visibleFields/.test(sources[files[1]])) failures.push('object field projection is not relation-backed');
for (const file of files) if (forbidden.test(code[file])) failures.push(`forbidden host construct in ${file}`);

const result = {
  phase: 753,
  model: 'highest-form-request-semantic-authority',
  checks: {
    canonicalRequestIdentity: /requestType\.identity\.resource/.test(sources[files[0]]),
    canonicalFormTypeIdentity: /requestType\.identity\.source\.formType/.test(sources[files[0]]),
    mapperDerivesContractFromIdentity: /const contractTypeName = \x60\$\{resource\}Contract\x60;/.test(sources[files[0]]),
    relationBackedActionProjection: /relationProject\(action\.fields/.test(sources[files[0]]),
    relationBackedFieldSelection: /relationSelect\(meaning\.fields/.test(sources[files[1]]),
    relationBackedFieldProjection: /relationProject\(visibleFields/.test(sources[files[1]]),
    legacyRequestScalarProjectionsAbsent: !/requestType\.(resourceName|formTypeName)/.test(sources[files[0]]) && !/requestType\.(resourceName|formTypeName)/.test(sources[files[2]]),
    unusedExtractionReservoirAbsent: !/extractObjectPropertyNames/.test(sources[files[0]]) && !/extractObjectPropertyNames/.test(sources[files[1]]),
    forbiddenHostConstructsAbsent: !files.some(file => forbidden.test(code[file])),
  },
  failed: failures,
  pass: failures.length === 0,
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
