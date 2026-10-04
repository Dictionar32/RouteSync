/**
 * Canonical Resource field producer.
 *
 * PHP AST remains evidence here. Meaning is resolved through the model's closed
 * ResolvedPropertyBinding ADT; no parsed Resource descriptor is constructed.
 * Laravel method calls remain source expressions and are interpreted by the
 * relational resource-operation layer rather than by this structural producer.
 */
import type { PhpAstValue, PhpArrayEntry } from '../../lexer/PhpAst';
import type { ResourceField, ResourceFieldMeaning, ResourceFieldOutput, ResourceFieldPresence, ResourceDynamicEntry } from '../../../../types/upstream/resource';
import type { ModelReference, ResourceReference } from '../../../../types/upstream/semanticReferences';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { ResourceFields } from '../../../../types/upstream/collections';
import type { ExpressionAst } from '../../../../types/upstream/ast';
import type { Expression } from '../../../../types/upstream/expression';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { PropertyName, RelationName } from '../../../../types/upstream/names';
import type { OriginModelSymbol } from '../../symbols/model/originModelSymbol';
import { resolveAstValueToExpression } from './resourceAstExpressionMapper';
import { expressionAstFromPhpAst } from '../expressionAstCanonical';
import { semanticType } from '../model/semanticTypeCanonical';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationExpand, relationFoldRight, relationOptionFold, relationProject, relationRefine } from '../../../../semantic/kernel/relationalSequence';
import { matchLookup, type Lookup } from '../../../../types/upstream/collections';
import type { ResolvedPropertyBinding } from '../../symbols/model/types';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: stringValue(value) });
const stringKey = (entry: Extract<PhpArrayEntry, { readonly kind: 'keyed' }>): string => relationOptionFold(
    relationRefine(entry.key, (candidate): candidate is Extract<typeof entry.key, { readonly kind: 'string' }> => relationEqual(candidate.kind, 'string')),
    () => { throw Error('Resource field requires a static string key at the semantic boundary'); },
    value => value.value,
);
const relationName = (value: string): RelationName => ({ kind: 'relation_name', value: stringValue(value) });
const resourceReference = (value: string): ResourceReference => ({ kind: 'resource_reference', name: { kind: 'resource_name', value: stringValue(value) } });
const modelReference = (value: StringValue): ModelReference => ({ kind: 'model_reference', name: { kind: 'model_name', value } });

const emptySequence = <T>(): import('../../../../types/upstream/collections').Sequence<T> => ({ kind: 'empty' });
const sequence = <T>(items: readonly T[]): import('../../../../types/upstream/collections').Sequence<T> =>
    relationFoldRight(items, emptySequence<T>(), (head, tail): import('../../../../types/upstream/collections').Sequence<T> => ({ kind: 'cons', head, tail }));

const keyedEntry = (entry: PhpArrayEntry) => relationRefine(
    entry,
    (candidate): candidate is Extract<PhpArrayEntry, { readonly kind: 'keyed' }> => relationEqual(candidate.kind, 'keyed'),
);

const propertyBinding = (
    value: PhpAstValue,
    model: OriginModelSymbol,
): Lookup<ResolvedPropertyBinding> => relationOptionFold(
    relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'property_access' }> => relationEqual(candidate.kind, 'property_access')),
    () => ({ kind: 'missing' }),
    property => relationOptionFold(
        relationRefine(property.receiver, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'variable_reference' }> => relationEqual(candidate.kind, 'variable_reference')),
        () => ({ kind: 'missing' }),
        () => model.resolveProperty(propertyName(property.property)),
    ),
);

const relationProjection = (
    binding: Extract<ResolvedPropertyBinding, { readonly kind: 'relation' }>,
    expression: Expression,
): ResourceFieldMeaning => ({
    kind: 'relation_projection',
    relation: { kind: 'property_reference', name: binding.propertyName },
    projection: {
        kind: 'resource',
        resource: resourceReference(binding.source.targetModel.value.value),
        targetModel: modelReference(binding.source.targetModel.value),
        cardinality: binding.source.cardinality,
        multiplicity: binding.source.multiplicity,
        targetShape: binding.source.targetShape,
        traversalTarget: binding.source.traversalTarget,
    },
});

const fieldMeaning = (
    value: PhpAstValue,
    expression: Expression,
    model: OriginModelSymbol,
): ResourceFieldMeaning => matchLookup(propertyBinding(value, model), {
    missing: () => ({ kind: 'computed_projection', expression }),
    found: ({ value: binding }) => relationOptionFold(
        relationRefine(binding, (candidate): candidate is Extract<ResolvedPropertyBinding, { readonly kind: 'relation' }> => relationEqual(candidate.kind, 'relation')),
        () => ({
            kind: 'property_projection',
            property: { kind: 'property_reference', name: binding.propertyName },
            model: modelReference(model.name.value),
        }),
        relation => relationProjection(relation, expression),
    ),
});

const fieldType = (value: PhpAstValue, model: OriginModelSymbol): TypeExpression => matchLookup(propertyBinding(value, model), {
    missing: () => ({ kind: 'mixed' }),
    found: ({ value: binding }) => semanticType(binding.semanticType),
});


const nestedFields = (
    entries: readonly PhpArrayEntry[],
    file: string,
    resource: string,
    model: OriginModelSymbol,
): ResourceFields => ({
    kind: 'resource_fields',
    items: sequence(relationProject(
        relationExpand(entries, entry => relationOptionFold(keyedEntry(entry), () => [], keyed => [keyed])),
        entry => produceResourceField(stringKey(entry), entry.value, file, resource, model),
    )),
});


const nestedOutput = (
    value: Extract<PhpAstValue, { readonly kind: 'nested_array' }>,
    expression: Expression,
    file: string,
    resource: string,
    model: OriginModelSymbol,
): ResourceFieldOutput => ({
    kind: 'nested_object',
    fields: nestedFields(value.entries, file, resource, model),
    dynamicEntries: { kind: 'resource_dynamic_entries', items: sequence<ResourceDynamicEntry>([]) },
});

const output = (
    value: PhpAstValue,
    expression: Expression,
    file: string,
    resource: string,
    model: OriginModelSymbol,
): ResourceFieldOutput => relationOptionFold(
    relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'resource_single' }> => relationEqual(candidate.kind, 'resource_single')),
    () => relationOptionFold(
        relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'resource_collection' }> => relationEqual(candidate.kind, 'resource_collection')),
        () => relationOptionFold(
            relationRefine(value, (candidate): candidate is Extract<PhpAstValue, { readonly kind: 'nested_array' }> => relationEqual(candidate.kind, 'nested_array')),
            () => ({ kind: 'scalar_or_expression', expression }),
            nested => nestedOutput(nested, expression, file, resource, model),
        ),
        collection => ({ kind: 'resource_collection', resource: resourceReference(collection.resourceName), expression }),
    ),
    single => ({ kind: 'resource', resource: resourceReference(single.resourceName), expression }),
);

export function produceResourceField(
    entryKey: string,
    value: PhpAstValue,
    file: string,
    resource: string,
    model: OriginModelSymbol,
): ResourceField {
    const mapped = resolveAstValueToExpression(value, file);
    const expression = mapped.upstream;
    const expressionAst: ExpressionAst = expressionAstFromPhpAst(
        value,
        expression,
        { kind: 'resource_field', resource: { kind: 'resource_name', value: stringValue(resource) }, field: propertyName(entryKey) },
        file,
    );
    const presence: ResourceFieldPresence = { kind: 'always_present' };
    return {
        kind: 'resource_field',
        name: propertyName(entryKey),
        expression,
        expressionAst,
        meaning: fieldMeaning(value, expression, model),
        type: fieldType(value, model),
        presence,
        output: output(value, expression, file, resource, model),
        source: expression.source,
    };
}
