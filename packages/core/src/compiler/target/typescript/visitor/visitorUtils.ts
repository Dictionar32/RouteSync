/**
 * @file visitorUtils.ts
 * @description Helper functions for TypeScript AST visitor traversal
 */

import type { TSVisitor } from './TSVisitor';

/**
 * Helper function to visit an array of AST nodes.
 */
export function visitAll<T, R>(
    nodes: readonly T[],
    _visitor: TSVisitor<R>,
    visitMethod: (node: T) => R
): readonly R[] {
    return nodes.map(visitMethod);
}
