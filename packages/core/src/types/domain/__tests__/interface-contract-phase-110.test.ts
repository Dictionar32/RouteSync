import { describe, expect, it } from 'vitest';
import { BoundSemanticFactory } from '../boundAst';
import { ResourceFieldSemanticBinding } from '../resourceFieldSemanticBinding';
import { ResourceFieldExpressionFactory } from '../../route';
import { SemanticValueFactory } from '../semanticValues';
import { primitiveType } from '../semanticType';

describe('phase 110 semantic field boundary', () => {
    it('uses bound property-chain resultingType as the canonical field type', () => {
        const type = primitiveType('string');
        const bound = BoundSemanticFactory.propertyChain({
            rootModel: SemanticValueFactory.modelName('Order'),
            steps: [],
            resultingType: type,
            nullability: { kind: 'non_nullable' }
        });
        const field = ResourceFieldSemanticBinding.fromExpression(
            'promotion',
            ResourceFieldExpressionFactory.primitive('string'),
            primitiveType('boolean'),
            undefined,
            bound
        );
        expect(field.semantic.kind).toBe('verified');
        if (field.semantic.kind !== 'verified') throw new Error('expected verified semantic');
        expect(field.semantic.type).toBe(type);
    });
});
