const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};
const root = path.resolve(__dirname, '../..');
const { modelPropertyFactsAuthority } = require(path.join(root, 'packages/core/src/types/upstream/modelPropertyFactsAuthority.ts'));
const { createPropertyName } = require(path.join(root, 'packages/core/src/types/upstream/names.ts'));
const judge = (property, value) => modelPropertyFactsAuthority.judge({
  kind: 'model_property_source_evidence',
  property: createPropertyName(property),
  value,
});
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
check('table evidence produces a typed table judgment', judge('table', { kind: 'string_literal', value: 'custom_posts' }).kind === 'set_model_table');
check('primary-key evidence produces a typed column judgment', judge('primaryKey', { kind: 'string_literal', value: 'post_uuid' }).kind === 'set_model_primary_key');
check('uuid key type is decided upstream', judge('keyType', { kind: 'string_literal', value: 'uuid' }).value.kind === 'uuid');
check('unsupported key type produces a closed rejection', judge('keyType', { kind: 'string_literal', value: 'mystery' }).kind === 'unsupported_model_key_type');
check('incrementing false is preserved', judge('incrementing', { kind: 'boolean_literal', value: false }).value === false);
const fillable = judge('fillable', { kind: 'string_array', values: [{ kind: 'string_literal', value: 'title' }, { kind: 'other' }] });
check('property arrays retain literal string evidence only', fillable.value.length === 1 && fillable.value[0].value.value === 'title');
check('unknown property receives explicit ignored judgment', judge('unrecognized', { kind: 'string_literal', value: 'value' }).kind === 'ignored_model_property');
const failed = checks.filter(check => !check.passed);
console.log(JSON.stringify({ phase: 2467, checks, passed: checks.length - failed.length, failed: failed.length }, null, 2));
process.exitCode = failed.length ? 1 : 0;
