import type { CompilerIR, ResolvedResponse, ResolvedRoute } from './semanticTypes';
import type {
    InlineResponseDescriptor,
    ModelResponseDescriptor,
    RouteSemanticFlow,
    ResourceFieldSemanticBinding,
    ResourceResponseDescriptor,
} from '@routesync/core';
import { matchResponse } from '@routesync/core';
import {
    resolveCanonicalAction,
    type SemanticResolutionContext
} from './SemanticResolutionContext';
import { ResourceFieldResolver } from './ResourceFieldResolver';
import {
    resolveResponseCardinality,
    resolveResponseEnvelope,
    resolveResponseNullability,
} from './responseSemantics';
import { resolveResponseName, deriveResponseKind } from './responseIdentity';
import { countResponsesByGroup } from './responseGrouping';

export class ResponseResolver {
    public static resolveResponseTypes(
        context: SemanticResolutionContext,
        ir: CompilerIR
    ): void {
        const seen = new Set<string>();
        for (const route of context.routes) {
            const responseId = `${route.identity.coordinates.name.value.value}Response`;

            if (seen.has(responseId)) {
                continue;
            }
            seen.add(responseId);

            try {
                const resolved = this.resolveResponse(route, context);
                ir.responseTypes.set(responseId, resolved);
                ir.resourceAliases.set(route.identity.coordinates.name.value.value, resolved.name);
            } catch (error) {
                ir.metadata.errors.push(
                    `Failed to resolve response for route ${route.identity.coordinates.name.value.value}: ${error}`
                );
            }
        }
    }

    public static resolveResponse(route: RouteSemanticFlow, context: SemanticResolutionContext): ResolvedResponse {
        const response = route.binding.response;
        const name = resolveResponseName(route, response);
        const actionName = resolveCanonicalAction(route.identity.coordinates.method);
        const fields = matchResponse(response, {
            resource: (descriptor: ResourceResponseDescriptor) => {
                const resource = context.resourcesByName.get(descriptor.resourceName.value);
                if (!resource) throw new Error(`Resource ${descriptor.resourceName.value} is absent from manifest`);
                return ResourceFieldResolver.buildResponseFields(resource);
            },
            model: (descriptor: ModelResponseDescriptor) => {
                const model = context.modelsByName.get(descriptor.modelName.value);
                if (!model) throw new Error(`Model ${descriptor.modelName.value} is absent from manifest`);
                return ResourceFieldResolver.buildModelFields(model);
            },
            inline: (descriptor: InlineResponseDescriptor) => new Map(descriptor.fields.map((field: ResourceFieldSemanticBinding) => [field.name, ResourceFieldResolver.resolve(field)] as const)),
            void: () => new Map(),
        });
        const cardinality = resolveResponseCardinality(response);
        const envelope = resolveResponseEnvelope(response);
        const nullability = resolveResponseNullability(response);
        return {
            id: `${route.identity.coordinates.name.value.value}Response`,
            kind: deriveResponseKind(response),
            name,
            contractName: `${name}Schema`,
            mapperName: `to${name}Read`,
            formMapperName: `toApi${name}${actionName}`,
            fields,
            cardinality,
            envelope,
            nullability,
        };
    }

    public static resolveRoutes(
        context: SemanticResolutionContext,
        ir: CompilerIR
    ): void {
        for (const route of context.routes) {
            const action = resolveCanonicalAction(route.identity.coordinates.method);
            const responseId = `${route.identity.coordinates.name.value.value}Response`;
            const resp = route.binding.response;
            const resolvedRoute: ResolvedRoute = {
                name: route.identity.coordinates.name.value.value,
                action,
                responseId,
                cardinality: resolveResponseCardinality(resp),
                envelope: resolveResponseEnvelope(resp),
            };
            ir.resolvedRoutes.push(resolvedRoute);
        }
    }

    public static countResponsesByGroup(context: SemanticResolutionContext, ir: CompilerIR): void {
        countResponsesByGroup(context, ir);
    }

}
