import {
  relationAll,
  relationFold,
  relationFirst,
  relationGate,
  relationOptionFold,
  relationProject,
  relationSelect,
  relationSome,
  type RelationOption,
} from '../../../../semantic/foundation/relationalSequence';
import { relationEqual, relationNormalizeWhitespace } from '../../../../semantic/foundation/semanticRelations';

/**
 * Validation rules are resolved once at the scanner origin boundary.
 * The scanner contributes evidence; relation rules select and normalize the
 * canonical validation representation consumed downstream.
 */

import type { ValidationDatabaseColumn, ValidationRuleNode } from '../../../../types/domain/validationRules';
import { ValidationRuleParser, ValidationRuleNodeFactory } from '../../../../types/domain/validationRules';
import type { PhpArgument, PhpArrayEntry, PhpAstValue, PhpLiteralValue } from '../../lexer/PhpAst';
import type { TypeInterner } from '../../../types/TypeInterner';
import type { RouteValidationRuleEntry } from '../../../../types/domain/validationRules';
import { CanonicalRouteValidationRuleEntry } from './canonicalValidationRuleEntry';
import type { RouteValidationRuleSet } from '../../descriptors/validation/validationRuleSet';
import { RouteSemanticFlowValidationRuleSet } from '../../descriptors/validation/validationRuleSet';
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { SourceSpan } from '../../../../types/upstream/provenance';

type StaticRuleCall = PhpAstValue & { readonly kind: 'static_call' };
type RuleChain = PhpAstValue & { readonly kind: 'method_chain' };

type RuleStringOption = RelationOption<string>;

export function parseCanonicalValidationRuleEntries(
  entries: readonly PhpArrayEntry[],
  sourceFile = '<validation>'
): readonly RouteValidationRuleEntry[] {
  const output = relationFold(entries, [] as RouteValidationRuleEntry[], (current, entry) => {
    const fieldName = requireStringArrayKey(entry);
    const rules = readValidationRules(entry.value, sourceFile);
    return [...current, CanonicalRouteValidationRuleEntry.create(fieldName, [], rules, sourceSpanFromPhpRange(entry.source, sourceFile))];
  });
  return Object.freeze(output);
}

export function partitionValidationRules(
  entries: readonly PhpArrayEntry[],
  interner: TypeInterner,
  sourceFile = '<validation>'
): RouteValidationRuleSet {
  const validationEntries = parseCanonicalValidationRuleEntries(entries, sourceFile);
  return RouteSemanticFlowValidationRuleSet.create(validationEntries, interner);
}

export function parseValidationRules(rules: readonly string[]): readonly ValidationRuleNode[] {
  return ValidationRuleParser.parseAll(rules);
}

function readValidationRules(value: PhpAstValue, sourceFile: string): readonly ValidationRuleNode[] {
  const literalRules = relationGate(
    relationEqual(readStringLiteral(value).kind, 'some'),
    () => {
      const literal = value as PhpAstValue & { readonly kind: 'literal'; readonly literalType: 'string'; readonly value: string };
      const segments = literal.value.split('|');
      const normalized = relationFold(segments, [] as string[], (current, item) => {
        const rule = relationNormalizeWhitespace(item);
        return relationGate(rule.length > 0, () => [...current, rule], () => current);
      });
      return ValidationRuleParser.parseAll(normalized);
    },
    () => [] as ValidationRuleNode[],
  );

  const nestedRules = relationGate(
    relationEqual(value.kind, 'nested_array'),
    () => {
      const nested = value as PhpAstValue & { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] };
      return Object.freeze(relationFold(nested.entries, [] as ValidationRuleNode[], (current, entry) => [
        ...current,
        ...readValidationRules(entry.value, sourceFile),
      ]));
    },
    () => [] as ValidationRuleNode[],
  );

  const staticRule = relationGate(
    relationAll([relationEqual(value.kind, 'static_call'), relationAll([relationEqual(value.kind, 'static_call'), relationEqual((value as StaticRuleCall).className, 'Rule')])]),
    () => {
      const call = value as StaticRuleCall;
      return [parseFluentRule(call, sourceFile)];
    },
    () => [] as ValidationRuleNode[],
  );

  const chainedRule = relationGate(
    relationAll([
      relationEqual(value.kind, 'method_chain'),
      relationAll([relationEqual(value.kind, 'method_chain'), relationEqual((value as RuleChain).receiver.kind, 'static_call')]),
      relationAll([relationEqual(value.kind, 'method_chain'), relationEqual((value as RuleChain).receiver.kind, 'static_call'), relationEqual(((value as RuleChain).receiver as StaticRuleCall).className, 'Rule')]),
    ]),
    () => {
      const chain = value as RuleChain;
      return [parseFluentRule(chain.receiver as StaticRuleCall, sourceFile, relationSome(chain))];
    },
    () => [] as ValidationRuleNode[],
  );

  const collected = [...literalRules, ...nestedRules, ...staticRule, ...chainedRule];
  return relationGate(collected.length > 0, () => Object.freeze(collected), () => {
    throw Error('Validation rule value must be a string literal, nested rule array, or supported fluent validation rule');
  });
}

function parseFluentRule(
  call: StaticRuleCall,
  sourceFile: string,
  chain: RelationOption<RuleChain> = { kind: 'none' },
): ValidationRuleNode {
  const args = relationSelect(call.arguments, argument => relationEqual(argument.kind, 'positional'));
  const positional = (index: number): RelationOption<PhpArgument> =>
    relationFirst(args, (_argument, candidateIndex) => relationEqual(candidateIndex, index));

  const stringArg = (index: number): RuleStringOption => relationOptionFold(
    positional(index),
    () => ({ kind: 'none' }),
    argument => readStringLiteral(argument.value),
  );

  const table = stringArg(0);
  const uniqueCandidate = relationGate(
    relationAll([relationEqual(call.method, 'unique'), relationEqual(table.kind, 'some')]),
    () => relationOptionFold(table, () => customRule(call, args), tableName => {
      const column = stringArg(1);
      const ignored = relationGate(
        relationAll([relationEqual(chain.kind, 'some'), relationOptionFold(chain, () => false, value => relationEqual(value.property, 'ignore'))]),
        () => relationOptionFold(
          relationOptionFold(chain, () => ({ kind: 'none' } as RelationOption<PhpArgument>), value => relationFirst(value.arguments, candidate => relationEqual(candidate.kind, 'positional'))),
          () => { throw Error('Rule::unique()->ignore() requires an expression argument'); },
          ignore => ValidationRuleNodeFactory.unique(
            SemanticValueFactory.tableName(tableName),
            columnDescriptor(column),
            { kind: 'ignore', value: mapResourcePhpAstToUpstream(ignore.value, sourceFile) },
          ),
        ),
        () => ValidationRuleNodeFactory.unique(
          SemanticValueFactory.tableName(tableName),
          columnDescriptor(column),
        ),
      );
      return ignored;
    }),
    () => customRule(call, args),
  );

  const existsCandidate = relationGate(
    relationAll([relationEqual(call.method, 'exists'), relationEqual(table.kind, 'some')]),
    () => relationOptionFold(table, () => customRule(call, args), tableName => {
      const column = stringArg(1);
      return ValidationRuleNodeFactory.exists(
        SemanticValueFactory.tableName(tableName),
        columnDescriptor(column),
      );
    }),
    () => customRule(call, args),
  );

  const inCandidate = relationGate(
    relationEqual(call.method, 'in'),
    () => relationOptionFold(
      positional(0),
      () => customRule(call, args),
      argument => relationGate(
        relationEqual(argument.value.kind, 'nested_array'),
        () => {
          const nested = argument.value as PhpAstValue & { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] };
          const values = relationFold(nested.entries, [] as string[], (current, entry) => relationGate(
            relationEqual(readStringLiteral(entry.value).kind, 'some'),
            () => [...current, relationOptionFold(readStringLiteral(entry.value), () => '', value => value)],
            () => current,
          ));
          return ValidationRuleNodeFactory.in(relationProjectValidationParameters(values));
        },
        () => customRule(call, args),
      ),
    ),
    () => customRule(call, args),
  );

  return relationGate(relationEqual(call.method, 'unique'), () => uniqueCandidate, () =>
    relationGate(relationEqual(call.method, 'exists'), () => existsCandidate, () => inCandidate));
}

function relationProjectValidationParameters(values: readonly string[]): readonly { kind: 'validation_parameter'; value: string }[] {
  return relationFold(values, [] as { kind: 'validation_parameter'; value: string }[], (current, value) => [
    ...current,
    { kind: 'validation_parameter' as const, value },
  ]);
}

function customRule(call: StaticRuleCall, args: readonly PhpArgument[]): ValidationRuleNode {
  const parameters = relationFold(args, [] as { kind: 'validation_parameter'; value: string }[], (current, argument) => [
    ...current,
    { kind: 'validation_parameter' as const, value: JSON.stringify(argument.value) },
  ]);
  return ValidationRuleNodeFactory.custom(
    { kind: 'validation_rule_name', value: call.method },
    parameters,
  );
}

function requireStringArrayKey(entry: PhpArrayEntry): string {
  return relationGate(
    relationEqual(entry.kind, 'keyed'),
    () => {
      const keyed = entry as PhpArrayEntry & { readonly kind: 'keyed'; readonly key: { readonly kind: 'string'; readonly value: string } };
      return relationGate(relationEqual(keyed.key.kind, 'string'), () => keyed.key.value, () => {
      throw Error('Validation rule keys must be static string keys');
      });
    },
    () => {
      throw Error('Validation rule keys must be static string keys');
    },
  );
}

function readStringLiteral(value: PhpAstValue): RuleStringOption {
  return relationGate(
    relationAll([relationEqual(value.kind, 'literal'), relationEqual((value as PhpAstValue & { readonly kind: 'literal'; readonly literalType: 'string' | 'number' | 'boolean' }).literalType, 'string')]),
    () => relationSome((value as PhpAstValue & { readonly kind: 'literal'; readonly literalType: 'string'; readonly value: string }).value),
    () => ({ kind: 'none' }),
  );
}

function columnDescriptor(column: RuleStringOption): ValidationDatabaseColumn {
  return relationOptionFold<string, ValidationDatabaseColumn>(column, () => ({ kind: 'default_column' }), value => ({ kind: 'explicit_column', column: SemanticValueFactory.columnName(value) }));
}

function sourceSpanFromPhpRange(range: PhpArrayEntry['source'], sourceFile: string): SourceSpan {
  return {
    kind: 'source_span',
    file: SemanticValueFactory.sourceFilePath(sourceFile),
    start: { kind: 'number_value', value: range.startOffset },
    end: { kind: 'number_value', value: range.endOffset },
  };
}
