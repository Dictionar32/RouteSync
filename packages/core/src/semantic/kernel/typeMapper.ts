/**
 * Declarative semantic type relation catalog.
 */
import { relationResolve, relationFirst, relationOptionFold, type RelationOption } from './relationalSequence';
import { relationAny, relationEqual } from './semanticRelations';

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
  return relationOptionFold(
    hit,
    () => ({ kind: 'none' }),
    match => ({ kind: 'some', value: match[1] }),
  );
};

const contains = (value: string, rules: readonly TypeRule[]): RelationOption<string> => {
  const hit = relationFirst(rules, ([terms]) => containsAny(value, terms));
  return relationOptionFold(
    hit,
    () => ({ kind: 'none' }),
    match => ({ kind: 'some', value: match[1] }),
  );
};

export function mapSqlTypeToTs(sqlType: string): string {
  const value = sqlType.toLowerCase();
  const exactType = exact(value, SQL_EXACT);
  const containedType = contains(value, SQL_CONTAINS);
  return relationOptionFold(
    exactType,
    () => relationOptionFold(containedType, () => 'string', mapped => mapped),
    mapped => relationResolve(
      relationEqual(mapped, '__identity__'),
      () => value,
      () => mapped,
    ),
  );
}

export function mapCastToTs(castType: string, baseType: string): string {
  const cast = contains(castType.toLowerCase(), CAST_CONTAINS);
  return relationOptionFold(cast, () => baseType, mapped => mapped);
}
