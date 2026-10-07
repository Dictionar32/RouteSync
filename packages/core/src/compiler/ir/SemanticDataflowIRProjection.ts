/**
 * Canonical downstream projection of the closed semantic dataflow interface.
 *
 * This is intentionally a projection, not a second dataflow authority: all
 * reachability facts come from DataFlowInterface.state. The IR
 * layer may consume the interface, but it must not reconstruct closure.
 */
import type {
  SemanticDataflowFact,
  SemanticDataflowIdentity,
  SemanticDataflowInput,
  SemanticDataflowJudgment,
} from '../../types/upstream/semanticDataflow';
import { semanticDataflowIdentityKey } from '../../types/upstream/semanticDataflow';
import type { DataFlowInterface } from '../../types/dataflow/dataFlowInterface';
import type { SemanticDataflowIRProjectionInterface } from './SemanticDataflowIRProjectionInterface';

import type { SemanticDataflowIRProjection, SemanticDataflowIRRelation, SemanticDataflowIRNode } from './SemanticDataflowIRProjectionTypes';
const identityId = (identity: SemanticDataflowIdentity): string => {
  const key = semanticDataflowIdentityKey(identity);
  return `${key.file.value}:${key.start}-${key.end}:${key.role}:${key.slot.value}`;
};

const relationOf = (fact: SemanticDataflowFact): SemanticDataflowIRRelation => {
  switch (fact.kind) {
    case 'dependency':
    case 'value_flow':
      return Object.freeze({
        kind: fact.kind,
        source: identityId(fact.source),
        target: identityId(fact.target),
        role: fact.role,
        guards: fact.guard ? [identityId(fact.guard.predicate)] : [],
        ...(fact.lineage ? {
          lineage: Object.freeze({
            producer: fact.lineage.producer,
            identity: identityId(fact.lineage.identity),
            source: fact.lineage.source,
          }),
        } : {}),
      });
    case 'reaches':
      return Object.freeze({
        kind: 'reaches',
        source: identityId(fact.source),
        target: identityId(fact.target),
      });
  }
};

export const projectSemanticDataflowToIR = (
  dataflow: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>,
): SemanticDataflowIRProjection => {
  const facts = dataflow.state.closure;
  const identities = new Map<string, SemanticDataflowIdentity>();

  for (const fact of facts) {
    if (fact.kind === 'dependency' || fact.kind === 'value_flow' || fact.kind === 'reaches') {
      identities.set(identityId(fact.source), fact.source);
      identities.set(identityId(fact.target), fact.target);
    }
  }

  return Object.freeze({
    kind: 'semantic_dataflow_ir_projection',
    authority: dataflow.state.authority,
    fixedPoint: dataflow.state.fixedPoint,
    origin: dataflow.state.origin,
    nodes: Object.freeze([...identities.values()].map(identity => Object.freeze({
      id: identityId(identity),
      role: identity.role,
      slot: identity.slot.value,
      source: identity.source,
    }))),
    relations: Object.freeze(facts.map(relationOf)),
    closed: true,
  });
};

/** Canonical IR projection implementation; it never derives dataflow closure. */
export const semanticDataflowIRProjection: SemanticDataflowIRProjectionInterface = Object.freeze({
  project: projectSemanticDataflowToIR,
});
