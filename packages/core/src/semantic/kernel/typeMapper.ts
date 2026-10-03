/**
 * Declarative semantic type relation catalog.
 */
import { relationResolve, relationFirst, relationIsSome, type RelationOption } from './relationalSequence';
import { relationAll, relationAny, relationEqual } from './semanticRelations';

type TypeRule = readonly [readonly string[], string];

const SQL_EXACT: TypeRule[] = [
  [['number', 'boolean', 'string', 'any', 'unknown', 'void'], '__identity__'],
  [['mixed'], 'unknown'],
];

const SQL_CONTAINS: TypeRule[] = [
  [['bool', 'tinyint(1)'], 'boolean'],
  [['int', 'decimal', 'float', 'double', 'numeric'], 'number'],
];

const CAST_CONTAINS: TypeRule[] = [
  [['int', 'float', 'double', 'decimal'], 'number'],
  [['bool'], 'boolean'],
  [['array', 'json', 'object', 'collection'], 'json-object'],
  [['date', 'datetime'], 'string'],
];

const containsAny = (value: string, terms: readonly string[], index = 0): boolean =>
  relationResolve(index < terms.length, () => relationAny([value.includes(terms[index]), containsAny(value, terms, index + 1)]), () => false);

const exact = (value: string, rules: readonly TypeRule[]): RelationOption<string> => {
  const hit = relationFirst(rules, ([terms]) => terms.includes(value));
  return relationResolve(
    relationIsSome(hit),
    () => ({ kind: 'some', value: hit.value[1] }),
    () => ({ kind: 'none' }),
  );
};

const contains = (value: string, rules: readonly TypeRule[]): RelationOption<string> => {
  const hit = relationFirst(rules, ([terms]) => containsAny(value, terms));
  return relationResolve(
    relationIsSome(hit),
    () => ({ kind: 'some', value: hit.value[1] }),
    () => ({ kind: 'none' }),
  );
};

export function mapSqlTypeToTs(sqlType: string): string {
  const value = sqlType.toLowerCase();
  const exactType = exact(value, SQL_EXACT);
  const containedType = contains(value, SQL_CONTAINS);
  return relationResolve(
    relationAll([relationIsSome(exactType), relationEqual(exactType.value, '__identity__')]),
    () => value,
    () => relationResolve(
      relationIsSome(exactType),
      () => exactType.value,
      () => relationResolve(relationIsSome(containedType), () => containedType.value, () => 'string'),
    ),
  );
}

export function mapCastToTs(castType: string, baseType: string): string {
  const cast = contains(castType.toLowerCase(), CAST_CONTAINS);
  return relationResolve(relationIsSome(cast), () => cast.value, () => baseType);
}
