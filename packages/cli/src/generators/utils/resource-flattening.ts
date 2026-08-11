/**
 * Resource Field Flattening Utilities
 * 
 * Phase 2: Nested Object Flattening Implementation
 * 
 * Provides utilities to flatten nested resource fields into flat property structures
 * with proper camelCase naming and type inference.
 * 
 * @example
 * Input:
 *   { produk: { id: number, nama: string } }
 * 
 * Output:
 *   { produkId: number, produkNama: string }
 */

import type { ResourceFieldKind } from '../../../../core/src/types/route'
import {
    type SemanticType,
    PrimitiveType,
    PrimitiveKind,
    ReferenceType
} from '../../../../core/src/compiler/types/SemanticType'
import { PrimitiveTypeFactory } from './PrimitiveTypeFactory'

/**
 * Options for flattening resource fields
 */
export interface FlatteningOptions {
    /** Maximum nesting depth to flatten (default: 5) */
    maxDepth?: number
    /** Log warnings for circular references (default: true) */
    circularRefWarnings?: boolean
}

/**
 * Context for tracking flattening state
 */
interface FlatteningContext {
    /** Set of visited objects for circular reference detection */
    visited: WeakSet<ResourceFieldKind>
    /** Current depth in recursion */
    depth: number
    /** Options */
    options: Required<FlatteningOptions>
}

/**
 * Flattened property result
 */
interface FlattenedProperty {
    /** Property name (camelCase) */
    name: string
    /** Semantic type */
    type: SemanticType
}

/**
 * Default flattening options
 */
const DEFAULT_OPTIONS: Required<FlatteningOptions> = {
    maxDepth: 5,
    circularRefWarnings: true
}

/**
 * Main entry point: Flatten all fields in a resource
 * 
 * @param resourceName - Name of the resource being flattened
 * @param fields - Resource fields to flatten
 * @param options - Flattening options
 * @returns Map of flattened property names to semantic types
 */
export function flattenResourceFields(
    resourceName: string,
    fields: Record<string, ResourceFieldKind>,
    options?: FlatteningOptions
): Map<string, SemanticType> {
    const result = new Map<string, SemanticType>()
    const ctx: FlatteningContext = {
        visited: new WeakSet(),
        depth: 0,
        options: { ...DEFAULT_OPTIONS, ...options }
    }

    // Flatten each top-level field
    for (const [fieldName, field] of Object.entries(fields)) {
        const flattened = flattenResourceField(fieldName, field, '', ctx)

        // Add flattened properties to result map
        for (const prop of flattened) {
            if (result.has(prop.name)) {
                // Name collision - log warning
                if (ctx.options.circularRefWarnings) {
                    console.warn(
                        `[RouteSync] Name collision in ${resourceName}: property '${prop.name}' already exists. Overwriting with new value.`
                    )
                }
            }
            result.set(prop.name, prop.type)
        }
    }

    return result
}

/**
 * Recursively flatten a single resource field
 * 
 * @param fieldName - Name of the current field
 * @param field - Field definition to flatten
 * @param prefix - Accumulated name prefix (e.g., 'produk' for produk.id)
 * @param ctx - Flattening context
 * @returns Array of flattened properties
 */
export function flattenResourceField(
    fieldName: string,
    field: ResourceFieldKind,
    prefix: string,
    ctx: FlatteningContext
): FlattenedProperty[] {
    // Check depth limit: maxDepth = jumlah level (segmen key) maksimum yang
    // diizinkan. Depth 0-indexed (top-level = 0), jadi leaf di depth >= maxDepth
    // (level ke-(maxDepth+1)) harus berhenti — sebelumnya `>` memberi
    // maxDepth+1 level (off-by-one): 6 level untuk maxDepth 5.
    if (ctx.depth >= ctx.options.maxDepth) {
        if (ctx.options.circularRefWarnings) {
            console.warn(
                `[RouteSync] Maximum nesting depth (${ctx.options.maxDepth}) exceeded at field '${prefix}${fieldName}'. Stopping flattening.`
            )
        }
        return []
    }

    // Circular reference detection for object types
    if (field.kind === 'object' && typeof field === 'object') {
        if (ctx.visited.has(field)) {
            if (ctx.options.circularRefWarnings) {
                console.warn(
                    `[RouteSync] Circular reference detected at field '${prefix}${fieldName}'. Skipping to prevent infinite recursion.`
                )
            }
            return []
        }
        ctx.visited.add(field)
    }

    // Build accumulated prefix (e.g., 'produk' + 'Id' = 'produkId')
    // If prefix is empty, use toCamelCase directly (first field, lowercase first letter)
    // If prefix exists, capitalize the new part (nested field, uppercase first letter for camelCase)
    const camelFieldName = toCamelCase(fieldName)
    const newPrefix = prefix === ''
        ? camelFieldName
        : prefix + capitalize(camelFieldName)

    // Handle different field kinds
    switch (field.kind) {
        case 'primitive': {
            // Leaf node - return as-is with camelCase name
            // Use factory to properly map type string to PrimitiveKind
            return [{
                name: toCamelCase(newPrefix),
                type: PrimitiveTypeFactory.fromString(field.type)
            }]
        }

        case 'property_access':
        case 'nullsafe_property_access':
        case 'variable':
        case 'type_cast':
        case 'binary_expression':
        case 'method_call':
        case 'literal': {
            // Infer type from resolved.type if available
            // This handles all expression kinds that have resolved metadata
            const inferredType = field.resolved?.type
                ? primitiveStringToSemanticType(field.resolved.type)
                : new PrimitiveType(PrimitiveKind.STRING)

            return [{
                name: toCamelCase(newPrefix),
                type: inferredType
            }]
        }

        case 'object': {
            // Nested object - recurse into children
            if (!field.fields || Object.keys(field.fields).length === 0) {
                // Empty object - skip
                return []
            }

            const flattened: FlattenedProperty[] = []
            const childCtx: FlatteningContext = {
                ...ctx,
                depth: ctx.depth + 1
            }

            for (const [childName, childField] of Object.entries(field.fields)) {
                const childFlattened = flattenResourceField(
                    childName,
                    childField,
                    newPrefix,
                    childCtx
                )
                flattened.push(...childFlattened)
            }

            return flattened
        }

        case 'model':
        case 'resource':
        case 'unknown':
        default: {
            // For model/resource/unknown, treat as opaque object
            // Return as-is without flattening (semantic types will handle it)
            const typeName = field.kind === 'model' ? field.model :
                field.kind === 'resource' ? field.resource : 'unknown'

            return [{
                name: toCamelCase(newPrefix),
                type: new ReferenceType('App\\Models', typeName)
            }]
        }
    }
}

/**
 * Convert primitive type string to SemanticType
 * 
 * Delegates to PrimitiveTypeFactory for proper type construction.
 * 
 * @param typeStr - Type string from resolved.type (e.g., 'int', 'string', 'bool')
 * @returns Semantic primitive type instance
 */
export function primitiveStringToSemanticType(typeStr: string): SemanticType {
    return PrimitiveTypeFactory.fromString(typeStr)
}

/**
 * Capitalize first letter of string
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 * 
 * @example
 * capitalize('user') // 'User'
 * capitalize('id') // 'Id'
 */
export function capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert snake_case to camelCase
 * 
 * @param str - String to convert
 * @returns camelCase string
 * 
 * @example
 * toCamelCase('user_name') // 'userName'
 * toCamelCase('product_id') // 'productId'
 * toCamelCase('ProdukNama') // 'produkNama'
 */
export function toCamelCase(str: string): string {
    if (!str) return ''

    // Handle snake_case
    if (str.includes('_')) {
        return str
            .split('_')
            .map((part, index) =>
                index === 0
                    ? part.toLowerCase()
                    : capitalize(part.toLowerCase())
            )
            .join('')
    }

    // Handle PascalCase -> camelCase
    return str.charAt(0).toLowerCase() + str.slice(1)
}
