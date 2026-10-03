/**
 * Response Field Lowering Contracts.
 *
 * @module compiler/domain/common/response-lowering
 */

import type { ParsedResponseField } from '../../../generators/contract-generation/ResponseFieldParser';
import { ConversionResult, createConversionResult } from '../ConversionResult';
import { relationExpand } from '../../../../semantic/kernel/relationalSequence';

/**
 * Result contract for Nullable Wrapper resolution
 */
export type NullableWrapperResult =
    | {
          readonly isNullableWrapper: true;
          readonly field: ParsedResponseField;
          readonly warnings: readonly string[];
      }
    | {
          readonly isNullableWrapper: false;
      };

/**
 * Stage Result contract for ParsedResponseField collections
 */
export type StageResult<T> = ConversionResult<T>;

/**
 * Observable ResponseFieldConversionResult alias
 */
export type ResponseFieldConversionResult = ConversionResult<ParsedResponseField>;

/**
 * Pure helper to partition a collection of ConversionResults into fields and warnings
 */
export function partitionResults<T>(
    results: readonly ConversionResult<T>[]
): ConversionResult<T> {
    const fields = relationExpand(results, result => result.fields);
    const warnings = relationExpand(results, result => result.warnings);

    return createConversionResult({ fields, warnings });
}
