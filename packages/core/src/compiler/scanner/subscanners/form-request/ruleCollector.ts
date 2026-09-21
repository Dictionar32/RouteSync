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
  if (value.kind === 'method_chain' && value.receiver.kind === 'static_call') {
    return staticRuleExpression(value.receiver.className, value.receiver.method, value.receiver.arguments);
  }
  if (value.kind === 'static_call') {
    return staticRuleExpression(value.className, value.method, value.arguments);
  }
  throw new Error('Validation rule value must be a string literal, nested rule array, or supported fluent validation rule');
}

function staticRuleExpression(
  className: string,
  method: string,
  args: readonly import('../../lexer/PhpAst').PhpArgument[],
): string {
  if (className !== 'Rule') throw new Error(`Unsupported fluent validation class: ${className}`);
  const values = args.map(argument => {
    if (argument.kind !== 'positional' || argument.value.kind !== 'literal' || argument.value.literalType !== 'string') {
      throw new Error(`Fluent validation rule ${method} requires static string arguments at this boundary`);
    }
    return argument.value.value;
  });
  return `Rule::${method}(${values.map(value => `'${value.replace(/'/g, "\\'")}'`).join(', ')})`;
}


function requireStringArrayKey(key: PhpArrayEntry['key']): string {
  if (key.kind === 'string') return key.value;
  throw new Error('Validation rule keys must be static string keys');
}
