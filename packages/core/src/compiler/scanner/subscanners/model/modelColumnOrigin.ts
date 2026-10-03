import type { ModelCast } from '../../../../types/upstream/model';
import type { ColumnDefinition } from '../../../../types/upstream/databaseVocabulary';
import type { ModelColumnFact, ModelColumnType } from '../../../../types/upstream/modelSourceFacts';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { CastType } from '../../../../types/upstream/expression';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { PrimitiveVocabulary } from '../../../../types/upstream/primitiveVocabulary';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import { semanticType } from './semanticTypeCanonical';

const str = (value: string): StringValue => ({ kind: 'string_value', value });
const property = (value: string) => ({ kind: 'property_name' as const, value: str(value) });
const primitive = (value: PrimitiveVocabulary): TypeExpression => ({ kind: 'primitive', value });

const castKinds: { readonly [K in ModelCast['target']['kind']]: CastType } = { integer: { kind: 'integer' }, float: { kind: 'float' }, boolean: { kind: 'boolean' }, string: { kind: 'string' }, date_time: { kind: 'date_time' }, json: { kind: 'json' } };
const castExpressionKinds: { readonly [K in ModelCast['target']['kind']]: PrimitiveVocabulary } = { integer: { kind: 'number' }, float: { kind: 'number' }, boolean: { kind: 'boolean' }, string: { kind: 'string' }, date_time: { kind: 'date_time' }, json: { kind: 'json' } };

export function correlateModelColumnFacts(
    columns: readonly ColumnDefinition[],
    casts: readonly ModelCast[],
    source: SourceSpan
): readonly ModelColumnFact[] {
    const castsByColumn = relationProject(casts, cast => [cast.property.value.value, cast] as const);
    return relationProject(columns, item => {
        const propertyName = property(item.name.value.value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()));
        const cast = relationLookup(castsByColumn, item.name.value.value);
        const type: ModelColumnType = relationOptionFold(
            cast,
            () => ({ kind: 'native', value: semanticType(item.semanticType) }),
            resolved => ({ kind: 'casted', value: primitive(castExpressionKinds[resolved.target.kind]), cast: castKinds[resolved.target.kind], source }),
        );
        return {
            kind: 'model_column',
            property: propertyName,
            column: item.name,
            databaseType: item.databaseType,
            type,
            presence: item.presence,
            nullability: item.nullability,
            source: item.source
        };
    });
}
