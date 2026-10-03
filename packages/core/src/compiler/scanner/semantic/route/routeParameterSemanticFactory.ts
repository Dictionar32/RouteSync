/**
 * Canonical scanner-to-upstream boundary for route parameters.
 * Raw route evidence is converted directly into the upstream semantic ADT.
 */
import type {
    RouteParameter,
    RouteParameterBinding,
    RouteParameterConstraint,
    RouteParameterLocation,
    RouteParameterType
} from "../../../../../types/route";
import type { PropertyName, RouteParameterName } from "../../../../../types/upstream/names";
import type { ModelReference } from "../../../../../types/upstream/semanticReferences";
import type { Presence } from "../../../../../types/upstream/primitiveVocabulary";
import { presenceOf } from "../../../../../types/upstream/presence";
import {
    relationAny,
    relationEqual,
    relationGate,
    relationOptionFold,
    relationSome,
    relationNone,
    relationTextSlice,
    type RelationOption
} from "../../../../../semantic/kernel/relationalSequence";
import { toCamelCase, toPascalCase } from "../../../../../utils/resource-naming";
import type { RawScannedRouteParameterInput, ScannedRouteParameterParams } from "./types";

const stringValue = (value: string) => Object.freeze({ kind: 'string_value' as const, value });
const routeParameterName = (value: string): RouteParameterName => Object.freeze({ kind: 'route_parameter_name' as const, value: stringValue(value) });
const propertyName = (value: string): PropertyName => Object.freeze({ kind: 'property_name' as const, value: stringValue(value) });
const modelReference = (value: string): ModelReference => Object.freeze({
    kind: 'model_reference' as const,
    name: Object.freeze({ kind: 'model_name' as const, value: stringValue(value) })
});

const relationValueOption = <T>(value?: T): RelationOption<T> =>
    relationOptionFold(presenceOf(value), () => relationNone<T>(), entry => relationSome(entry));

const binding = (name: string, location: RouteParameterLocation, value?: string): RouteParameterBinding =>
    relationOptionFold(
        relationValueOption(value),
        () => Object.freeze({ kind: 'convention' as const }),
        field => relationGate(
            relationEqual(location.kind, 'path'),
            () => Object.freeze({
                kind: 'implicit_model' as const,
                model: modelReference(toPascalCase(name)),
                field: relationSome(propertyName(field)),
                scoped: { kind: 'truth_value' as const, value: false },
                withTrashed: { kind: 'truth_value' as const, value: false }
            }),
            () => Object.freeze({ kind: 'convention' as const })
        )
    );

const presence = (required: boolean): Presence =>
    relationGate(
        required,
        () => Object.freeze({ kind: 'required' as const }),
        () => Object.freeze({ kind: 'optional' as const })
    );

const constraint = (): RouteParameterConstraint => Object.freeze({ kind: 'unconstrained' as const });

function fromRaw(input: RawScannedRouteParameterInput): ScannedRouteParameterParams {
    const location: RouteParameterLocation = relationGate(
        relationEqual(typeof input.location, 'string'),
        () => ({ kind: input.location as RouteParameterLocation['kind'] }),
        () => input.location
    );
    return Object.freeze({
        name: routeParameterName(input.name),
        propertyName: propertyName(input.propertyName),
        binding: binding(input.name, location, input.bindingField),
        location,
        presence: input.presence,
        type: input.type,
        constraint: input.constraint
    });
}

export interface RouteParameterSemantic extends Extract<RouteParameter, { readonly location: RouteParameterLocation }> {
    readonly kind: 'route_parameter';
    readonly name: RouteParameterName;
    readonly propertyName: PropertyName;
    readonly binding: RouteParameterBinding;
    readonly location: RouteParameterLocation;
    readonly presence: Presence;
    readonly type: RouteParameterType;
    readonly constraint: RouteParameterConstraint;
}

const createSemanticParameter = (params: ScannedRouteParameterParams): RouteParameterSemantic => Object.freeze({
    kind: 'route_parameter' as const,
    name: params.name,
    propertyName: params.propertyName,
    binding: params.binding,
    location: params.location,
    presence: params.presence,
    type: params.type,
    constraint: params.constraint
});

const create = ({
    name,
    propertyName: propertyNameValue = toCamelCase(name),
    bindingField,
    in: location = 'path',
    required = true,
    type = inferType(name, bindingField)
}: {
    readonly name: string;
    readonly propertyName?: string;
    readonly bindingField?: string;
    readonly in?: RouteParameterLocation['kind'];
    readonly required?: boolean;
    readonly type?: RouteParameterType;
}): RouteParameterSemanticFactory => createSemanticParameter(fromRaw({
    name,
    propertyName: propertyNameValue,
    bindingField,
    location,
    presence: presence(required),
    type,
    constraint: constraint()
}));

export const RouteParameterSemanticFactory = Object.freeze({
    create,
    fromPathSegment: (rawSegment: string): Extract<RouteParameter, { readonly location: { readonly kind: 'path' } }> => {
        const [rawName, bindingField] = rawSegment.split(':');
        const optional = rawName.endsWith('?');
        const name = relationGate(
            optional,
            () => relationTextSlice(rawName, 0, rawName.length - 1),
            () => rawName
        );
        const routeParameter = createSemanticParameter(fromRaw({
            name,
            propertyName: toCamelCase(name),
            bindingField,
            location: 'path',
            presence: presence(!optional),
            type: inferType(name, bindingField),
            constraint: constraint()
        }));
        return routeParameter as Extract<RouteParameter, { readonly location: { readonly kind: 'path' } }>;
    },
    path: ({ name, propertyName: propertyNameValue = toCamelCase(name), bindingField, required = true, type = inferType(name, bindingField) }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly bindingField?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): Extract<RouteParameter, { readonly location: { readonly kind: 'path' } }> => create({ name, propertyName: propertyNameValue, bindingField, in: 'path', required, type }) as Extract<RouteParameter, { readonly location: { readonly kind: 'path' } }>,
    query: ({ name, propertyName: propertyNameValue = toCamelCase(name), required = false, type = { kind: 'string' as const } }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): Extract<RouteParameter, { readonly location: { readonly kind: 'query' } }> => create({ name, propertyName: propertyNameValue, in: 'query', required, type }) as Extract<RouteParameter, { readonly location: { readonly kind: 'query' } }>,
    header: ({ name, propertyName: propertyNameValue = toCamelCase(name), required = true, type = { kind: 'string' as const } }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly required?: boolean;
        readonly type?: RouteParameterType;
    }): Extract<RouteParameter, { readonly location: { readonly kind: 'header' } }> => create({ name, propertyName: propertyNameValue, in: 'header', required, type }) as Extract<RouteParameter, { readonly location: { readonly kind: 'header' } }>
});

function inferType(name: string, bindingField?: string): RouteParameterType {
    return relationOptionFold(
        relationValueOption(bindingField),
        () => ({ kind: 'string' as const }),
        () => Object.freeze({ kind: 'model' as const, model: modelReference(toPascalCase(name)) })
    );
}
