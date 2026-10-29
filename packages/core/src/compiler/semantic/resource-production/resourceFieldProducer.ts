/**
 * Canonical Resource field producer.
 *
 * PHP AST remains evidence here. Meaning is resolved through the model's closed
 * ResourceFieldSemanticAuthorityInterface owns meaning, type, and output-shape judgments.
 * This operation projects that closed judgment into ResourceFieldOutput and expands nested fields.
 */
import type { PhpAstValue, PhpArrayEntry } from '../../frontend/php/PhpAst';
import type { ResourceField, ResourceFieldOutput, ResourceFieldPresence, ResourceDynamicEntry } from '../../../types/upstream/resource';
import type { ResourceReference } from '../../../types/upstream/semanticReferences';
import type { StringValue } from '../../../types/upstream/valueObjects';
import type { ResourceFields } from '../../../types/upstream/collections';
import type { ExpressionAst } from '../../../types/upstream/ast';
import type { Expression } from '../../../types/upstream/expression';
import type { PropertyName } from '../../../types/upstream/names';
import type { OriginModelSymbol } from '../model/originModelSymbol';
import { resourceAstExpressionMapping } from './resourceAstExpressionMapping';
import { sourceFileIdentityFactory, stringValue } from '../../../types/upstream/names';
import { expressionAstFromPhpAst } from '../expressionAstCanonical';
import { resourceFieldSemanticAuthority } from '../resourceFieldSemanticAuthority';
import type { ResourceFieldProductionOperationInterface } from '../../../types/upstream/resourceProducerInterface';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const propertyName = (value: string): PropertyName => ({ kind: 'property_name', value: stringValue.create(value) });
const resourceReference = (value: string): ResourceReference => ({ kind: 'resource_reference', name: { kind: 'resource_name', value: stringValue.create(value) } });

const emptySequence = <T>(): import('../../../types/upstream/collections').Sequence<T> => ({ kind: 'empty' });
const sequence = <T>(items: readonly T[]): import('../../../types/upstream/collections').Sequence<T> =>
    items.reduceRight<import('../../../types/upstream/collections').Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), emptySequence<T>());

const keyedEntries = (entries: readonly PhpArrayEntry[]): readonly Extract<PhpArrayEntry, { readonly kind: 'keyed' }>[] =>
    entries.filter((entry): entry is Extract<PhpArrayEntry, { readonly kind: 'keyed' }> => entry.kind === 'keyed');

const stringKey = (entry: Extract<PhpArrayEntry, { readonly kind: 'keyed' }>): string => {
    const key = entry.key;
    if (key.kind !== 'string') {
        throw Error('Resource field requires a static string key at the semantic boundary');
    }
    return key.value;
};

const nestedFields = (
    entries: readonly PhpArrayEntry[],
    file: string,
    resource: string,
    model: OriginModelSymbol,
): ResourceFields => ({
    kind: 'resource_fields',
    items: sequence(keyedEntries(entries).map(entry => resourceFieldProducer.produce({ entryKey: stringKey(entry), value: entry.value, file, resource, model }))),
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
    shape: import('../../../types/upstream/resourceFieldSemanticAuthorityInterface').ResourceFieldOutputShapeJudgment,
): ResourceFieldOutput => {
    if (shape.kind === 'resource') {
        return { kind: 'resource', resource: resourceReference(shape.resourceName.value), expression };
    }
    if (shape.kind === 'resource_collection') {
        return { kind: 'resource_collection', resource: resourceReference(shape.resourceName.value), expression };
    }
    if (shape.kind === 'nested_object') {
        if (value.kind === 'nested_array') {
            return nestedOutput(value, expression, file, resource, model);
        }
        throw Error('Resource field output-shape judgment disagrees with its source evidence');
    }
    if (shape.kind === 'scalar_or_expression') {
        return { kind: 'scalar_or_expression', expression };
    }
    throw Error('Resource field output-shape judgment is not projectable');
};

const buildResourceField = (input: import('../../../types/upstream/resourceProducerInterface').ResourceFieldProducerInput<PhpAstValue, OriginModelSymbol>): ResourceField => {
    const { entryKey, value, file, resource, model } = input;
    const mapped = resourceAstExpressionMapping.map({ value, sourceFile: sourceFileIdentityFactory.create(stringValue.create(file)) });
    const expression = mapped.upstream;
    const expressionAst: ExpressionAst = expressionAstFromPhpAst.project({
        syntax: value,
        expression,
        origin: { kind: 'resource_field', resource: { kind: 'resource_name', value: stringValue.create(resource) }, field: propertyName(entryKey) },
        sourceFile: sourceFileIdentityFactory.create(stringValue.create(file)),
    });
    const presence: ResourceFieldPresence = { kind: 'always_present' };
    const judgment = resourceFieldSemanticAuthority.judge({ value, expression, model });
    return {
        kind: 'resource_field',
        name: propertyName(entryKey),
        expression,
        expressionAst,
        meaning: judgment.meaning,
        type: judgment.type,
        presence,
        output: output(value, expression, file, resource, model, judgment.outputShape),
        source: expression.source,
    };
}


export const resourceFieldProducer: ResourceFieldProductionOperationInterface<PhpAstValue, OriginModelSymbol> = Object.freeze({
    produce: buildResourceField,
});
