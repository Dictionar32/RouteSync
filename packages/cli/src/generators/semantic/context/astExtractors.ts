/**
 * astExtractors.ts
 *
 * Structural AST extractors and canonical action resolver.
 *
 * @module cli/generators/semantic/context
 */

import { CANONICAL_ACTION_MAP, type ActionType } from '../../canonical-names';

/**
 * Pure Canonical Action Resolver
 * Direct O(1) canonical mapping defaulting to 'Get' with 0 '?' operators.
 */
export function resolveCanonicalAction(method: string | undefined): ActionType {
    if (typeof method === 'string') {
        const mapped = CANONICAL_ACTION_MAP[method.toLowerCase()];
        if (mapped !== undefined) {
            return mapped;
        }
    }
    return 'Get';
}

/**
 * Pure AST Property Access Extractor
 * Extracts property name from `$this->property` AST node without nested `?.` traversal.
 */
export function extractThisPropertyAccess(fieldDef: Record<string, unknown>): string | null {
    if (fieldDef.kind !== 'raw_code') return null;
    const ast = fieldDef.parsed_ast;
    if (!ast || typeof ast !== 'object') return null;
    const node = ast as Record<string, unknown>;
    if (node.kind !== 'property_access') return null;
    const target = node.target;
    if (!target || typeof target !== 'object') return null;
    const targetNode = target as Record<string, unknown>;
    if (targetNode.kind !== 'variable' || targetNode.name !== 'this') return null;
    if (typeof node.property === 'string' && node.property.length > 0) {
        return node.property;
    }
    return null;
}

/**
 * Pure Structural Null-Guard Detector
 * Detects `is_array($x) ? ($x['key'] ?? null) : null` structurally with direct type guard checks.
 */
export function isNullableTernaryGuard(astNode: unknown): boolean {
    if (!astNode || typeof astNode !== 'object') return false;
    const node = astNode as Record<string, unknown>;
    if (node.kind !== 'ternary') return false;

    const falsy = node.falsy;
    if (!falsy || typeof falsy !== 'object') return false;
    const falsyNode = falsy as Record<string, unknown>;
    if (falsyNode.kind !== 'primitive' || falsyNode.type !== 'null') return false;

    const truthy = node.truthy;
    if (!truthy || typeof truthy !== 'object') return false;
    const truthyNode = truthy as Record<string, unknown>;
    if (truthyNode.kind !== 'binary_expression') return false;
    const right = truthyNode.right;
    if (!right || typeof right !== 'object') return false;
    const rightNode = right as Record<string, unknown>;

    return rightNode.kind === 'primitive' && rightNode.type === 'null';
}
