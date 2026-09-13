/**
 * TypeScript Target AST exports.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 */

// Export node types
export {
    TSNode,
    TSNodeKind,
    type SourceSpan,
    TSTypeNode,
    TSFile,
    type TSDeclaration,
    TSImportDeclaration,
    TSExportDeclaration,
    type TSExportSpecifier,
    TSInterfaceDeclaration,
    TSTypeAliasDeclaration,
    TSFunctionDeclaration,
    TSTypeParameter,
    TSPropertySignature,
    TSMethodSignature,
    type TSParameter,
    TSTypeReference,
    TSArrayType,
    TSUnionType,
    TSIntersectionType,
    TSComment,
    CommentStyle,
    type JSDocTag,
    paramTag,
    returnsTag,
    exampleTag,
    deprecatedTag
} from './nodes';

// Export visitor pattern
export {
    type TSVisitor,
    isVisitor,
    TSBaseVisitor,
    visitAll
} from './visitor';
