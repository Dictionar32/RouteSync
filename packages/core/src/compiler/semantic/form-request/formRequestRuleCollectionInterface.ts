import type { PhpArrayEntry } from '../../frontend/php/PhpAst';
import type { TypeInterner } from '../../types/TypeInterner';
import type { RouteValidationRuleEntry, ValidationRuleNode } from '../../../types/domain/validationRules';
import type { RouteValidationRuleSet } from '../validation/validationRuleSet';

/** Typed runtime contract for canonical FormRequest rule collection. */
export interface FormRequestRuleCollectionInterface {
  readonly parseCanonicalValidationRuleEntries: (
    entries: readonly PhpArrayEntry[],
    sourceFile?: string,
  ) => readonly RouteValidationRuleEntry[];
  readonly partitionValidationRules: (
    entries: readonly PhpArrayEntry[],
    interner: TypeInterner,
    sourceFile?: string,
  ) => RouteValidationRuleSet;
  readonly parseValidationRules: (rules: readonly string[]) => readonly ValidationRuleNode[];
}
