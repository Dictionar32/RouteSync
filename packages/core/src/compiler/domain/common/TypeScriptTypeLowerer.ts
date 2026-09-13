/**
 * TypeScriptTypeLowerer.ts
 *
 * Active Consumer Orchestrator: Target-Specific Lowering Engine for Transforming Semantic AST Nodes
 * into TypeScript Type Expressions and Interfaces.
 *
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption,
 * and pure unifying entry points.
 *
 * @module compiler/domain/common/TypeScriptTypeLowerer
 */

import { type ObjectType } from '../../types/SemanticType';

import {
    TypeScriptTargetVersion,
    TypeScriptLowererOptions,
    TypeScriptPrimitiveToken,
    TypeScriptPrimitiveMapping,
    TypeScriptAliasSuffix,
    ControllerActionToAlias,
    TypeScriptToken
} from './ts-lowerer/typeScriptVocabulary';

import { TypeScriptSyntax } from './ts-lowerer/typeScriptSyntax';

import {
    SourceLineRange,
    GeneratedInterfaceMetadata,
    LoweredTypeDeclaration,
    TypeScriptBuildResult
} from './ts-lowerer/typeScriptMetadata';

import { TypeScriptCodeBuilder } from './ts-lowerer/typeScriptCodeBuilder';

import {
    toTypeScriptTypeExpression,
    buildTopLevelDeclaration
} from './ts-lowerer/typeScriptNodeLowerer';

// ============================================================================
// Active Consumer: Pure Factory & Unifying Lowerer Entry Points
// ============================================================================

/**
 * Pure Factory: Constructs a configured TypeScriptCodeBuilder instance.
 */
export function createTypeScriptCodeBuilder(
    options: TypeScriptLowererOptions = {}
): TypeScriptCodeBuilder {
    return new TypeScriptCodeBuilder(options);
}

/**
 * Pure Dataflow Transform: ObjectType[] AST streams → TypeScriptBuildResult.
 * 1 Input, 1 Output, 0 '?', 0 'new' in call site.
 */
export function lowerTypeScriptTypes(
    types: readonly ObjectType[],
    options: TypeScriptLowererOptions = {}
): TypeScriptBuildResult {
    const builder = new TypeScriptCodeBuilder(options);
    return builder.build(types);
}

// ============================================================================
// Explicit Named Exports (Rule 14: Zero Wildcard Re-export)
// ============================================================================

export {
    TypeScriptTargetVersion,
    TypeScriptLowererOptions,
    TypeScriptPrimitiveToken,
    TypeScriptPrimitiveMapping,
    TypeScriptAliasSuffix,
    ControllerActionToAlias,
    TypeScriptToken,
    TypeScriptSyntax,
    SourceLineRange,
    GeneratedInterfaceMetadata,
    LoweredTypeDeclaration,
    TypeScriptBuildResult,
    TypeScriptCodeBuilder,
    toTypeScriptTypeExpression,
    buildTopLevelDeclaration
};