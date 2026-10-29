import { describe, expect, it } from 'vitest';
import { controllerDeclarationSemanticJudgmentAuthority } from './controllerDeclarationSemanticJudgmentAuthority';
import type { ControllerDeclarationSemanticCandidate } from './controllerDeclarationSemanticJudgmentInterface';
import { createActionName, createClassName, createControllerName, sourceFileIdentityFactory, stringValue } from './names';
import { phpQualifiedClassNameFactory } from './phpClassNameResolutionInterface';

type MethodEvidence = Readonly<{
  readonly name: string;
  readonly visibility: 'public' | 'protected' | 'private' | 'implicit';
  readonly storage: 'instance' | 'static';
}>;
type AttributeEvidence = Readonly<{ readonly name: string }>;

const method = (name: string, visibility: MethodEvidence['visibility']): MethodEvidence => Object.freeze({
  name,
  visibility,
  storage: 'instance',
});

const candidate = (
  controller: string,
  parent: ControllerDeclarationSemanticCandidate<MethodEvidence, AttributeEvidence>['parent'],
  methods: readonly MethodEvidence[],
): ControllerDeclarationSemanticCandidate<MethodEvidence, AttributeEvidence> => Object.freeze({
  sourceFile: sourceFileIdentityFactory.create(stringValue.create(`/src/${controller}.php`)),
  classIdentity: phpQualifiedClassNameFactory.create(controller),
  controller: createControllerName(controller),
  parent,
  interfaces: Object.freeze([]),
  methods: Object.freeze(methods.map(value => Object.freeze({
    name: createActionName(value.name),
    visibility: value.visibility,
    storage: value.storage,
    value,
  }))),
  attributes: Object.freeze([]),
});

const judgments = <TMethod, TAttribute>(input: readonly ControllerDeclarationSemanticCandidate<TMethod, TAttribute>[]) =>
  controllerDeclarationSemanticJudgmentAuthority.correspondences(Object.freeze(input.map(candidate => Object.freeze({
    source: candidate,
    sourceIdentity: candidate.sourceFile,
    candidate,
  })))).flatMap(correspondence => correspondence.kind === 'controller_declaration_semantic_correspondence' ? [correspondence.selection] : []);

describe('Phase 1968 controller declaration judgment closure', () => {
  it('selects only externally callable controller methods and excludes constructors', () => {
    const input = Object.freeze([candidate('OrderController', Object.freeze({ kind: 'no_parent' }), Object.freeze([
      method('__construct', 'public'),
      method('show', 'public'),
      method('implicitAction', 'implicit'),
      method('internal', 'private'),
      method('protectedHelper', 'protected'),
    ]))]);
    const judgment = judgments(input);
    const selection = judgment[0];
    expect(selection?.kind === 'controller_declaration_selection_complete' ? selection.actionSelections.filter(value => value.kind === 'controller_action_selected').map(value => value.method.name) : []).toEqual(['show', 'implicitAction']);
    expect(selection?.kind === 'controller_declaration_selection_complete' ? selection.actionSelections.filter(value => value.kind === 'controller_action_excluded').map(value => value.reason) : []).toEqual([
      'constructor_lifecycle_method',
      'non_public_visibility',
      'non_public_visibility',
    ]);
  });

  it('records Laravel middleware registration exclusion as a semantic judgment', () => {
    const candidateWithMiddlewareHook = Object.freeze({
      ...candidate('OrderController', Object.freeze({ kind: 'no_parent' }), Object.freeze([
        method('middleware', 'public'),
        method('show', 'public'),
      ])),
      interfaces: Object.freeze([createClassName('HasMiddleware')]),
      methods: Object.freeze([
        Object.freeze({ name: createActionName('middleware'), visibility: 'public' as const, storage: 'static' as const, value: method('middleware', 'public') }),
        Object.freeze({ name: createActionName('show'), visibility: 'public' as const, storage: 'instance' as const, value: method('show', 'public') }),
      ]),
    });
    const selection = judgments(Object.freeze([candidateWithMiddlewareHook]))[0];
    expect(selection?.kind).toBe('controller_declaration_selection_complete');
    expect(selection?.kind === 'controller_declaration_selection_complete' ? selection.actionSelections : []).toEqual([
      { kind: 'controller_action_excluded', method: method('middleware', 'public'), reason: 'laravel_middleware_registration_hook' },
      { kind: 'controller_action_selected', method: method('show', 'public') },
    ]);
  });

  it('returns each source subject beside its own judgment without a positional join', () => {
    const first = candidate('OrderController', Object.freeze({ kind: 'no_parent' }), Object.freeze([]));
    const second = candidate('AdminController', Object.freeze({ kind: 'no_parent' }), Object.freeze([]));
    const firstSource = Object.freeze({ marker: 'first' });
    const secondSource = Object.freeze({ marker: 'second' });
    const correspondences = controllerDeclarationSemanticJudgmentAuthority.correspondences(Object.freeze([
      Object.freeze({ source: firstSource, sourceIdentity: first.sourceFile, candidate: first }),
      Object.freeze({ source: secondSource, sourceIdentity: second.sourceFile, candidate: second }),
    ]));
    expect(correspondences[0]?.kind).toBe('controller_declaration_semantic_correspondence');
    expect(correspondences[0]?.source).toBe(firstSource);
    expect(correspondences[0]?.kind === 'controller_declaration_semantic_correspondence' ? correspondences[0].selection.controller.value.value : null).toBe('OrderController');
    expect(correspondences[1]?.kind).toBe('controller_declaration_semantic_correspondence');
    expect(correspondences[1]?.source).toBe(secondSource);
    expect(correspondences[1]?.kind === 'controller_declaration_semantic_correspondence' ? correspondences[1].selection.controller.value.value : null).toBe('AdminController');
  });

  it('rejects a declaration candidate whose source identity differs from its invocation subject', () => {
    const source = candidate('OrderController', Object.freeze({ kind: 'no_parent' }), Object.freeze([]));
    const candidateWithDifferentIdentity = Object.freeze({
      ...source,
      sourceFile: sourceFileIdentityFactory.create(stringValue.create('/src/OtherController.php')),
    });
    const sourceIdentity = sourceFileIdentityFactory.create(stringValue.create('/src/OrderController.php'));
    const correspondences = controllerDeclarationSemanticJudgmentAuthority.correspondences(Object.freeze([
      Object.freeze({ source, sourceIdentity, candidate: candidateWithDifferentIdentity }),
    ]));
    expect(correspondences).toEqual([{
      kind: 'controller_declaration_source_identity_mismatch',
      source,
      sourceIdentity,
      candidateSourceIdentity: candidateWithDifferentIdentity.sourceFile,
    }]);
  });

  it('preserves exact source identity in each semantic selection', () => {
    const first = candidate('OrderController', Object.freeze({ kind: 'no_parent' }), Object.freeze([]));
    const second = Object.freeze({ ...candidate('OrderController', Object.freeze({ kind: 'no_parent' }), Object.freeze([])), sourceFile: sourceFileIdentityFactory.create(stringValue.create('/src/Admin/OrderController.php')) });
    const selections = judgments(Object.freeze([first, second]));
    expect(selections.map(selection => selection.sourceFile.value.value)).toEqual(['/src/OrderController.php', '/src/Admin/OrderController.php']);
  });

  it('blocks parent resolution when short class names are ambiguous in the inventory', () => {
    const firstParent = Object.freeze({
      ...candidate('BaseController', Object.freeze({ kind: 'no_parent' }), Object.freeze([])),
      sourceFile: sourceFileIdentityFactory.create(stringValue.create('/src/Admin/BaseController.php')),
    });
    const secondParent = Object.freeze({
      ...candidate('BaseController', Object.freeze({ kind: 'no_parent' }), Object.freeze([])),
      sourceFile: sourceFileIdentityFactory.create(stringValue.create('/src/Store/BaseController.php')),
    });
    const child = candidate('OrderController', Object.freeze({ kind: 'parent_declared', parent: createControllerName('BaseController'), identity: Object.freeze({ kind: 'php_class_name_resolved' as const, sourceName: createClassName('BaseController'), qualifiedName: phpQualifiedClassNameFactory.create('BaseController'), rule: 'current_namespace' as const }) }), Object.freeze([]));
    const selections = judgments(Object.freeze([firstParent, secondParent, child]));
    const childSelection = selections.find(selection => selection.sourceFile.value.value === '/src/OrderController.php');
    expect(childSelection?.kind).toBe('controller_declaration_selection_blocked');
    expect(childSelection?.ancestryTermination.kind).toBe('parent_ambiguous_in_inventory');
    expect(childSelection === undefined ? false : 'actionSelections' in childSelection).toBe(false);
    if (childSelection?.ancestryTermination.kind === 'parent_ambiguous_in_inventory') {
      expect(childSelection.ancestryTermination.candidates.map(source => source.value.value)).toEqual([
        '/src/Admin/BaseController.php',
        '/src/Store/BaseController.php',
      ]);
    }
  });


  it('resolves a duplicate short parent name by canonical PHP class identity', () => {
    const adminParent = Object.freeze({
      ...candidate('BaseController', Object.freeze({ kind: 'no_parent' }), Object.freeze([])),
      sourceFile: sourceFileIdentityFactory.create(stringValue.create('/src/Admin/BaseController.php')),
      classIdentity: phpQualifiedClassNameFactory.create('Admin\\BaseController'),
    });
    const storeParent = Object.freeze({
      ...candidate('BaseController', Object.freeze({ kind: 'no_parent' }), Object.freeze([])),
      sourceFile: sourceFileIdentityFactory.create(stringValue.create('/src/Store/BaseController.php')),
      classIdentity: phpQualifiedClassNameFactory.create('Store\\BaseController'),
    });
    const child = Object.freeze({
      ...candidate('OrderController', Object.freeze({
        kind: 'parent_declared',
        parent: createControllerName('BaseController'),
        identity: Object.freeze({
          kind: 'php_class_name_resolved' as const,
          sourceName: createClassName('ParentController'),
          qualifiedName: phpQualifiedClassNameFactory.create('Admin\\BaseController'),
          rule: 'class_import' as const,
        }),
      }), Object.freeze([])),
      classIdentity: phpQualifiedClassNameFactory.create('Store\\OrderController'),
    });
    const selections = judgments(Object.freeze([adminParent, storeParent, child]));
    const childSelection = selections.find(selection => selection.sourceFile.value.value === '/src/OrderController.php');
    expect(childSelection?.kind).toBe('controller_declaration_selection_complete');
    expect(childSelection?.ancestryClosure).toMatchObject({
      kind: 'controller_ancestry_closure_complete',
      lattice: 'finite_canonical_class_identity_set',
      order: 'subset_by_canonical_class_identity',
      bottom: 'empty_identity_set',
      join: 'set_union',
      transfer: 'add-one-resolved-parent-identity-or-reach-boundary',
      monotonicity: 'seen-identities-only-grow',
      fixedPoint: 'least_fixed_point',
      heightBound: 3,
      converged: true,
      rounds: 2,
      knownAncestors: 1,
    });
    expect(childSelection?.inheritedControllerNames.map(name => name.value.value)).toEqual(['BaseController']);
    expect(childSelection?.inheritedDeclarations.map(ancestor => ({
      sourceFile: ancestor.sourceFile.value.value,
      classIdentity: ancestor.classIdentity.value.value,
      controller: ancestor.controller.value.value,
    }))).toEqual([{
      sourceFile: '/src/Admin/BaseController.php',
      classIdentity: 'Admin\\BaseController',
      controller: 'BaseController',
    }]);
  });

  it('preserves resolved ancestor identities when a more distant parent blocks closure', () => {
    const knownParent = Object.freeze({
      ...candidate('KnownBaseController', Object.freeze({
        kind: 'parent_name_resolution_blocked',
        parent: createControllerName('ExternalBaseController'),
        identity: Object.freeze({
          kind: 'php_class_name_resolution_blocked' as const,
          sourceName: createClassName('ExternalBaseController'),
          reason: 'class_import_inventory_incomplete' as const,
        }),
      }), Object.freeze([])),
      sourceFile: sourceFileIdentityFactory.create(stringValue.create('/src/Framework/KnownBaseController.php')),
      classIdentity: phpQualifiedClassNameFactory.create('Framework\\KnownBaseController'),
    });
    const child = Object.freeze({
      ...candidate('OrderController', Object.freeze({
        kind: 'parent_declared',
        parent: createControllerName('KnownBaseController'),
        identity: Object.freeze({
          kind: 'php_class_name_resolved' as const,
          sourceName: createClassName('KnownBaseController'),
          qualifiedName: phpQualifiedClassNameFactory.create('Framework\\KnownBaseController'),
          rule: 'class_import' as const,
        }),
      }), Object.freeze([])),
      classIdentity: phpQualifiedClassNameFactory.create('App\\OrderController'),
    });
    const selection = judgments(Object.freeze([knownParent, child]))
      .find(value => value.sourceFile.value.value === '/src/OrderController.php');
    expect(selection?.kind).toBe('controller_declaration_selection_blocked');
    expect(selection?.inheritedDeclarations.map(ancestor => ({
      sourceFile: ancestor.sourceFile.value.value,
      classIdentity: ancestor.classIdentity.value.value,
    }))).toEqual([{
      sourceFile: '/src/Framework/KnownBaseController.php',
      classIdentity: 'Framework\\KnownBaseController',
    }]);
    expect(selection?.ancestryTermination.kind).toBe('parent_name_resolution_blocked');
    expect(selection?.ancestryClosure).toMatchObject({
      kind: 'controller_ancestry_closure_partial',
      lattice: 'finite_canonical_class_identity_set',
      order: 'subset_by_canonical_class_identity',
      bottom: 'empty_identity_set',
      join: 'set_union',
      transfer: 'add-one-resolved-parent-identity-or-reach-boundary',
      monotonicity: 'seen-identities-only-grow',
      fixedPoint: 'least_fixed_point_over_resolved_inventory',
      heightBound: 2,
      converged: true,
      rounds: 2,
      knownAncestors: 1,
    });
  });

  it('preserves incomplete class-import evidence as a blocked ancestry outcome', () => {
    const child = candidate('OrderController', Object.freeze({
      kind: 'parent_name_resolution_blocked',
      parent: createControllerName('BaseController'),
      identity: Object.freeze({
        kind: 'php_class_name_resolution_blocked' as const,
        sourceName: createClassName('BaseController'),
        reason: 'class_import_inventory_incomplete' as const,
      }),
    }), Object.freeze([]));
    const selection = judgments(Object.freeze([child]))[0];
    expect(selection?.kind).toBe('controller_declaration_selection_blocked');
    expect(selection?.ancestryTermination.kind).toBe('parent_name_resolution_blocked');
    expect(selection === undefined ? false : 'actionSelections' in selection).toBe(false);
  });

  it('closes a cyclic ancestry without repeating the controller in inherited names', () => {
    const first = candidate('FirstController', Object.freeze({ kind: 'parent_declared', parent: createControllerName('SecondController'), identity: Object.freeze({ kind: 'php_class_name_resolved' as const, sourceName: createClassName('SecondController'), qualifiedName: phpQualifiedClassNameFactory.create('SecondController'), rule: 'current_namespace' as const }) }), Object.freeze([]));
    const second = candidate('SecondController', Object.freeze({ kind: 'parent_declared', parent: createControllerName('FirstController'), identity: Object.freeze({ kind: 'php_class_name_resolved' as const, sourceName: createClassName('FirstController'), qualifiedName: phpQualifiedClassNameFactory.create('FirstController'), rule: 'current_namespace' as const }) }), Object.freeze([]));
    const input = Object.freeze([first, second]);
    const judgment = judgments(input);
    const firstSelection = judgment.find(selection => selection.controller.value.value === 'FirstController');
    expect(firstSelection?.inheritedControllerNames.map(value => value.value.value)).toEqual(['SecondController']);
    expect(firstSelection?.ancestryTermination.kind).toBe('inheritance_cycle');
    expect(firstSelection?.ancestryClosure).toMatchObject({
      kind: 'controller_ancestry_closure_partial',
      order: 'subset_by_canonical_class_identity',
      bottom: 'empty_identity_set',
      join: 'set_union',
      transfer: 'add-one-resolved-parent-identity-or-reach-boundary',
      monotonicity: 'seen-identities-only-grow',
      fixedPoint: 'least_fixed_point_over_resolved_inventory',
      converged: true,
      heightBound: 2,
      rounds: 2,
      knownAncestors: 1,
    });
    expect(firstSelection === undefined ? false : 'actionSelections' in firstSelection).toBe(false);
  });
});
