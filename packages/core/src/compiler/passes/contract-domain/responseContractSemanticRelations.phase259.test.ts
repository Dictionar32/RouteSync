import { resolveRequestResponseProjection, resolveResponseValueType } from './responseContractSemanticRelations';

const expected: readonly [string, string][] = [
  ['union', 'union'],
  ['null', 'null'],
  ['textual', 'string'],
  ['whole_number', 'number'],
  ['decimal_number', 'number'],
  ['boolean_flag', 'boolean'],
  ['named_type', 'named_type'],
  ['object', 'object'],
  ['model_reference', 'model_reference'],
  ['collection', 'array'],
  ['unresolved_declaration', 'unknown'],
];

for (const [kind, type] of expected) {
  if (resolveResponseValueType(kind) !== type) {
    throw new Error(`Phase 259 response value mapping failed for ${kind}`);
  }
}

console.log('phase259 declarative response-value semantics: PASS');


if (resolveRequestResponseProjection('none') !== 'empty') throw new Error('Phase 259 none response projection failed');
if (resolveRequestResponseProjection('data') !== 'resource') throw new Error('Phase 259 data response projection failed');
