/**
 * @fileoverview Salsa-inspired incremental query compiler.
 * Active Consumer Orchestrator conforming to Rule 14.
 */

import type { SemanticType } from '../types/SemanticType';
import { PrimitiveType, PrimitiveKind } from '../types/SemanticType';
import { SymbolDatabase } from '../analysis';
import {
    type QueryKey,
    type QueryNode,
    type QueryContext,
    type QueryFrame,
    QueryCycleError,
    type ActiveQueryFrame,
    type SalsaCompilerStats,
    createQueryKey,
    QueryGraphManager,
    executeSalsaQuery
} from './salsa';

export {
    type QueryKey,
    type QueryNode,
    type QueryContext,
    type QueryFrame,
    QueryCycleError,
    type ActiveQueryFrame,
    type SalsaCompilerStats,
    createQueryKey,
    QueryGraphManager
};

export class SalsaCompiler {
    private readonly graphManager = new QueryGraphManager();
    private readonly activeQueries = new Set<string>();
    private readonly activeQueryStack: ActiveQueryFrame[] = [];

    private readonly typecheckKey = createQueryKey<SemanticType>(
        'typecheck',
        '__root__',
        'default',
    );

    constructor(
        private readonly symbolDb: SymbolDatabase,
    ) { }

    public executeQuery<I, O>(
        key: QueryKey<O>,
        compute: (input: I) => O,
        input: I,
        currentRevision: number,
    ): O {
        return executeSalsaQuery(
            this.graphManager,
            this.activeQueries,
            this.activeQueryStack,
            key,
            compute,
            input,
            currentRevision
        );
    }

    public typecheck(
        symbolId: string,
        revision: number,
    ): SemanticType {
        const key = this.typecheckKey.derive(symbolId);

        return this.executeQuery(
            key,
            () => {
                const symbol = this.symbolDb.getSymbol(symbolId);

                if (!symbol) {
                    throw new Error(`Symbol not found: ${symbolId}`);
                }

                return new PrimitiveType(PrimitiveKind.STRING);
            },
            undefined,
            revision,
        );
    }

    public getStats(): {
        totalQueries: number;
        activeQueries: number;
        graphSize: number;
    } {
        return {
            totalQueries: this.graphManager.size,
            activeQueries: this.activeQueries.size,
            graphSize: this.graphManager.size,
        };
    }

    public clear(): void {
        this.graphManager.clear();
        this.activeQueries.clear();
        this.activeQueryStack.length = 0;
    }
}
