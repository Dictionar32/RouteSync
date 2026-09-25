import { eloquentRelationClassifier, type EloquentRelationMethodName } from './eloquentRelationVocabulary';
import { extractClassBasename } from '../../../../utils/resource-naming';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import type { Sequence } from '../../../../types/upstream/collections';
import { createClassName, createModelName, createRelationName } from '../../../../types/upstream/names';
import type { ModelDeclarationAst } from '../../lexer';
import type { ModelName } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { EloquentRelationAst } from '../../../../types/upstream/eloquent';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';


export type EloquentRelationProducerInput = {
    readonly method: ModelDeclarationAst['methods'][number];
    readonly returned: ModelDeclarationAst['methods'][number]['returns'][number];
    readonly sourceModel: ModelName;
    readonly source: SourceSpan;
};

export type EloquentRelationProductionResult =
    | { readonly kind: 'produced'; readonly relation: EloquentRelationAst }
    | { readonly kind: 'not_a_relation' }
    | {
        readonly kind: 'unsupported';
        readonly method: EloquentRelationMethodName;
        readonly reason: 'related_model_not_explicit';
        readonly source: SourceSpan;
    };

export interface EloquentRelationProducer {
    readonly produce: (input: EloquentRelationProducerInput) => EloquentRelationProductionResult;
}

const sequence = <T>(items: readonly T[]): Sequence<T> =>
    items.reduceRight<Sequence<T>>(
        (tail, head) => ({ kind: 'cons', head, tail }),
        { kind: 'empty' }
    );

const relationMethodName = (value: string): EloquentRelationMethodName => ({ kind: 'eloquent_relation_method_name', value: { kind: 'string_value', value } });

const modelReference = (model: ReturnType<typeof createClassName>): TypeExpression => ({ kind: 'reference', value: { kind: 'class', name: model } });

const produceRelation = (input: EloquentRelationProducerInput): EloquentRelationProductionResult => {
    const { method, returned, sourceModel, source } = input;
    if (returned.kind !== 'method_chain') return { kind: 'not_a_relation' };
    if (returned.receiver.kind !== 'variable_reference' || returned.receiver.name.value !== 'this') return { kind: 'not_a_relation' };
    const relationMethod = relationMethodName(returned.property.value);
    if (!eloquentRelationClassifier.isRelationMethod(relationMethod)) return { kind: 'not_a_relation' };

    const related = returned.arguments[0]?.value;
    if (related?.kind !== 'class_reference') {
        return {
            kind: 'unsupported',
            method: relationMethod,
            reason: 'related_model_not_explicit',
            source
        };
    }

    const descriptor = eloquentRelationClassifier.descriptor(relationMethod);
    const modelName = extractClassBasename(related.className.value);
    const targetModel = createModelName(modelName);
    const invocation = mapResourcePhpAstToUpstream(returned, source.file.value.value);
    const arguments_ = sequence(returned.arguments.map(argument =>
        mapResourcePhpAstToUpstream(argument.value, source.file.value.value)
    ));

    const semanticType: TypeExpression = descriptor.multiplicity.kind === 'collection'
        ? { kind: 'array', element: modelReference(createClassName(modelName)) }
        : modelReference(createClassName(modelName));
    const targetShape = descriptor.multiplicity.kind === 'collection'
        ? { kind: 'collection' as const, model: targetModel }
        : { kind: 'single' as const, model: targetModel };
    const traversalTarget = descriptor.multiplicity.kind === 'collection'
        ? { kind: 'collection' as const, model: targetModel }
        : { kind: 'model' as const, model: targetModel };

    return { kind: 'produced', relation: {
        kind: 'eloquent_relation_ast',
        name: createRelationName(method.name.value),
        sourceModel,
        relation: descriptor.relation,
        eloquentType: descriptor.type,
        descriptor,
        targetModel,
        targetClass: createClassName(modelName),
        arguments: arguments_,
        invocation,
        source,
        semanticType,
        targetShape,
        traversalTarget,
        key: { kind: 'convention' }
    } };
};

export const eloquentRelationProducer: EloquentRelationProducer = {
    produce: produceRelation
};
