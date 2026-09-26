import type { ModelAst } from '../../../../types/upstream/ast';
import type { ModelDefinition, ModelKeyKind } from '../../../../types/upstream/model';
import type { CastType } from '../../../../types/upstream/expression';
import type { ModelSemanticDefinition } from '../../../../types/upstream/model';
import type { Sequence, PropertyNames, Indexes, ForeignKeys } from '../../../../types/upstream/collections';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { PrimitiveVocabulary } from '../../../../types/upstream/primitiveVocabulary';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { ModelCast } from '../../../../types/upstream/model';
import type { ModelAccessorFact, ModelColumnFact } from '../../../../types/upstream/modelSourceFacts';
import type { NumberValue, StringValue, TruthValue } from '../../../../types/upstream/valueObjects';
import { accessorExpression } from './modelAccessorCanonical';
import type { EloquentRelationAst } from '../../../../types/upstream/eloquent';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const num = (value: number): NumberValue => ({ kind: 'number_value', value });
const truth = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const name = (value: string) => ({ kind: 'model_name', value: str(value) } as const);
const property = (value: string) => ({ kind: 'property_name', value: str(value) } as const);
const column = (value: string) => ({ kind: 'column_name', value: str(value) } as const);
const table = (value: string) => ({ kind: 'table_name', value: str(value) } as const);
const primitive = (value: PrimitiveVocabulary): TypeExpression => ({ kind: 'primitive', value });
import { semanticType } from './semanticTypeCanonical';

const exposure = (values: readonly string[]): PropertyNames => ({ kind: 'property_names', items: sequence(values.map(value => property(value))) });


export function modelAstFromSemantic(
    model: ModelSemanticDefinition,
    schema: { readonly indexes: Indexes; readonly foreignKeys: ForeignKeys },
    casts: readonly ModelCast[],
    accessors: readonly ModelAccessorFact[],
    relations: readonly EloquentRelationAst[],
    sourceSpan: SourceSpan
): ModelAst {
    const span = sourceSpan;
    const semanticRelations = relations;
    const semanticAccessors = accessors;
    const accessorBacking = (accessor: ModelAccessorFact) => {
        const backingColumn = model.columnFacts.find((columnFact: ModelColumnFact) =>
            columnFact.property.value.value === accessor.property.value.value
            || columnFact.column.value.value === accessor.property.value.value
        );
        return backingColumn
            ? { kind: 'present' as const, column: backingColumn.column }
            : { kind: 'absent' as const };
    };
    const modelProperties: import('../../../../types/upstream/property').PropertyDefinition[] = [
        ...model.columnFacts.map((item: ModelColumnFact) => ({
            kind: 'property' as const,
            name: item.property,
            type: { kind: 'typed' as const, value: item.type.value },
            presence: item.presence,
            declaration: {
                kind: 'model_attribute' as const,
                model: model.identity.name,
                origin: item.type.kind === 'casted'
                    ? { kind: 'cast_attribute' as const, column: item.column }
                    : { kind: 'database_attribute' as const, column: item.column },
            },
            visibility: { kind: 'implicit' as const },
            storage: { kind: 'dynamic' as const },
            initialization: { kind: 'not_applicable' as const },
            promotion: { kind: 'declared' as const },
            access: { kind: 'read_write' as const },
            source: item.source,
        })),
        ...semanticAccessors.map((item: ModelAccessorFact) => ({
            kind: 'property' as const,
            name: item.property,
            type: item.result.kind === 'present'
                ? { kind: 'typed' as const, value: item.result.type }
                : { kind: 'untyped' as const },
            presence: { kind: 'optional' as const },
            declaration: { kind: 'model_attribute' as const, model: model.identity.name, origin: { kind: 'accessor' as const, method: item.method, backing: accessorBacking(item) } },
            visibility: { kind: 'implicit' as const },
            storage: { kind: 'dynamic' as const },
            initialization: { kind: 'not_applicable' as const },
            promotion: { kind: 'declared' as const },
            access: { kind: 'readable' as const },
            source: item.source,
        })),
        ...semanticRelations.map((item) => ({
            kind: 'property' as const,
            name: item.property,
            type: { kind: 'typed' as const, value: item.semanticType },
            presence: { kind: 'optional' as const },
            declaration: { kind: 'relation_property' as const, model: model.identity.name, relation: item.relation },
            visibility: { kind: 'implicit' as const },
            storage: { kind: 'dynamic' as const },
            initialization: { kind: 'not_applicable' as const },
            promotion: { kind: 'declared' as const },
            access: { kind: 'readable' as const },
            source: item.source,
        })),
    ];
    const modelColumnFacts = model.columnFacts;
    const keySemanticType = (kind: 'number' | 'string'): TypeExpression => {
        switch (kind) {
            case 'number': return primitive({ kind: 'number' });
            case 'string': return primitive({ kind: 'string' });
        }
    };
    const modelKeySemanticType = keySemanticType(model.key.semanticType.kind);
    const keyAutoGenerated = (() => {
        for (const fact of model.columnFacts) {
            if (fact.column.value.value === model.identity.primaryKey.value.value) return fact.autoGenerated;
        }
        throw new Error(`Model boundary violation: primary key column \"${model.identity.primaryKey.value.value}\" has no migration auto-generation fact.`);
    })();
    const surfaceMembers = [
        ...modelColumnFacts,
        ...semanticAccessors,
        ...semanticRelations,
        ...model.methods,
        ...model.constants
    ];
    const modelSchema = { kind: 'model_schema' as const, columns: { kind: 'model_column_facts' as const, items: sequence(modelColumnFacts) }, foreignKeys: schema.foreignKeys, indexes: schema.indexes };
    const definition: ModelDefinition = {
        kind: 'model',
        identity: { kind: 'model_identity', name: name(model.identity.name.value.value), shortName: name(model.identity.shortName.value.value), table: table(model.identity.table.value.value), inheritance: model.inheritance },
        source: span,
        file: sourceSpan.file,
        key: { kind: 'primary_key', column: column(model.identity.primaryKey.value.value), type: model.key.type, semanticType: modelKeySemanticType, autoGenerated: keyAutoGenerated, origin: model.key.origin },
        behavior: { kind: 'model_behavior', incrementing: model.behavior.incrementing, softDeletes: model.behavior.softDeletes, timestamps: model.behavior.timestamps },
        exposure: { kind: 'model_exposure', fillable: exposure(model.exposure.fillable.map(value => value.value.value)), guarded: exposure(model.exposure.guarded.map(value => value.value.value)), hidden: exposure(model.exposure.hidden.map(value => value.value.value)), appends: exposure(model.exposure.appends.map(value => value.value.value)) },
        capabilities: { kind: 'model_source_capabilities', traits: model.capabilities.traits },
        surface: { kind: 'property_surface', properties: { kind: 'properties', items: sequence(modelProperties) } },
        semanticProperties: model.surface.properties,
        schema: modelSchema,
        properties: { kind: 'properties', items: sequence(modelProperties) },
        relations: { kind: 'model_relations', items: sequence(semanticRelations.map((relation) => ({ kind: 'model_relation' as const, name: relation.relation, target: relation.targetModel, type: relation.eloquentType, relation: relation.relation, eloquentType: relation.eloquentType, cardinality: relation.cardinality, multiplicity: relation.multiplicity, targetShape: relation.targetShape, traversalTarget: relation.traversalTarget, semanticType: relation.semanticType, key: relation.foreignKey, source: relation.source }))) },
        casts: { kind: 'model_casts', items: sequence(casts) },
        computed: { kind: 'model_accessors', items: sequence(semanticAccessors.map((accessor: ModelAccessorFact) => ({ kind: 'model_accessor' as const, name: accessor.property, expression: accessorExpression(accessor.computation, accessor.source), source: accessor.source }))) },
        constants: { kind: 'model_constants', items: sequence(model.constants.map(item => ({ kind: 'model_constant' as const, name: item.name, visibility: item.visibility, value: item.value, source: item.source }))) },
        methods: { kind: 'model_methods', items: sequence(model.methods.map(item => ({ kind: 'model_method' as const, name: item.name, visibility: item.visibility, result: item.result, body: item.body, source: item.source }))) },
        semantic: model
    };
    return { kind: 'model_ast', definition, source: span };

}
