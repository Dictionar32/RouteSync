/**
 * @file TSTypeNode.ts
 * @description Base interface untuk TypeScript type nodes
 */

import type { TSNode, TSNodeKind } from './TSNode';

/**
 * Marker interface untuk type nodes
 * 
 * All TypeScript type representations must implement this interface.
 * Examples: TSTypeReference, TSArrayType, TSUnionType, etc.
 */
export interface TSTypeNode extends TSNode {
    readonly kind: TSNodeKind;
}

