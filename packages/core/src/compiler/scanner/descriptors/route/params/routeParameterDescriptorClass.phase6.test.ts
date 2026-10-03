import { describe, expect, it } from 'vitest';
import { ScannedRouteParameterDescriptor } from './routeParameterDescriptorClass';

describe('Laravel route parameter semantics', () => {
  it('keeps ordinary placeholders as convention parameters', () => {
    const parameter = ScannedRouteParameterDescriptor.fromPathSegment('user');
    expect(parameter.binding.kind).toBe('convention');
    expect(parameter.type).toEqual({ kind: 'string' });
  });

  it('represents {post:slug} as implicit model binding with a custom key', () => {
    const parameter = ScannedRouteParameterDescriptor.fromPathSegment('post:slug');
    expect(parameter.binding).toEqual({
      kind: 'implicit_model',
      model: { kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: 'Post' } } },
      field: { kind: 'some', value: { kind: 'property_name', value: { kind: 'string_value', value: 'slug' } } },
      scoped: { kind: 'truth_value', value: false },
      withTrashed: { kind: 'truth_value', value: false },
    });
    expect(parameter.type).toEqual({
      kind: 'model',
      model: { kind: 'model_reference', name: { kind: 'model_name', value: { kind: 'string_value', value: 'Post' } } },
    });
  });
});
