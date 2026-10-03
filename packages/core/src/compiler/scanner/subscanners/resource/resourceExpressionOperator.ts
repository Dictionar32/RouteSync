import type { PhpBinaryOperator } from '../../lexer/phpAstTypes';
import { relationFirstOption, relationOptionFold, relationEqual } from '../../../../semantic/kernel/relationalSequence';
import type { SemanticOperator } from '../../../../types/domain/semanticValues';

export function mapResourceBinaryOperator(kind: PhpBinaryOperator['kind']): SemanticOperator['value'] {
  const table: readonly [PhpBinaryOperator['kind'], SemanticOperator['value']][] = [
    ['addition', 'add'], ['subtraction', 'subtract'], ['multiplication', 'multiply'], ['division', 'divide'], ['modulo', 'modulo'],
    ['equal', 'equal'], ['not_equal', 'not_equal'], ['identical', 'equal'], ['not_identical', 'not_equal'], ['less_than', 'less_than'],
    ['greater_than', 'greater_than'], ['less_or_equal', 'less_than_or_equal'], ['greater_or_equal', 'greater_than_or_equal'],
    ['logical_and', 'and'], ['logical_or', 'or'], ['concat', 'concat'], ['null_coalesce', 'null_coalesce'],
  ];
  return relationOptionFold(relationFirstOption(table, entry => relationEqual(entry[0], kind)), () => 'unknown' as SemanticOperator['value'], entry => entry[1]);
}
