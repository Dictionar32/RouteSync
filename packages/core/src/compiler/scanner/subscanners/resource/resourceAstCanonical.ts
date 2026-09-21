import type { ResourceAst } from '../../../../types/upstream/ast';
import type { ResourceDefinition, ResourceField, ResourceFieldMeaning } from '../../../../types/upstream/resource';
import type { ParsedResource } from '../../../../types/domain/expressions';
import type { PhpArrayEntry } from '../../lexer/PhpAst';
import { mapResourcePhpAstToUpstream } from './resourceUpstreamExpressionCanonical';
import { semanticType } from '../model/semanticTypeCanonical';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { StringValue, NumberValue, TruthValue } from '../../../../types/upstream/valueObjects';
import type { Sequence, Properties, Assignments, ResourceActions, RoutePaths } from '../../../../types/upstream/collections';
import type { PropertyDefinition } from '../../../../types/upstream/property';
import type { ModelReference, ResourceReference, ResponseReference, PropertyReference } from '../../../../types/upstream/semanticReferences';
import type { PropertyName, ResourceName, ResponseTypeName, ModelName } from '../../../../types/upstream/names';
import type { Presence } from '../../../../types/upstream/primitiveVocabulary';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const num = (value: number): NumberValue => ({ kind: 'number_value', value });
const truth = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const seq = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const span = (file: string, length: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: str(file) }, start: num(0), end: num(length) });
const resourceName = (value: string): ResourceName => ({ kind: 'resource_name', value: str(value) });
const modelName = (value: string): ModelName => ({ kind: 'model_name', value: str(value) });
const responseName = (value: string): ResponseTypeName => ({ kind: 'response_type_name', value: str(value) });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: str(value) });
const modelRef = (value: string): ModelReference => ({ kind: 'model_reference', name: modelName(value) });
const resourceRef = (value: string): ResourceReference => ({ kind: 'resource_reference', name: resourceName(value) });
const responseRef = (value: string): ResponseReference => ({ kind: 'response_reference', name: responseName(value) });
const propertyRef = (value: string): PropertyReference => ({ kind: 'property_reference', name: propertyName(value) });

const emptyAssignments: Assignments = { kind: 'assignments', items: seq([]) };
const emptyActions: ResourceActions = { kind: 'resource_actions', items: seq([]) };
const emptyPaths: RoutePaths = { kind: 'route_paths', items: seq([]) };

function meaning(field: ParsedResource['surface']['fields'][number], raw: PhpArrayEntry['value'], file: string, resource: string, model: string): ResourceFieldMeaning {
    const bound = field.semantic.kind === 'verified' ? field.semantic.bound : undefined;
    if (bound?.kind === 'bound_model_column') return { kind: 'property_projection', property: propertyRef(field.name.value), model: modelRef(model) };
    if (bound?.kind === 'bound_relation') return { kind: 'relation_projection', relation: propertyRef(field.name.value), resource: resourceRef(resource) };
    return { kind: 'computed_projection', expression: mapResourcePhpAstToUpstream(raw, file) };
}

export function resourceAstFromParsed(
    resource: ParsedResource,
    entries: readonly PhpArrayEntry[],
    file: string,
    length: number,
): ResourceAst {
    const source = span(file, length);
    const expressionByName = new Map(entries.flatMap(entry => entry.kind === 'keyed' && entry.key.kind === 'string' ? [[entry.key.value, entry.value] as const] : []));
    const fields: ResourceField[] = resource.surface.fields.map(field => {
        const raw = expressionByName.get(field.name.value);
        if (raw === undefined) throw new Error(`Resource field '${field.name.value}' has no source expression at the AST boundary`);
        const type = field.semantic.kind === 'verified' ? semanticType(field.semantic.type) : ({ kind: 'error', diagnostic: str('rejected_resource_field') } as const);
        const presence: Presence = { kind: 'required' };
        return {
            kind: 'resource_field',
            name: propertyName(field.name.value),
            expression: mapResourcePhpAstToUpstream(raw, file),
            meaning: meaning(field, raw, file, resource.identity.name.value.value, resource.binding.model.kind === 'model' ? resource.binding.model.modelName.value.value : (() => { throw new Error(`Resource '${resource.identity.name.value.value}' is not bound to a model at the AST boundary`); })()),
            type,
            presence,
            source,
        };
    });
    const properties: PropertyDefinition[] = fields.map(field => ({ kind: 'property', name: field.name, type: field.type, presence: field.presence, origin: { kind: 'computed' }, source }));
    const definition: ResourceDefinition = {
        kind: 'resource',
        name: resourceName(resource.identity.name.value.value),
        baseName: resourceName(resource.identity.baseName.value.value),
        model: modelRef(resource.binding.model.kind === 'model' ? resource.binding.model.modelName.value.value : (() => { throw new Error(`Resource '${resource.identity.name.value.value}' is not bound to a model at the AST boundary`); })()),
        response: responseRef(resource.identity.typeName.value.value),
        fields: { kind: 'resource_fields', items: seq(fields) },
        assignments: emptyAssignments,
        sourceProperties: { kind: 'properties', items: seq(properties) } as Properties,
        actions: emptyActions,
        endpoints: emptyPaths,
        synthetic: truth(resource.provenance.synthetic),
        source,
    };
    return { kind: 'resource_ast', definition, source };
}
