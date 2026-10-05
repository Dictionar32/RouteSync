/** Relation-native incremental query compiler facade. */
import type { SemanticType } from '../types/SemanticType';
import { PrimitiveKind, primitiveType } from '../types/SemanticType';
import type { SymbolDatabase } from '../analysis';
import {
  type QueryKey, type QueryNode, type QueryContext, type QueryFrame, type QueryCycleError, createQueryCycleError,
  type ActiveQueryFrame, type SalsaCompilerStats, createQueryKey, createQueryGraphManager,
  executeSalsaQuery,
} from './salsa';
import { relationOptionFold } from '../../semantic/foundation/relationalSequence';
import type { SalsaExecutionState } from './salsa/queryExecutor';

export {
  type QueryKey, type QueryNode, type QueryContext, type QueryFrame, type QueryCycleError, createQueryCycleError,
  type ActiveQueryFrame, type SalsaCompilerStats, createQueryKey, createQueryGraphManager,
};

export interface SalsaCompiler {
  readonly executeQuery: <I, O>(key: QueryKey<O>, compute: (input: I) => O, input: I, currentRevision: number) => O;
  readonly typecheck: (symbolId: string, revision: number) => SemanticType;
  readonly getStats: () => SalsaCompilerStats;
  readonly clear: () => void;
}

export const createSalsaCompiler = (symbolDb: SymbolDatabase): SalsaCompiler => {
  const graphManager = createQueryGraphManager();
  const state: SalsaExecutionState = { activeQueries: Object.freeze([]), activeQueryStack: Object.freeze([]) };
  const typecheckKey = createQueryKey<SemanticType>('typecheck', '__root__', 'default');
  const executeQuery = <I, O>(key: QueryKey<O>, compute: (input: I) => O, input: I, currentRevision: number): O => executeSalsaQuery(
    graphManager, state, key, compute, input, currentRevision,
  );
  return Object.freeze({
    executeQuery,
    typecheck: (symbolId: string, revision: number): SemanticType => executeQuery(
      typecheckKey.derive(symbolId),
      () => relationOptionFold(symbolDb.getSymbol(symbolId),
        () => { throw Error(`Symbol not found: ${symbolId}`); },
        () => primitiveType(PrimitiveKind.STRING)),
      symbolId,
      revision,
    ),
    getStats: (): SalsaCompilerStats => ({
      totalQueries: graphManager.size,
      activeQueries: state.activeQueries.length,
      graphSize: graphManager.size,
    }),
    clear: (): void => {
      graphManager.clear();
      state.activeQueries = Object.freeze([]);
      state.activeQueryStack = Object.freeze([]);
    },
  });
};
