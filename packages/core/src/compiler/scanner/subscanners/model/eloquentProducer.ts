import { eloquentRelationClassifier, type EloquentRelationMethodName } from './eloquentRelationVocabulary';
import { extractClassBasename } from '../../../../utils/resource-naming';
import { expressionFromPhpAst } from '../expressionProducer';
import { createClassName, createColumnName, createModelName, createRelationName } from '../../../../types/upstream/names';
import type { ModelDeclarationAst } from '../../lexer';
import type { ModelName } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import { eloquentRelationAstFromDescriptor, type EloquentRelationAst } from '../../../../types/upstream/eloquent';
import { eloquentRelationMultiplicity } from '../../../../types/upstream/modelVocabulary';
import { relationEqual, relationGate, relationOptionFold, relationFirst } from '../../../../semantic/foundation/relationalSequence';
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

const directForeignKeyRelation = (relation: EloquentRelationMethodName): boolean =>
    relation.value.value === 'belongsTo' || relation.value.value === 'hasMany' || relation.value.value === 'hasOne';

const literalStringArgument = (argumentsList: readonly import('../../lexer').PhpArgument[], index: number, name: string): string | undefined => {
    const argument = argumentsList[index];
    if (argument === undefined) return undefined;
    if (argument.kind === 'named' && argument.name !== name) return undefined;
    const value = argument.value;
    return value.kind === 'literal' && value.literalType === 'string' ? value.value : undefined;
};

const relationKeyFromArguments = (
    relation: EloquentRelationMethodName,
    argumentsList: readonly import('../../lexer').PhpArgument[],
): import('../../../../types/upstream/model').RelationKey => {
    if (!directForeignKeyRelation(relation)) return { kind: 'not_applicable' };
    const foreign = literalStringArgument(argumentsList, 1, 'foreignKey');
    const localName = relation.value.value === 'belongsTo' ? 'ownerKey' : 'localKey';
    const local = literalStringArgument(argumentsList, 2, localName);
    if (foreign === undefined) return { kind: 'convention' };
    if (local === undefined) return { kind: 'explicit_foreign', foreign: createColumnName(foreign) };
    return { kind: 'explicit', foreign: createColumnName(foreign), local: createColumnName(local) };
};

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
                            return { kind: 'produced' as const, relation: eloquentRelationAstFromDescriptor({
                                kind: 'eloquent_relation_ast',
                                name: createRelationName(method.name.value),
                                sourceModel,
                                descriptor,
                                targetModel,
                                targetClass: createClassName(modelName),
                                invocation,
                                source,
                                semanticType,
                                targetShape,
                                traversalTarget,
                                key: relationKeyFromArguments(relationMethod, chain.arguments)
                            }) };
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
