import type {
  ControllerDeclarationSemanticCorrespondence,
  ControllerDeclarationSemanticSelection,
  ControllerDeclarationAncestryTermination,
} from './controllerDeclarationSemanticJudgmentInterface';
import type { ControllerName, SourceFile } from './names';

export type ControllerDeclarationSelectionInventoryBlocker =
  | Readonly<{
      readonly kind: 'controller_declaration_source_identity_mismatch';
      readonly sourceIdentity: SourceFile;
      readonly candidateSourceIdentity: SourceFile;
    }>
  | Readonly<{
      readonly controller: ControllerName;
      readonly ancestryTermination: Exclude<ControllerDeclarationAncestryTermination, { readonly kind: 'root_reached' }>;
    }>;

type CompleteSelection<TMethod, TAttribute> = Extract<
  ControllerDeclarationSemanticSelection<TMethod, TAttribute>,
  { readonly kind: 'controller_declaration_selection_complete' }
>;

type SourceMatchedCorrespondence<TSource, TMethod, TAttribute> = Extract<
  ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>,
  { readonly kind: 'controller_declaration_semantic_correspondence' }
> & Readonly<{
  readonly selection: CompleteSelection<TMethod, TAttribute>;
}>;

export type ControllerDeclarationSelectionInventoryClosure<TSource, TMethod, TAttribute> =
  | Readonly<{
      readonly kind: 'controller_declaration_selection_inventory_closed';
      readonly correspondences: readonly SourceMatchedCorrespondence<TSource, TMethod, TAttribute>[];
    }>
  | Readonly<{
      readonly kind: 'controller_declaration_selection_inventory_blocked';
      readonly blockers: readonly [ControllerDeclarationSelectionInventoryBlocker, ...ControllerDeclarationSelectionInventoryBlocker[]];
    }>;

export interface ControllerDeclarationSelectionInventoryClosureAuthorityInterface {
  readonly kind: 'controller_declaration_selection_inventory_closure_authority';
  close<TSource, TMethod, TAttribute>(
    correspondences: readonly ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>[],
  ): ControllerDeclarationSelectionInventoryClosure<TSource, TMethod, TAttribute>;
}
