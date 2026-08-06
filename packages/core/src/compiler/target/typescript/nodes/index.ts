/**
 * @file index.ts
 * @description Export semua TypeScript AST node types
 */

// Base types
export { TSNode, TSNodeKind, SourceSpan } from './TSNode';
export { TSTypeNode } from './TSTypeNode';

// Root node
export { TSFile, TSDeclaration } from './TSFile';

// Import/Export nodes
export { TSImportDeclaration } from './TSImportDeclaration';
export { TSExportDeclaration, TSExportSpecifier } from './TSExportDeclaration';

// Declaration nodes
export { TSInterfaceDeclaration } from './TSInterfaceDeclaration';
export { TSTypeAliasDeclaration } from './TSTypeAliasDeclaration';
export { TSFunctionDeclaration } from './TSFunctionDeclaration';
export { TSTypeParameter } from './TSTypeParameter';

// Member nodes
export { TSPropertySignature } from './TSPropertySignature';
export { TSMethodSignature, TSParameter } from './TSMethodSignature';

// Type nodes
export { TSTypeReference } from './TSTypeReference';
export { TSArrayType } from './TSArrayType';
export { TSUnionType } from './TSUnionType';
export { TSIntersectionType } from './TSIntersectionType';

// Comment nodes
export {
    TSComment,
    CommentStyle,
    JSDocTag,
    paramTag,
    returnsTag,
    exampleTag,
    deprecatedTag
} from './TSComment';
