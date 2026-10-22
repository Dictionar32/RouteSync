import type {
  ControllerDeclarationSemanticCorrespondence,
} from './controllerDeclarationSemanticJudgmentInterface';
import type {
  ControllerDeclarationSelectionInventoryBlocker,
  ControllerDeclarationSelectionInventoryClosure,
  ControllerDeclarationSelectionInventoryClosureAuthorityInterface,
} from './controllerDeclarationSelectionInventoryClosureInterface';

const blockersOf = <TSource, TMethod, TAttribute>(
  correspondence: ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>,
): readonly ControllerDeclarationSelectionInventoryBlocker[] => {
  switch (correspondence.kind) {
    case 'controller_declaration_source_identity_mismatch':
      return [Object.freeze({
        kind: 'controller_declaration_source_identity_mismatch',
        sourceIdentity: correspondence.sourceIdentity,
        candidateSourceIdentity: correspondence.candidateSourceIdentity,
      })];
    case 'controller_declaration_semantic_correspondence':
      switch (correspondence.selection.kind) {
        case 'controller_declaration_selection_complete':
          return [];
        case 'controller_declaration_selection_blocked':
          return [Object.freeze({
            controller: correspondence.selection.controller,
            ancestryTermination: correspondence.selection.ancestryTermination,
          })];
      }
  }
};

export const controllerDeclarationSelectionInventoryClosureAuthority: ControllerDeclarationSelectionInventoryClosureAuthorityInterface = Object.freeze({
  kind: 'controller_declaration_selection_inventory_closure_authority',
  close: <TSource, TMethod, TAttribute>(
    correspondences: readonly ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>[],
  ): ControllerDeclarationSelectionInventoryClosure<TSource, TMethod, TAttribute> => {
    const blockers = correspondences.flatMap(blockersOf);
    switch (blockers.length) {
      case 0:
        return Object.freeze({
          kind: 'controller_declaration_selection_inventory_closed',
          correspondences: Object.freeze(correspondences.flatMap(correspondence =>
            correspondence.kind === 'controller_declaration_semantic_correspondence'
              && correspondence.selection.kind === 'controller_declaration_selection_complete'
              ? [correspondence]
              : [],
          )),
        });
      default: {
        const [first, ...rest] = blockers;
        return Object.freeze({
          kind: 'controller_declaration_selection_inventory_blocked',
          blockers: Object.freeze([first, ...rest]),
        });
      }
    }
  },
});
