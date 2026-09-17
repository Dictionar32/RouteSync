import { describe, expect, it } from 'vitest';
import { SemanticTypeResolver } from '../../../compiler/domain/common/SemanticTypeResolver';
import { BoundSemanticFactory } from '../boundAst';
import { ScannedResourceFieldDescriptor } from '../../../compiler/scanner/descriptors/resource/resourceFieldDescriptor';
import { ResourceFieldExpressionFactory } from '../../route';
import { SemanticValueFactory } from '../semanticValues';
import { PrimitiveType } from '../../../compiler/types/SemanticType';

describe('phase 110 semantic field boundary', () => {
    it('uses bound property-chain resultingType as the canonical field type', () => {
        const type = new PrimitiveType('string');
        const bound = BoundSemanticFactory.propertyChain({
            rootModel: SemanticValueFactory.modelName('Order'),
            steps: [],
            resultingType: type,
            nullability: { kind: 'non_nullable' }
        });
        const field = ScannedResourceFieldDescriptor.fromExpression(
            'promotion',
            ResourceFieldExpressionFactory.primitive('string'),
            new PrimitiveType('boolean'),
            undefined,
            bound
        );
        expect(SemanticTypeResolver.resolveFieldSemanticType(field)).toBe(type);
    });
});
