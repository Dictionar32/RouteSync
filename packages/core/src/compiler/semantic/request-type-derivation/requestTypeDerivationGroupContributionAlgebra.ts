/**
 * Canonical interface-first RequestType action/response group-fold algebra.
 * Every transition carries before/incoming/after states so the verifier can replay it.
 */
import {
  requestTypeDerivationContract,
  type RequestTypeGroupContributionAlgebraInterface,
  type RequestTypeGroupContributionReceipt,
  type RequestTypeGroupFoldInput,
} from '../../../types/upstream/requestTypeDerivationInterface';
import type { RequestType } from '../../../types/domain/request';
import { RequestTypeDerivationSemanticProducerGapError } from './requestTypeDerivationSemanticProducerGap';

const fold = (input: RequestTypeGroupFoldInput): RequestTypeGroupContributionReceipt => {
  const initial = 'kind' in input.before && input.before.kind === 'group_absent';
  const existing = initial ? undefined : input.before as RequestType;
  const incoming = input.incoming;
  const actions = [...(existing?.actions ?? [])];
  let actionReceipt: RequestTypeGroupContributionReceipt['action'] = Object.freeze({ kind: 'not_applicable' });

  if (incoming.actions.length > 1) {
    throw new RequestTypeDerivationSemanticProducerGapError(
      'reasoning',
      `one route contribution currently requires at most one action receipt; ${input.route.occurrenceKey} supplied ${incoming.actions.length}`,
    );
  }
  const incomingAction = incoming.actions[0];
  if (incomingAction) {
    const existingIndex = actions.findIndex(action => action.name === incomingAction.name);
    if (existingIndex < 0) {
      actions.push(incomingAction);
      actionReceipt = Object.freeze({ kind: 'appended', actionName: incomingAction.name });
    } else if (actions[existingIndex]!.fields.length === 0 && incomingAction.fields.length > 0) {
      actions[existingIndex] = incomingAction;
      actionReceipt = Object.freeze({ kind: 'replaced_existing', actionName: incomingAction.name });
    } else {
      actionReceipt = Object.freeze({ kind: 'retained_existing', actionName: incomingAction.name });
    }
  }

  let response = initial ? incoming.response : existing!.response;
  let responseReceipt: RequestTypeGroupContributionReceipt['response'];
  if (incoming.response.kind === 'none') {
    responseReceipt = Object.freeze({ kind: 'no_incoming_response' });
  } else if (initial || existing!.response.kind === 'none') {
    response = incoming.response;
    responseReceipt = Object.freeze({ kind: 'accepted_incoming' });
  } else {
    responseReceipt = Object.freeze({ kind: 'retained_existing' });
  }

  const after: RequestType = initial
    ? Object.freeze({ ...incoming, actions: Object.freeze(actions), response })
    : Object.freeze({ ...existing!, actions: Object.freeze(actions), response });

  // The contract is the policy owner. Keep this guard close to the fold so an
  // accidental policy change cannot silently leave a stale implementation.
  const policy = requestTypeDerivationContract.policy;
  if (policy.actionContribution.kind !== 'merge_by_action_name'
    || policy.responseContribution.kind !== 'merge_response'
    || policy.groupContribution.chain !== 'each_before_equals_previous_after') {
    throw new RequestTypeDerivationSemanticProducerGapError('reasoning', 'group-fold implementation does not match canonical upstream policy');
  }

  return Object.freeze({
    route: input.route,
    request: input.request,
    transition: initial ? 'initial_group' : 'merge_existing_group',
    action: actionReceipt,
    response: responseReceipt,
    before: initial ? Object.freeze({ kind: 'group_absent' as const }) : existing!,
    incoming,
    after,
  });
};

export const requestTypeDerivationGroupContributionAlgebra: RequestTypeGroupContributionAlgebraInterface = Object.freeze({ fold });
