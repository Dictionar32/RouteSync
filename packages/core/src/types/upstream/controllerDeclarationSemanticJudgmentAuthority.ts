import type {
  ControllerDeclarationAncestryTermination,
  ControllerDeclarationSemanticCandidate,
  ControllerDeclarationSemanticSubject,
  ControllerDeclarationSemanticSelection,
  ControllerDeclarationSemanticJudgment,
  ControllerDeclarationActionSelection,
  ControllerDeclarationAncestorEvidence,
} from './controllerDeclarationSemanticJudgmentInterface';
import type { ControllerName } from './names';

const sameClassIdentity = (left: ControllerDeclarationSemanticCandidate<unknown, unknown>['classIdentity'], right: ControllerDeclarationSemanticCandidate<unknown, unknown>['classIdentity']): boolean =>
  left.value.value.toLowerCase() === right.value.value.toLowerCase();

const isHasMiddleware = <TMethod, TAttribute>(candidate: ControllerDeclarationSemanticCandidate<TMethod, TAttribute>): boolean =>
  candidate.interfaces.some(item => item.value.value === 'HasMiddleware');

const judgeActionSelection = <TMethod, TAttribute>(
  candidate: ControllerDeclarationSemanticCandidate<TMethod, TAttribute>,
): readonly ControllerDeclarationActionSelection<TMethod>[] => Object.freeze(candidate.methods.map(method => {
  const judgment: ControllerDeclarationActionSelection<TMethod> =
    method.visibility !== 'public' && method.visibility !== 'implicit'
      ? Object.freeze({ kind: 'controller_action_excluded', method: method.value, reason: 'non_public_visibility' })
      : method.name.value.value === '__construct'
        ? Object.freeze({ kind: 'controller_action_excluded', method: method.value, reason: 'constructor_lifecycle_method' })
        : method.name.value.value === 'middleware' && method.storage === 'static' && isHasMiddleware(candidate)
          ? Object.freeze({ kind: 'controller_action_excluded', method: method.value, reason: 'laravel_middleware_registration_hook' })
          : Object.freeze({ kind: 'controller_action_selected', method: method.value });
  return judgment;
}));

const ancestryFor = <TMethod, TAttribute>(
  origin: ControllerDeclarationSemanticCandidate<TMethod, TAttribute>,
  inventory: readonly ControllerDeclarationSemanticCandidate<TMethod, TAttribute>[],
): Readonly<{
  readonly names: readonly ControllerDeclarationSemanticSelection<TMethod, TAttribute>['controller'][];
  readonly declarations: readonly ControllerDeclarationAncestorEvidence<TAttribute>[];
  readonly attributes: readonly TAttribute[];
  readonly termination: ControllerDeclarationAncestryTermination;
  readonly rounds: number;
  readonly heightBound: number;
}> => {
  const names: ControllerDeclarationSemanticSelection<TMethod, TAttribute>['controller'][] = [];
  const declarations: ControllerDeclarationAncestorEvidence<TAttribute>[] = [];
  const attributesByAncestor: (readonly TAttribute[])[] = [];
  const seen: ControllerDeclarationSemanticCandidate<TMethod, TAttribute>[] = [origin];
  let current = origin;
  let rounds = 0;
  let termination: ControllerDeclarationAncestryTermination = Object.freeze({ kind: 'root_reached' });
  let converged = false;

  // Each round monotonically adds one previously unseen canonical ancestor or
  // reaches a closed boundary. The finite inventory guarantees termination.
  while (!converged) {
    rounds += 1;
    if (current.parent.kind === 'no_parent') {
      termination = Object.freeze({ kind: 'root_reached' });
      converged = true;
    } else if (current.parent.kind === 'parent_name_resolution_blocked') {
      names.push(current.parent.parent);
      termination = Object.freeze({
        kind: 'parent_name_resolution_blocked',
        parent: current.parent.parent,
        reason: current.parent.identity.reason,
      });
      converged = true;
    } else {
      const parentName = current.parent.parent;
      const parentIdentity = current.parent.identity.qualifiedName;
      const parentCandidates = inventory.filter(item => sameClassIdentity(item.classIdentity, parentIdentity));
      if (parentCandidates.length === 0) {
        names.push(parentName);
        termination = Object.freeze({ kind: 'parent_outside_inventory', parent: parentName });
        converged = true;
      } else if (parentCandidates.length > 1) {
        names.push(parentName);
        termination = Object.freeze({
          kind: 'parent_ambiguous_in_inventory',
          parent: parentName,
          candidates: Object.freeze(parentCandidates.map(candidate => candidate.sourceFile)),
        });
        converged = true;
      } else {
        const parent = parentCandidates[0];
        if (parent === undefined) {
          names.push(parentName);
          termination = Object.freeze({ kind: 'parent_outside_inventory', parent: parentName });
          converged = true;
        } else if (seen.some(item => sameClassIdentity(item.classIdentity, parent.classIdentity))) {
          termination = Object.freeze({ kind: 'inheritance_cycle', repeated: parentName });
          converged = true;
        } else {
          names.push(parentName);
          const ownMiddlewareAttributes = parent.attributes
            .filter(attribute => attribute.name.value.value === 'WithoutMiddleware')
            .map(attribute => attribute.value);
          declarations.push(Object.freeze({
            sourceFile: parent.sourceFile,
            classIdentity: parent.classIdentity,
            controller: parent.controller,
            middlewareAttributes: Object.freeze(ownMiddlewareAttributes),
          }));
          attributesByAncestor.push(Object.freeze(ownMiddlewareAttributes));
          seen.push(parent);
          current = parent;
        }
      }
    }
  }

  const attributes = attributesByAncestor.slice().reverse().flatMap(values => values);
  return Object.freeze({
    names: Object.freeze(names),
    declarations: Object.freeze(declarations),
    attributes: Object.freeze(attributes),
    termination,
    rounds,
    heightBound: inventory.length,
  });
};

const judgeCandidate = <TMethod, TAttribute>(
  candidate: ControllerDeclarationSemanticCandidate<TMethod, TAttribute>,
  inventory: readonly ControllerDeclarationSemanticCandidate<TMethod, TAttribute>[],
): ControllerDeclarationSemanticSelection<TMethod, TAttribute> => {
  const ancestry = ancestryFor(candidate, inventory);
  const selection = Object.freeze({
    sourceFile: candidate.sourceFile,
    classIdentity: candidate.classIdentity,
    controller: candidate.controller,
    inheritedControllerNames: ancestry.names,
    inheritedDeclarations: ancestry.declarations,
    inheritedMiddlewareAttributes: ancestry.attributes,
  });
  return ancestry.termination.kind === 'root_reached'
    ? Object.freeze({
        ...selection,
        kind: 'controller_declaration_selection_complete' as const,
        actionSelections: judgeActionSelection(candidate),
        ancestryTermination: ancestry.termination,
        ancestryClosure: Object.freeze({
          kind: 'controller_ancestry_closure_complete' as const,
          lattice: 'finite_canonical_class_identity_set' as const,
          order: 'subset_by_canonical_class_identity' as const,
          bottom: 'empty_identity_set' as const,
          join: 'set_union' as const,
          transfer: 'add-one-resolved-parent-identity-or-reach-boundary' as const,
          monotonicity: 'seen-identities-only-grow' as const,
          fixedPoint: 'least_fixed_point' as const,
          converged: true as const,
          heightBound: ancestry.heightBound,
          rounds: ancestry.rounds,
          knownAncestors: ancestry.declarations.length,
        }),
      })
    : Object.freeze({
        ...selection,
        kind: 'controller_declaration_selection_blocked' as const,
        ancestryTermination: ancestry.termination,
        ancestryClosure: Object.freeze({
          kind: 'controller_ancestry_closure_partial' as const,
          lattice: 'finite_canonical_class_identity_set' as const,
          order: 'subset_by_canonical_class_identity' as const,
          bottom: 'empty_identity_set' as const,
          join: 'set_union' as const,
          transfer: 'add-one-resolved-parent-identity-or-reach-boundary' as const,
          monotonicity: 'seen-identities-only-grow' as const,
          fixedPoint: 'least_fixed_point_over_resolved_inventory' as const,
          converged: true as const,
          heightBound: ancestry.heightBound,
          rounds: ancestry.rounds,
          knownAncestors: ancestry.declarations.length,
        }),
      });
};

export const controllerDeclarationSemanticJudgmentAuthority: ControllerDeclarationSemanticJudgment = Object.freeze({
  kind: 'controller_declaration_semantic_judgment',
  closed: true,
  correspondences: <TSource, TMethod, TAttribute>(
    input: readonly ControllerDeclarationSemanticSubject<TSource, TMethod, TAttribute>[],
  ) => {
    const validSubjects = Object.freeze(input.filter(subject =>
      subject.sourceIdentity.value.value === subject.candidate.sourceFile.value.value,
    ));
    const inventory = Object.freeze(validSubjects.map(subject => subject.candidate));
    return Object.freeze(input.map(subject => Object.freeze(
      subject.sourceIdentity.value.value === subject.candidate.sourceFile.value.value
        ? {
            kind: 'controller_declaration_semantic_correspondence' as const,
            source: subject.source,
            sourceIdentity: subject.sourceIdentity,
            selection: judgeCandidate(subject.candidate, inventory),
          }
        : {
            kind: 'controller_declaration_source_identity_mismatch' as const,
            source: subject.source,
            sourceIdentity: subject.sourceIdentity,
            candidateSourceIdentity: subject.candidate.sourceFile,
          },
    )));
  },
});
