import type { NumberValue } from './valueObjects';
import type { SourceFile } from './names';
export type SourceSpan = { readonly kind: 'source_span'; readonly file: SourceFile; readonly start: NumberValue; readonly end: NumberValue };
