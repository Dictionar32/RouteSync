import type { PhpBinaryOperator } from '../../lexer/phpAstTypes';
import type { SemanticOperator } from '../../../../types/domain/semanticValues';

export function mapResourceBinaryOperator(kind: PhpBinaryOperator['kind']): SemanticOperator['value'] {
  switch (kind) {
    case 'addition': return 'add';
    case 'subtraction': return 'subtract';
    case 'multiplication': return 'multiply';
    case 'division': return 'divide';
    case 'modulo': return 'modulo';
    case 'equal': return 'equal';
    case 'not_equal': return 'not_equal';
    case 'identical': return 'equal';
    case 'not_identical': return 'not_equal';
    case 'less_than': return 'less_than';
    case 'greater_than': return 'greater_than';
    case 'less_or_equal': return 'less_than_or_equal';
    case 'greater_or_equal': return 'greater_than_or_equal';
    case 'logical_and': return 'and';
    case 'logical_or': return 'or';
    case 'concat': return 'concat';
    case 'null_coalesce': return 'null_coalesce';
  }
}
