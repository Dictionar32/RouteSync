/**
 * sourceSlice.ts
 *
 * Extracts source text using php-parser location offsets.
 *
 * @module cli/parsers/php
 */

export function sliceNodeSource(node: any, source: string): string {
  if (
    node &&
    node.loc &&
    node.loc.start &&
    node.loc.end &&
    typeof node.loc.start.offset === 'number' &&
    typeof node.loc.end.offset === 'number'
  ) {
    return source.slice(node.loc.start.offset, node.loc.end.offset);
  }
  return '';
}
