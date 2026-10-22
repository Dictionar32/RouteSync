import { describe, expect, it } from 'vitest';
import { createClassName, createMethodName } from '../names';
import {
  RESOURCE_SEMANTIC_MAPPING_CONTRACT,
  resourceSemanticMappingAuthority,
} from '../resourceSemanticMappingAuthority';

describe('Phase 1635 — upstream-owned resource semantic mapping', () => {
  it('exposes one contract and delegates semantic mapping through the authority', () => {
    expect(resourceSemanticMappingAuthority.contract).toEqual(RESOURCE_SEMANTIC_MAPPING_CONTRACT);
    expect(resourceSemanticMappingAuthority.resolveSemanticKind('binary_identical')).toBe('strict_equal');
    expect(resourceSemanticMappingAuthority.resolveStructuralKind({ kind: 'argument', sourceKind: 'named' })).toBe('named');
    expect(resourceSemanticMappingAuthority.resolveStaticReceiver(createClassName('DB'))).toEqual({
      kind: 'framework',
      receiver: { kind: 'database', name: { kind: 'class_name', value: { kind: 'string_value', value: 'DB' } } },
    });
    expect(resourceSemanticMappingAuthority.resolveStaticReceiver(createClassName('Attribute'))).toEqual({
      kind: 'framework',
      receiver: { kind: 'attribute', name: { kind: 'class_name', value: { kind: 'string_value', value: 'Attribute' } } },
    });
    expect(resourceSemanticMappingAuthority.resolveStaticReceiver(createClassName('Order'))).toEqual({
      kind: 'class', name: { kind: 'class_name', value: { kind: 'string_value', value: 'Order' } },
    });
    expect(resourceSemanticMappingAuthority.resolveStaticAction(createClassName('DB'), createMethodName('raw'))).toEqual({ kind: 'database_raw' });
    expect(resourceSemanticMappingAuthority.resolveStaticAction(createClassName('Order'), createMethodName('query'))).toEqual({
      kind: 'domain', name: { kind: 'method_name', value: { kind: 'string_value', value: 'query' } },
    });
  });
});
