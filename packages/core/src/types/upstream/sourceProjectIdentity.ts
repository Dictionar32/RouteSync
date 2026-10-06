import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { SourceSpan } from './provenance';
import type { NumberValue, StringValue } from './valueObjects';

const stringValue = (value: string): StringValue => ({ kind: 'string_value', value });
const numberValue = (value: number): NumberValue => ({ kind: 'number_value', value });

/**
 * Canonical upstream construction of a Laravel source-project identity.
 *
 * This belongs to the upstream lane: it describes the source project consumed
 * by manifest construction. Legacy scanner facades may re-export it, but do
 * not own the implementation.
 */
export const createLaravelSourceProjectIdentity = (sourceRoot: string): SourceProjectIdentity => {
  const source: SourceSpan = {
    kind: 'source_span',
    file: { kind: 'source_file', value: stringValue(sourceRoot) },
    start: numberValue(1),
    end: numberValue(1),
  };

  return {
    kind: 'laravel_project',
    root: source.file,
    source,
  };
};
