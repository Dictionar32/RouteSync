import type { ClassName, ControllerName } from './names';
import type { SourceSpan } from './provenance';
import type { ControllerMethodAttribute, ControllerMethodContract } from './controller';
import type { ControllerActionFlowContract } from './highLevelContracts';

/** Upstream-owned controller declaration evidence. Concrete PHP AST stays in the scanner. */
export interface ControllerMethodEvidence {
  readonly kind: 'controller_method_evidence';
  readonly controller: ControllerName;
  readonly action: ControllerActionFlowContract;
  readonly contract: ControllerMethodContract;
  readonly source: SourceSpan;
}

export interface ControllerDeclarationEvidence {
  readonly kind: 'controller_declaration_evidence';
  readonly controller: ControllerName;
  readonly attributes: import('./collections').Sequence<ControllerMethodAttribute>;
  readonly inheritedAttributes: import('./collections').Sequence<ControllerMethodAttribute>;
  readonly inheritance: import('./controller').ControllerInheritanceRelation | null;
  readonly interfaces: readonly ClassName[];
  readonly methods: readonly ControllerMethodEvidence[];
  readonly source: SourceSpan;
}
