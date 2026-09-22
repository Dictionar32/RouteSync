/**
 * Validation rules are resolved once at the scanner origin boundary.
 * Downstream consumers receive canonical RequestField values.
 */

import type { ValidationRuleNode } from '../../../../types/domain/validationRules';
import { ValidationRuleParser, ValidationRuleNodeFactory } from '../../../../types/domain/validationRules';
import type { PhpArrayEntry, PhpAstValue } from '../../lexer/PhpAst';
import type { TypeInterner } from '../../../types/TypeInterner';
import type { RouteValidationRuleEntry } from '../../../../types/domain/validationRules';
import { ScannedRouteValidationRuleEntry } from '../../descriptors/validation/validationRuleEntry';
import { ScannedRouteValidationRuleSet } from '../../descriptors/validation/validationRuleSet';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { SourceSpan } from '../../../../types/upstream/provenance';

export function partitionValidationRules(
  entries: readonly PhpArrayEntry[],
  interner: TypeInterner,
  sourceFile = '<validation>'
): ScannedRouteValidationRuleSet {
  const validationEntries: RouteValidationRuleEntry[] = entries.map(entry => {
    const fieldName = requireStringArrayKey(entry.key);
    const rules = readValidationRules(entry.value, sourceFile);
    return ScannedRouteValidationRuleEntry.create(fieldName, [], rules, sourceSpanFromPhpRange(entry.source, sourceFile));
  });

  return ScannedRouteValidationRuleSet.create(validationEntries, interner);
}

export function parseValidationRules(rules: readonly string[]): readonly ValidationRuleNode[] {
  return ValidationRuleParser.parseAll(rules);
}

function readValidationRules(value: PhpAstValue, sourceFile: string): readonly import('../../../../types/domain/validationRules').ValidationRuleNode[] {
  if (value.kind === 'literal' && value.literalType === 'string') {
    return ValidationRuleParser.parseAll(value.value.split('|').map(item => item.trim()).filter(Boolean));
  }
  if (value.kind === 'nested_array') {
    return Object.freeze(value.entries.flatMap(entry => readValidationRules(entry.value, sourceFile)));
  }
  if (value.kind === 'static_call' && value.className === 'Rule') {
    return Object.freeze([parseFluentRule(value, sourceFile)]);
  }
  if (value.kind === 'method_chain' && value.receiver.kind === 'static_call' && value.receiver.className === 'Rule') {
    return Object.freeze([parseFluentRule(value.receiver, sourceFile, value)]);
  }
  throw new Error('Validation rule value must be a string literal, nested rule array, or supported fluent validation rule');
}

function parseFluentRule(
  call: Extract<PhpAstValue, { kind: 'static_call' }>,
  sourceFile: string,
  chain?: Extract<PhpAstValue, { kind: 'method_chain' }>
): import('../../../../types/domain/validationRules').ValidationRuleNode {
  const args = call.arguments.filter(argument => argument.kind === 'positional');
  const stringArg = (index: number): string | undefined => {
    const argument = args[index];
    return argument?.value.kind === 'literal' && argument.value.literalType === 'string' ? argument.value.value : undefined;
  };
  const table = stringArg(0);
  if (call.method === 'unique' && table) {
    const column = stringArg(1);
    if (chain?.property === 'ignore') {
      const ignore = chain.arguments[0];
      if (!ignore || ignore.kind !== 'positional') throw new Error('Rule::unique()->ignore() requires an expression argument');
      return ValidationRuleNodeFactory.unique(
        SemanticValueFactory.tableName(table),
        column ? { kind: 'explicit_column', column: SemanticValueFactory.columnName(column) } : { kind: 'default_column' },
        { kind: 'ignore', value: mapResourcePhpAstToUpstream(ignore.value, sourceFile) }
      );
    }
    return ValidationRuleNodeFactory.unique(
      SemanticValueFactory.tableName(table),
      column ? { kind: 'explicit_column', column: SemanticValueFactory.columnName(column) } : { kind: 'default_column' }
    );
  }
  if (call.method === 'exists' && table) {
    const column = stringArg(1);
    return ValidationRuleNodeFactory.exists(
      SemanticValueFactory.tableName(table),
      column ? { kind: 'explicit_column', column: SemanticValueFactory.columnName(column) } : { kind: 'default_column' }
    );
  }
  if (call.method === 'in') {
    const first = args[0]?.value;
    if (first?.kind === 'nested_array') {
      const values = first.entries.flatMap(entry => entry.value.kind === 'literal' && entry.value.literalType === 'string' ? [entry.value.value] : []);
      return ValidationRuleNodeFactory.in(values.map(value => ({ kind: 'validation_parameter', value })));
    }
  }
  return ValidationRuleNodeFactory.custom(
    { kind: 'validation_rule_name', value: call.method },
    args.map(argument => ({ kind: 'validation_parameter', value: JSON.stringify(argument.value) }))
  );
}


function requireStringArrayKey(key: PhpArrayEntry['key']): string {
  if (key.kind === 'string') return key.value;
  throw new Error('Validation rule keys must be static string keys');
}

function sourceSpanFromPhpRange(range: PhpArrayEntry['source'], sourceFile: string): SourceSpan {
  return { kind: 'source_span', file: SemanticValueFactory.sourceFilePath(sourceFile), start: { kind: 'number_value', value: range.startOffset }, end: { kind: 'number_value', value: range.endOffset } };
}
