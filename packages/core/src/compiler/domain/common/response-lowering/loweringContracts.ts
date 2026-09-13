/**
 * Response Field Lowering Contracts.
 *
 * @module compiler/domain/common/response-lowering
 */

import type { ParsedResponseField } from '../../../generators/contract-generation/ResponseFieldParser';
import { ConversionResult } from '../ConversionResult';

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
    const fields = results.flatMap(r => r.fields);
    const warnings = results.flatMap(r => r.warnings);

    return new ConversionResult({ fields, warnings });
}
