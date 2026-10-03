import { eloquentRelationClassifier, type EloquentRelationMethodName } from './eloquentRelationVocabulary';
import { extractClassBasename } from '../../../../utils/resource-naming';
import { expressionFromPhpAst } from '../expressionProducer';
import { createClassName, createModelName, createRelationName } from '../../../../types/upstream/names';
import type { ModelDeclarationAst } from '../../lexer';
import type { ModelName } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { EloquentRelationAst } from '../../../../types/upstream/eloquent';
import { eloquentRelationMultiplicity } from '../../../../types/upstream/modelVocabulary';
import { relationEqual, relationGate, relationOptionFold, relationFirst } from '../../../../semantic/kernel/relationalSequence';
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

const relationMethodName = (value: string): EloquentRelationMethodName => ({ kind: 'eloquent_relation_method_name', value: { kind: 'string_value', value } });

const modelReference = (model: ReturnType<typeof createClassName>): TypeExpression => ({ kind: 'reference', value: { kind: 'class', name: model } });

const produceRelation = (input: EloquentRelationProducerInput): EloquentRelationProductionResult => {
    const { method, returned, sourceModel, source } = input;
    return relationGate(
        relationEqual(returned.kind, 'method_chain'),
        () => {
            const chain = returned as Extract<typeof returned, { kind: 'method_chain' }>;
            return relationGate(
            relationAll([
                relationEqual(chain.receiver.kind, 'variable_reference'),
                relationEqual((chain.receiver as Extract<typeof chain.receiver, { kind: 'variable_reference' }>).name.value, 'this')
            ]),
            () => {
                const relationMethod = relationMethodName(chain.property.value);
                return relationGate(
                    eloquentRelationClassifier.isRelationMethod(relationMethod),
                    () => relationOptionFold(
                        relationFirst(chain.arguments, argument => relationEqual(argument.kind, 'class_reference')),
                        () => ({
                            kind: 'unsupported' as const,
                            method: relationMethod,
                            reason: 'related_model_not_explicit' as const,
                            source
                        }),
                        argument => {
                            const related = argument.value as Extract<typeof argument.value, { kind: 'class_reference' }>;
                            const descriptor = eloquentRelationClassifier.descriptor(relationMethod);
                            const modelName = extractClassBasename(related.className.value);
                            const targetModel = createModelName(modelName);
                            const invocation = expressionFromPhpAst(chain, source.file.value.value);
                            const multiplicity = eloquentRelationMultiplicity(descriptor.cardinality);
                            const semanticType = relationGate(
                                relationEqual(multiplicity.kind, 'collection'),
                                () => ({ kind: 'array' as const, element: modelReference(createClassName(modelName)) }),
                                () => modelReference(createClassName(modelName))
                            );
                            const targetShape = relationGate(
                                relationEqual(multiplicity.kind, 'collection'),
                                () => ({ kind: 'collection' as const, model: targetModel }),
                                () => ({ kind: 'single' as const, model: targetModel })
                            );
                            const traversalTarget = relationGate(
                                relationEqual(multiplicity.kind, 'collection'),
                                () => ({ kind: 'collection' as const, model: targetModel }),
                                () => ({ kind: 'model' as const, model: targetModel })
                            );
                            return { kind: 'produced' as const, relation: {
                                kind: 'eloquent_relation_ast',
                                name: createRelationName(method.name.value),
                                sourceModel,
                                relation: descriptor.relation,
                                eloquentType: descriptor.type,
                                descriptor,
                                targetModel,
                                targetClass: createClassName(modelName),
                                invocation,
                                source,
                                semanticType,
                                targetShape,
                                traversalTarget,
                                key: { kind: 'convention' as const }
                            } };
                        }
                    ),
                    () => ({ kind: 'not_a_relation' as const })
                );
            },
            () => ({ kind: 'not_a_relation' as const })
            );
        },
        () => ({ kind: 'not_a_relation' as const })
    );
};

const relationAll = (conditions: readonly boolean[], index = 0): boolean =>
    relationGate(
        relationEqual(index, conditions.length),
        () => true,
        () => relationGate(conditions[index], () => relationAll(conditions, index + 1), () => false)
    );

export const eloquentRelationProducer: EloquentRelationProducer = {
    produce: produceRelation
};
