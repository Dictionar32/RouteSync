import { describe, expect, it } from 'vitest';
import { resolveSelectRawProjection } from './selectRawProjection';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { MethodCallField } from '../../../types/field';

const selectRawCall = (sql: string): MethodCallField => ({
  kind: 'method_call',
  originalCode: `->selectRaw('${sql}')`,
  source: { file: 'projection.test.php', line: 1, column: 1, context: 'controller' },
  target: {
    kind: 'variable',
    name: { kind: 'variable_name', value: 'query' },
    originalCode: '$query',
    source: { file: 'projection.test.php', line: 1, column: 1, context: 'controller' },
  },
  name: { kind: 'method_name', value: 'selectRaw' },
  args: [{ kind: 'positional', value: { kind: 'literal', value: sql, originalCode: sql, source: { file: 'projection.test.php', line: 1, column: 1, context: 'controller' } } }],
});

describe('selectRaw projection semantic boundary', () => {
  it('preserves aliases as typed projection fields', () => {
    const resolution = resolveSelectRawProjection(
      selectRawCall('COALESCE(ROUND(AVG(rating), 2), 0) as avg_rating, COUNT(*) as total_review'),
      SemanticValueFactory.modelName('ProductReview'),
      [],
      100,
    );

    expect(resolution.kind).toBe('query_projection');
    if (resolution.kind !== 'query_projection') throw new Error('expected query projection');
    expect(resolution.fields.map(([field]) => field.value)).toEqual(['avg_rating', 'total_review']);
    expect(resolution.fields.map(([, type]) => type.kind)).toEqual(['primitive', 'primitive']);
    expect(resolution.cardinality).toEqual({ kind: 'collection' });
    expect(resolution.nullable).toBe(false);
  });

  it('rejects non-literal selectRaw input at the semantic boundary', () => {
    const call = selectRawCall('ignored');
    call.args = [{ kind: 'positional', value: { kind: 'variable', name: { kind: 'variable_name', value: 'sql' }, originalCode: '$sql', source: call.source } }];
    const resolution = resolveSelectRawProjection(call, SemanticValueFactory.modelName('ProductReview'), [], 100);
    expect(resolution.kind).toBe('unknown');
  });
});
