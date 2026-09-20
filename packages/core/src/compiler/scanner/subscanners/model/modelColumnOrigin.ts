import type { ParsedCast } from '../../../../types/domain/eloquentTypes';
import type { ParsedColumn } from '../../../../types/domain/databaseColumns';
import type { ModelColumnFact, ModelColumnType } from '../../../../types/upstream/modelSourceFacts';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { CastType } from '../../../../types/upstream/expression';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { DatabaseType } from '../../../../types/upstream/databaseVocabulary';
import type { PrimitiveVocabulary, Nullability } from '../../../../types/upstream/primitiveVocabulary';
import type { NumberValue, StringValue, TruthValue } from '../../../../types/upstream/valueObjects';
import { semanticType } from './semanticTypeCanonical';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const num = (value: number): NumberValue => ({ kind: 'number_value', value });
const truth = (value: boolean): TruthValue => ({ kind: 'truth_value', value });
const property = (value: string) => ({ kind: 'property_name' as const, value: str(value) });
const column = (value: string) => ({ kind: 'column_name' as const, value: str(value) });
const primitive = (value: PrimitiveVocabulary): TypeExpression => ({ kind: 'primitive', value });

const castKinds: { readonly [K in ParsedCast['castKind']]: CastType } = {
    integer: { kind: 'integer' }, float: { kind: 'float' }, decimal: { kind: 'float' }, boolean: { kind: 'boolean' },
    string: { kind: 'string' }, datetime: { kind: 'date_time' }, date: { kind: 'date_time' }, timestamp: { kind: 'date_time' },
    array: { kind: 'array' }, json: { kind: 'json' }, object: { kind: 'json' }, collection: { kind: 'array' }, encrypted: { kind: 'string' }, custom: { kind: 'string' }
};

const castExpressionKinds: { readonly [K in ParsedCast['castKind']]: PrimitiveVocabulary } = {
    integer: { kind: 'number' }, float: { kind: 'number' }, decimal: { kind: 'number' }, boolean: { kind: 'boolean' },
    string: { kind: 'string' }, datetime: { kind: 'date_time' }, date: { kind: 'date_time' }, timestamp: { kind: 'date_time' },
    array: { kind: 'json' }, json: { kind: 'json' }, object: { kind: 'json' }, collection: { kind: 'json' }, encrypted: { kind: 'string' }, custom: { kind: 'string' }
};

const databaseKinds: { readonly [K in ParsedColumn['type']['kind']]: DatabaseType } = {
    bigint: { kind: 'integer', width: { kind: 'big' }, signed: truth(true) }, integer: { kind: 'integer', width: { kind: 'normal' }, signed: truth(true) },
    smallint: { kind: 'integer', width: { kind: 'small' }, signed: truth(true) }, tinyint: { kind: 'integer', width: { kind: 'tiny' }, signed: truth(true) },
    float: { kind: 'decimal', precision: num(0), scale: num(0) }, double: { kind: 'decimal', precision: num(0), scale: num(0) }, decimal: { kind: 'decimal', precision: num(0), scale: num(0) },
    boolean: { kind: 'boolean' }, string: { kind: 'string', length: num(0) }, text: { kind: 'text' }, mediumtext: { kind: 'text' }, longtext: { kind: 'text' },
    date: { kind: 'date_time' }, datetime: { kind: 'date_time' }, timestamp: { kind: 'date_time' }, time: { kind: 'date_time' }, json: { kind: 'json' },
    enum: { kind: 'enum', values: { kind: 'string_values', items: { kind: 'empty' } } }, binary: { kind: 'string', length: num(0) }, uuid: { kind: 'string', length: num(0) }, ulid: { kind: 'string', length: num(0) }, unsupported: { kind: 'string', length: num(0) }
};

const nullabilityKinds: { readonly nullable: Nullability; readonly non_nullable: Nullability } = {
    nullable: { kind: 'nullable' }, non_nullable: { kind: 'non_null' }
};

const nullability = (kind: ParsedColumn['nullability']['kind']): Nullability => nullabilityKinds[kind];

export function correlateModelColumnFacts(
    columns: readonly ParsedColumn[],
    casts: readonly ParsedCast[],
    source: SourceSpan
): readonly ModelColumnFact[] {
    const castsByColumn = new Map(casts.map(cast => [cast.column.value, cast] as const));
    return columns.map(item => {
        const cast = castsByColumn.get(item.name);
        const type: ModelColumnType = cast === undefined
            ? { kind: 'native', value: semanticType(item.semanticType) }
            : { kind: 'casted', value: primitive(castExpressionKinds[cast.castKind]), cast: castKinds[cast.castKind], source };
        return {
            kind: 'model_column',
            property: property(item.propertyName),
            column: column(item.name),
            databaseType: databaseKinds[item.type.kind],
            type,
            presence: { kind: 'required' },
            nullability: nullability(item.nullability.kind),
            source
        };
    });
}
