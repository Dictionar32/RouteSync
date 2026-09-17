import type { InlineResponseDescriptor, ParsedRoute } from '@routesync/core';
import { ResponseShape, matchResponse } from '@routesync/core';
import type { ResponseCardinality, ResponseEnvelope, ResponseNullability } from './semanticTypes';

export function resolveResponseCardinality(response: ParsedRoute['binding']['response']): ResponseCardinality {
    const shape = response.shape;
    if (shape === ResponseShape.Paginated) return { kind: 'paginated_collection' };
    if (shape === ResponseShape.Collection) return { kind: 'collection' };
    return { kind: 'single' };
}

export function resolveResponseEnvelope(response: ParsedRoute['binding']['response']): ResponseEnvelope {
    return response.shape === ResponseShape.Paginated ? { kind: 'wrapped' } : { kind: 'direct' };
}

export function resolveResponseNullability(response: ParsedRoute['binding']['response']): ResponseNullability {
    return matchResponse(response, {
        resource: () => ({ kind: 'non_nullable' }),
        model: () => ({ kind: 'non_nullable' }),
        inline: (descriptor: InlineResponseDescriptor) => descriptor.semanticContract.fields.some((field: InlineResponseDescriptor['semanticContract']['fields'][number]) => field.nullability.kind === 'nullable')
            ? { kind: 'nullable' }
            : { kind: 'non_nullable' },
        void: () => ({ kind: 'non_nullable' }),
    });
}
