import { describe, expect, it } from 'vitest';
import { phpClassConstructorSelectionAuthority } from './phpClassConstructorSelectionAuthority';
import { createMethodName, sourceFileIdentityFactory, stringValue } from './names';
import { numberValue } from './valueObjects';
import type { SourceSpan } from './provenance';

const classSource: SourceSpan = Object.freeze({
  kind: 'source_span',
  file: sourceFileIdentityFactory.create(stringValue.create('/app/Attributes/Context.php')),
  start: numberValue(1),
  end: numberValue(20),
});

const method = (name: string, start: number) => Object.freeze({
  name: createMethodName(name),
  source: Object.freeze({
    kind: 'source_span' as const,
    file: classSource.file,
    start: numberValue(start),
    end: numberValue(start + 4),
  }),
  value: Object.freeze({ declaration: name }),
});

describe('Phase 2306 upstream PHP constructor selection', () => {
  it('selects a uniquely declared constructor case-insensitively', () => {
    const judgment = phpClassConstructorSelectionAuthority.select({
      classSource,
      methods: Object.freeze([method('helper', 2), method('__CONSTRUCT', 5)]),
    });
    expect(judgment.kind).toBe('php_class_constructor_selected');
    expect(judgment.kind === 'php_class_constructor_selected' ? judgment.method.value.declaration : '').toBe('__CONSTRUCT');
  });

  it('preserves missing constructor as a closed judgment', () => {
    expect(phpClassConstructorSelectionAuthority.select({ classSource, methods: Object.freeze([method('helper', 2)]) })).toEqual({
      kind: 'php_class_constructor_missing',
      classSource,
    });
  });

  it('blocks duplicate constructor declarations instead of choosing the first', () => {
    const first = method('__construct', 2);
    const second = method('__CONSTRUCT', 8);
    expect(phpClassConstructorSelectionAuthority.select({ classSource, methods: Object.freeze([first, second]) })).toEqual({
      kind: 'php_class_constructor_ambiguous',
      classSource,
      candidates: [first.source, second.source],
    });
  });
});
