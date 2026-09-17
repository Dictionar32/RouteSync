import { describe, expect, it } from 'vitest';
import { ObjectType } from '../../../types/semantic';
import { FrameworkRegistryResolver } from '../FrameworkRegistryResolver';

describe('FrameworkRegistryResolver', () => {
  it('preserves registered object fields in the bound semantic type', () => {
    const resolver = new FrameworkRegistryResolver();
    const meta = {
      kind: 'method_call' as const,
      originalCode: '$request->createToken()',
      source: { kind: 'absent' as const },
      target: {
        kind: 'variable' as const,
        originalCode: '$request',
        source: { kind: 'absent' as const },
        name: { kind: 'variable_name' as const, value: 'request' },
      },
      name: { kind: 'method_name' as const, value: 'createToken' },
      args: [],
    };

    const result = resolver.resolve(meta, {} as never);
    expect(result.kind).toBe('object');
    if (result.kind !== 'object') return;
    expect(result.boundAst.kind).toBe('bound_method_call');
    if (result.boundAst.kind !== 'bound_method_call') return;
    expect(result.boundAst.returnType).toBeInstanceOf(ObjectType);
    const objectType = result.boundAst.returnType as ObjectType;
    expect(objectType.properties).toHaveLength(1);
    expect(objectType.properties[0].name).toBe('plainTextToken');
  });
});
