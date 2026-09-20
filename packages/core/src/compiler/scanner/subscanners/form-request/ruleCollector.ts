/**
 * Validation rules are resolved once at the scanner origin boundary.
 * Downstream consumers receive canonical RequestField values.
 */

import type { ValidationRuleNode } from '../../../../types/route';
import { ValidationRuleParser } from '../../../../types/route';
import type { PhpArrayEntry, PhpAstValue } from '../../lexer/PhpAst';
import type { TypeInterner } from '../../../types/TypeInterner';
import type { RouteValidationRuleEntry } from '../../../../types/domain/validationRules';
import { ScannedRouteValidationRuleEntry } from '../../descriptors/validation/validationRuleEntry';
import { ScannedRouteValidationRuleSet } from '../../descriptors/validation/validationRuleSet';

export function partitionValidationRules(
  entries: readonly PhpArrayEntry[],
  interner: TypeInterner
): ScannedRouteValidationRuleSet {
  const validationEntries: RouteValidationRuleEntry[] = entries.map(entry => {
    const fieldName = requireStringArrayKey(entry.key);
    const ruleStr = readRuleExpression(entry.value);
    const rules = ruleStr
      .split('|')
      .map(value => value.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
    return ScannedRouteValidationRuleEntry.create(fieldName, rules);
  });

  return ScannedRouteValidationRuleSet.create(validationEntries, interner);
}

export function parseValidationRules(rules: readonly string[]): readonly ValidationRuleNode[] {
  return ValidationRuleParser.parseAll(rules);
}

function readRuleExpression(value: PhpAstValue): string {
  if (value.kind === 'literal' && value.literalType === 'string') return value.value;
  if (value.kind === 'nested_array') {
    return value.entries.map(entry => readRuleExpression(entry.value)).join('|');
  }
  throw new Error('Validation rule value must be a string literal or nested array of string literals');
}

function requireStringArrayKey(key: PhpArrayEntry['key']): string {
  if (key.kind === 'string') return key.value;
  throw new Error('Validation rule keys must be static string keys');
}
