/**
 * @file ITargetNode.ts
 * @description Base interface untuk semua Target AST nodes
 * 
 * Interface ini define contract untuk Target AST nodes tanpa implementation.
 * Semua target languages (TypeScript, Kotlin, Swift) harus implement interface ini.
 */

/**
 * Source location information untuk error reporting
 */
export interface SourceLocation {
    readonly file: string;
    readonly line: number;
    readonly column: number;
}

/**
 * Base interface untuk semua Target AST nodes
 * 
 * Setiap node HARUS:
 * - Immutable (semua properties readonly)
 * - Have unique kind identifier
 * - Support visitor pattern (accept method)
 */
export interface ITargetNode {
    /** Unique identifier untuk node type */
    readonly kind: string;

    /** Optional source location untuk error reporting */
    readonly location?: SourceLocation;

    /**
     * Accept visitor untuk traversal
     * 
     * @param visitor - Visitor yang akan process node ini
     * @returns Result dari visitor processing
     */
    accept<R>(visitor: ITargetVisitor<R>): R;
}

/**
 * Base interface untuk visitors yang traverse Target AST
 * 
 * Implementors define bagaimana handle setiap node type.
 * Generic parameter R adalah return type dari visit methods.
 */
export interface ITargetVisitor<R> {
    /**
     * Default result ketika tidak ada specific handling
     */
    defaultResult(): R;
}

/**
 * Marker interface untuk statement nodes
 */
export interface IStatementNode extends ITargetNode {
    readonly kind: string;
}

/**
 * Marker interface untuk expression nodes
 */
export interface IExpressionNode extends ITargetNode {
    readonly kind: string;
}

/**
 * Marker interface untuk type nodes
 */
export interface ITypeNode extends ITargetNode {
    readonly kind: string;
}

/**
 * Marker interface untuk declaration nodes
 */
export interface IDeclarationNode extends IStatementNode {
    readonly name: string;
    readonly isExported: boolean;
}

