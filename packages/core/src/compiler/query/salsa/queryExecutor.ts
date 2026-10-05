/** Declarative query execution over relation-backed dependency state. */
import type { QueryKey, QueryNode, ActiveQueryFrame } from './salsaTypes';
import type { QueryGraphManager } from './queryGraphManager';
import { assertNoCycle } from './cycleDetector';
import { relationGate, relationOptionFold, relationFirst, relationResolve, relationAll } from '../../../semantic/foundation/relationalSequence';
import { relationNotEqual } from '../../../semantic/foundation/relationFoundation';
import type { RelationOption } from '../../../semantic/foundation/relationFoundation';

export interface SalsaExecutionState { activeQueries: readonly string[]; activeQueryStack: readonly ActiveQueryFrame[]; }

export function executeSalsaQuery<I, O>(
  graphManager: QueryGraphManager,
  state: SalsaExecutionState,
  key: QueryKey<O>,
  compute: (input: I) => O,
  input: I,
  currentRevision: number,
): O {
  const keyId = key.id;
  assertNoCycle(state.activeQueries, state.activeQueryStack, key);
  const parent: RelationOption<ActiveQueryFrame> = relationFirst(state.activeQueryStack.slice(-1), () => true);
  relationOptionFold(parent, () => {}, frame => graphManager.recordDependency(frame.keyId, keyId));

  return relationOptionFold(graphManager.getNode(keyId),
    () => computeFresh(),
    cachedNode => relationGate(
      relationAll([graphManager.isCacheValid(cachedNode, currentRevision), key.hasValue()]),
      () => relationOptionFold(key.read(), () => computeFresh(), value => value),
      () => computeFresh(),
    ));

  function computeFresh(): O {
    graphManager.beginEvaluation(keyId);
    const existing = graphManager.getNode(keyId);
    const existingDependents = relationOptionFold(existing, () => [], node => node.dependents);
    const existingRevision = relationOptionFold(existing, () => currentRevision, node => node.lastChangedRevision);
    const node: QueryNode = {
      keyId,
      dependencies: [],
      dependents: Object.freeze([...existingDependents]),
      lastChangedRevision: existingRevision,
      lastVerifiedRevision: currentRevision,
    };
    graphManager.setNode(keyId, node);

    state.activeQueries = Object.freeze([...state.activeQueries, keyId]);
    state.activeQueryStack = Object.freeze([...state.activeQueryStack, { keyId }]);
    const previous = key.read();
    let value!: O;
    try {
      value = compute(input);
    } finally {
      state.activeQueries = Object.freeze(state.activeQueries.slice(0, -1));
      state.activeQueryStack = Object.freeze(state.activeQueryStack.slice(0, -1));
    }
    const valueChanged = relationGate(key.hasValue(),
      () => relationOptionFold(previous, () => true, previousValue => relationNotEqual(JSON.stringify(previousValue), JSON.stringify(value))),
      () => true,
    );
    const evaluated = relationOptionFold(
      graphManager.getNode(keyId),
      () => node,
      current => current,
    );
    graphManager.setNode(keyId, {
      ...evaluated,
      lastChangedRevision: relationGate(valueChanged, () => currentRevision, () => evaluated.lastChangedRevision),
      lastVerifiedRevision: currentRevision,
    });
    key.write(value);
    relationGate(valueChanged, () => graphManager.invalidateDependents(keyId, currentRevision), () => {});
    return value;
  }
}
