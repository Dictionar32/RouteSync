import type { ModelAst } from '../../../../types/upstream/ast';
import type { ModelDefinition, ModelKeyKind, RelationKind } from '../../../../types/upstream/model';
import type { ModelKeyType } from '../../../../types/domain/modelContracts';
import type { CastType } from '../../../../types/upstream/expression';
import type { ParsedModel } from '../../../../types/domain/models';
import type { ParsedColumn } from '../../../../types/domain/databaseColumns';
import type { Sequence, PropertyNames } from '../../../../types/upstream/collections';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { PrimitiveVocabulary, Cardinality } from '../../../../types/upstream/primitiveVocabulary';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { ModelFacts, ModelColumnFact } from '../../../../types/upstream/modelSourceFacts';
import type { TokenDescriptor } from '../../LaravelSourceLexer';
import type { ParsedCast, ParsedRelation } from '../../../../types/domain/eloquentTypes';
import type { NumberValue, StringValue, TruthValue } from '../../../../types/upstream/valueObjects';
import { type SemanticType } from '../../../types/SemanticType';
import { parseModelSourceFacts } from './modelSourceFactsParser';
import { accessorExpression } from './modelAccessorCanonical';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const num = (value: number): NumberValue => ({ kind: 'number_value', value });
const truth = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const sourceSpan = (file: string, length: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: str(file) }, start: num(0), end: num(length) });
const name = (value: string) => ({ kind: 'model_name', value: str(value) } as const);
const property = (value: string) => ({ kind: 'property_name', value: str(value) } as const);
const column = (value: string) => ({ kind: 'column_name', value: str(value) } as const);
const table = (value: string) => ({ kind: 'table_name', value: str(value) } as const);
const primitive = (value: PrimitiveVocabulary): TypeExpression => ({ kind: 'primitive', value });
import { semanticType } from './semanticTypeCanonical';
const keyKinds: { readonly [K in ModelKeyType]: ModelKeyKind } = { int: { kind: 'integer' }, bigint: { kind: 'big_integer' }, string: { kind: 'string' }, uuid: { kind: 'uuid' }, ulid: { kind: 'ulid' } };

const castKinds: { readonly [K in ParsedCast['castKind']]: CastType } = { integer: { kind: 'integer' }, float: { kind: 'float' }, decimal: { kind: 'float' }, boolean: { kind: 'boolean' }, string: { kind: 'string' }, datetime: { kind: 'date_time' }, date: { kind: 'date_time' }, timestamp: { kind: 'date_time' }, array: { kind: 'array' }, json: { kind: 'json' }, object: { kind: 'json' }, collection: { kind: 'array' }, encrypted: { kind: 'string' }, custom: { kind: 'string' } };
const relationKinds: { readonly [K in ParsedRelation['type']]: RelationKind } = { hasOne: { kind: 'has_one' }, hasMany: { kind: 'has_many' }, belongsTo: { kind: 'belongs_to' }, belongsToMany: { kind: 'belongs_to_many' }, hasOneThrough: { kind: 'has_one_through' }, hasManyThrough: { kind: 'has_many_through' }, morphTo: { kind: 'morph_to' }, morphOne: { kind: 'morph_one' }, morphMany: { kind: 'morph_many' }, morphToMany: { kind: 'morph_to_many' }, morphedByMany: { kind: 'morphed_by_many' } };
const castType = (cast: ParsedCast): CastType => castKinds[cast.castKind];
const castExpressionType = (cast: ParsedCast): TypeExpression => primitive({ kind: ({ integer: 'number', float: 'number', decimal: 'number', boolean: 'boolean', string: 'string', datetime: 'date_time', date: 'date_time', timestamp: 'date_time', array: 'json', json: 'json', object: 'json', collection: 'json', encrypted: 'string', custom: 'string' } as const)[cast.castKind] });
const relationCardinalities: { readonly many: Cardinality; readonly one: Cardinality } = { many: { kind: 'many' }, one: { kind: 'one' } };
const relationCardinality = (value: ParsedRelation['cardinality']): Cardinality => relationCardinalities[value];
const relationKey = (relation: ParsedRelation) => 'column' in relation.foreignKey ? { kind: 'explicit' as const, foreign: column(relation.foreignKey.column.value), local: column('id') } : { kind: 'convention' as const };
const properties = (model: ParsedModel, span: SourceSpan) => model.source.columns.map((item: ParsedColumn) => ({ kind: 'property' as const, name: property(item.propertyName), value: { kind: 'typed' as const, type: semanticType(item.semanticType) }, presence: { kind: 'required' as const }, origin: { kind: 'column' as const, column: column(item.name) }, source: span }));
const exposure = (values: readonly { readonly value: string }[]): PropertyNames => ({ kind: 'property_names', items: sequence(values.map(value => property(value.value))) });


export function modelAstFromParsed(model: ParsedModel, file: string, length: number, tokens: readonly TokenDescriptor[]): ModelAst {
    const span = sourceSpan(file, length);
    const semanticProperties = model.semantic.surface.properties;
    const relations = semanticProperties.filter((item): item is Extract<typeof item, { readonly kind: 'relation' }> => item.kind === 'relation');
    const accessors = semanticProperties.filter((item): item is Extract<typeof item, { readonly kind: 'accessor' }> => item.kind === 'accessor');
    const modelProperties = properties(model, span);
    const factsSource = parseModelSourceFacts(tokens, span);
    const modelColumnFacts = model.source.columnFacts;
    const keySemanticType = (kind: 'number' | 'string'): TypeExpression => {
        switch (kind) {
            case 'number': return primitive({ kind: 'number' });
            case 'string': return primitive({ kind: 'string' });
        }
    };
    const modelKeySemanticType = keySemanticType(model.semantic.key.semanticType.kind);
    const definition: ModelDefinition = {
        kind: 'model',
        identity: { kind: 'model_identity', name: name(model.semantic.identity.name.value), shortName: name(model.semantic.identity.shortName.value), table: table(model.semantic.identity.table.value), inheritance: factsSource.inheritance },
        source: span,
        file: { kind: 'source_file', value: str(file) },
        key: { kind: 'primary_key', column: column(model.semantic.identity.primaryKey.value), type: keyKinds[model.semantic.key.type], semanticType: modelKeySemanticType, autoGenerated: truth(model.semantic.behavior.incrementing) },
        behavior: { kind: 'model_behavior', incrementing: truth(model.semantic.behavior.incrementing), softDeletes: truth(model.semantic.behavior.softDeletes), timestamps: truth(model.semantic.behavior.timestamps) },
        exposure: { kind: 'model_exposure', fillable: exposure(model.semantic.exposure.fillable), guarded: exposure(model.semantic.exposure.guarded), hidden: exposure(model.semantic.exposure.hidden), appends: exposure(model.semantic.exposure.appends) },
        capabilities: { kind: 'model_source_capabilities', traits: factsSource.traits },
        surface: { kind: 'property_surface', properties: { kind: 'properties', items: sequence(modelProperties) } },
        schema: { kind: 'model_schema', columns: { kind: 'model_column_facts', items: sequence(modelColumnFacts) }, foreignKeys: { kind: 'foreign_keys', items: sequence([]) }, indexes: { kind: 'indexes', items: sequence([]) } },
        properties: { kind: 'properties', items: sequence(modelProperties) },
        relations: { kind: 'model_relations', items: sequence(relations.map((relation: ParsedRelation) => ({ kind: 'model_relation' as const, name: { kind: 'relation_name' as const, value: str(relation.name.value) }, target: { kind: 'model_name' as const, value: str(relation.targetModel.value) }, relation: relationKinds[relation.type], cardinality: relationCardinality(relation.cardinality), key: relationKey(relation), source: span }))) },
        casts: { kind: 'model_casts', items: sequence(model.source.casts.map((cast: ParsedCast) => ({ kind: 'model_cast' as const, property: { kind: 'property_name' as const, value: str(cast.column.value) }, target: castType(cast), source: span }))) },
        computed: { kind: 'model_accessors', items: sequence(accessors.map(accessor => ({ kind: 'model_accessor' as const, name: property(accessor.propertyName.value), expression: accessorExpression(accessor.computation, span), source: span }))) },
        constants: { kind: 'model_constants', items: sequence(factsSource.constants.map(item => ({ kind: 'model_constant' as const, name: item.name, value: item.value, source: item.source }))) },
        methods: { kind: 'model_methods', items: sequence(factsSource.methods.map(item => ({ kind: 'model_method' as const, name: item.name, result: item.result, body: item.body, source: item.source }))) }
    };
    const surfaceMembers = [
        ...modelColumnFacts,
        ...accessors.map(accessor => ({ kind: 'model_accessor' as const, property: property(accessor.propertyName.value), method: { kind: 'method_name' as const, value: str(accessor.name.value) }, result: semanticType(accessor.computation.result), source: span })),
        ...relations.map((relation: ParsedRelation) => ({ kind: 'model_relation' as const, name: { kind: 'relation_name' as const, value: str(relation.name.value) }, target: { kind: 'model_name' as const, value: str(relation.targetModel.value) }, relation: relationKinds[relation.type], cardinality: relationCardinality(relation.cardinality), key: relationKey(relation), source: span })),
        ...factsSource.methods,
        ...factsSource.constants
    ];
    const facts: ModelFacts = { kind: 'model_facts', identity: { kind: 'model_identity_facts', name: name(model.semantic.identity.name.value), shortName: name(model.semantic.identity.shortName.value), table: table(model.semantic.identity.table.value), inheritance: factsSource.inheritance, source: span }, key: { kind: 'model_key_facts', column: column(model.semantic.identity.primaryKey.value), type: keyKinds[model.semantic.key.type], semanticType: modelKeySemanticType, autoGenerated: truth(model.semantic.behavior.incrementing) }, behavior: { kind: 'model_behavior_facts', incrementing: truth(model.semantic.behavior.incrementing), softDeletes: truth(model.semantic.behavior.softDeletes), timestamps: truth(model.semantic.behavior.timestamps) }, exposure: { kind: 'model_exposure_facts', fillable: sequence(model.semantic.exposure.fillable.map(value => property(value.value.value))), guarded: sequence(model.semantic.exposure.guarded.map(value => property(value.value.value))), hidden: sequence(model.semantic.exposure.hidden.map(value => property(value.value.value))), appends: sequence(model.semantic.exposure.appends.map(value => property(value.value.value))) }, capabilities: factsSource.traits, surface: { kind: 'model_surface_facts', members: sequence(surfaceMembers) }, source: span };
    return { kind: 'model_ast', definition, facts, source: span };
}
