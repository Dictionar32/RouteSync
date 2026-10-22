import type { PhpClassConstructorSelectionAuthorityInterface, PhpClassMethodDeclarationInventory } from './phpClassConstructorSelectionInterface';
import type { PhpClassConstructorSelection } from './phpClassConstructorSelectionInterface';

const selectFromCompleteInventory = <TMethod>(inventory: Extract<PhpClassMethodDeclarationInventory<TMethod>, { readonly kind: 'php_class_method_declaration_inventory_complete' }>): PhpClassConstructorSelection<TMethod> => {
  const constructors = inventory.declarations.filter(method => method.name.value.value.toLowerCase() === '__construct');
  const [selected] = constructors;
  return selected === undefined
    ? Object.freeze({ kind: 'php_class_constructor_missing', classSource: inventory.classSource })
    : constructors.length === 1
      ? Object.freeze({ kind: 'php_class_constructor_selected', method: selected })
      : Object.freeze({ kind: 'php_class_constructor_ambiguous', classSource: inventory.classSource, candidates: Object.freeze(constructors.map(method => method.source)) });
};

export const phpClassConstructorSelectionAuthority: PhpClassConstructorSelectionAuthorityInterface = Object.freeze({
  kind: 'php_class_constructor_selection_authority',
  closed: true,
  contractVersion: 2,
  select: <TMethod>(inventory: PhpClassMethodDeclarationInventory<TMethod>): PhpClassConstructorSelection<TMethod> => inventory.kind === 'php_class_method_declaration_inventory_complete'
    ? selectFromCompleteInventory(inventory)
    : Object.freeze({ kind: 'php_class_constructor_selection_blocked', classSource: inventory.classSource, blockers: inventory.blockers }),
});
