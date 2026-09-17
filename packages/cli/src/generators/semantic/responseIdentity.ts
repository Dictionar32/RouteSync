import type { InlineResponseDescriptor, ModelResponseDescriptor, ParsedRoute, ResourceResponseDescriptor } from '@routesync/core';
import { matchResponse } from '@routesync/core';
import { toTypeName } from '../names';

export function resolveResponseName(route: ParsedRoute, response: ParsedRoute['binding']['response']): string {
    return matchResponse(response, {
        resource: (descriptor: ResourceResponseDescriptor) => toTypeName(descriptor.resourceName.value),
        model: (descriptor: ModelResponseDescriptor) => toTypeName(descriptor.modelName.value),
        inline: (descriptor: InlineResponseDescriptor) => toTypeName(descriptor.typeName.value),
        void: () => `${toTypeName(route.identity.name)}Response`,
    });
}

export function deriveResponseKind(response: ParsedRoute['binding']['response']): 'primitive' | 'resource' | 'model' | 'custom' {
    return matchResponse(response, {
        resource: () => 'resource',
        model: () => 'model',
        inline: () => 'custom',
        void: () => 'primitive',
    });
}
