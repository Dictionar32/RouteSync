// target/typescript/nodes/TSImportDeclaration.ts

import type { TSNode } from './TSNode';
import type { TSVisitor } from '../visitor/TSVisitor';

/**
 * Import declaration node
 * 
 * Examples:
 * - import { User } from './User';
 * - import type { Config } from './Config';
 */
export class TSImportDeclaration implements TSNode {
    public readonly kind = 'import-declaration' as const;

    constructor(
        public readonly names: string[],
        public readonly from: string,
        public readonly isType: boolean = false
    ) { }

    /**
     * Create type import
     */
    public static typeImport(names: string[], from: string): TSImportDeclaration {
        return new TSImportDeclaration(names, from, true);
    }

    /**
     * Create value import
     */
    public static valueImport(names: string[], from: string): TSImportDeclaration {
        return new TSImportDeclaration(names, from, false);
    }

    /**
     * Accept visitor (Neural Pathway)
     * Menghubungkan node ini dengan visitor pattern untuk traversal
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitImportDeclaration(this);
    }
}
