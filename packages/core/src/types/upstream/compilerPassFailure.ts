/**
 * Closed upstream model for a compiler-pass execution failure.
 *
 * The host exception is normalized exactly once at the executable boundary;
 * semantic consumers receive value-object data rather than `unknown` or an
 * arbitrary host value. This keeps pass diagnostics compatible with the
 * upstream ADT/value-object vocabulary.
 */
import { createExceptionName, type ExceptionName } from './names';
import { stringValue, type StringValue } from './valueObjects';
import { relationVariantFold } from '../../semantic/kernel/relationalSequence';

export type CompilerPassFailure =
  | {
      readonly kind: 'compiler_pass_error';
      readonly name: ExceptionName;
      readonly message: StringValue;
    }
  | {
      readonly kind: 'compiler_pass_non_error';
      readonly name: ExceptionName;
      readonly message: StringValue;
    };

export const compilerPassFailureOf = (error: unknown): CompilerPassFailure =>
  error instanceof Error
    ? Object.freeze({
        kind: 'compiler_pass_error' as const,
        name: createExceptionName(error.name),
        message: stringValue(error.message),
      })
    : Object.freeze({
        kind: 'compiler_pass_non_error' as const,
        name: createExceptionName('NonErrorThrownValue'),
        message: stringValue('Compiler pass failed with a non-Error thrown value.'),
      });

export const compilerPassFailureMessage = (failure: CompilerPassFailure): string =>
  relationVariantFold(
    failure,
    'compiler_pass_error',
    item => item.message.value,
    item => item.message.value,
  );
