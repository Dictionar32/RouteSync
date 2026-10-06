import { describe, expect, it } from 'vitest';
import type { SchemaInterface } from '../schema';
import type { RouteParameters } from '../collections';
import { createTableName } from '../names';
import { schemaRelationIndexFrom } from '../schemaRelation';
import { routeBindingInterfaceFrom } from '../routeBinding';

describe('phase974 upstream relation interfaces', () => {
  it('indexes cumulative schema foreign-key evidence without rebuilding migration semantics', () => {
    const schema = {
      kind: 'schema_ast',
      definition: {
        kind: 'schema_definition',
        tables: { kind: 'schema_tables', items: { kind: 'empty' } },
        source: { kind: 'source_span', file: { kind: 'source_file', value: 'fixture' }, start: 0, end: 0 },
      },
      source: { kind: 'source_span', file: { kind: 'source_file', value: 'fixture' }, start: 0, end: 0 },
    } as SchemaInterface;
    const index = schemaRelationIndexFrom(schema);
    expect(index.table(createTableName('orders'))).toBeUndefined();
  });

  it('keeps route binding as an explicit route-owned surface', () => {
    const parameters = { kind: 'route_parameters', items: { kind: 'empty' } } as RouteParameters;
    const binding = routeBindingInterfaceFrom(parameters);
    expect(binding.parameters).toBe(parameters);
    expect(binding.modelParameters.kind).toBe('empty');
  });
});
