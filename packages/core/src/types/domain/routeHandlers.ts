/**
 * routeHandlers.ts
 *
 * Algebraic Data Type (ADT) for Route Handlers and FormRequest Descriptors.
 * Zero Null, Zero Undefined, Pure Tagged Union & Ordered Array SSOT.
 *
 * @module core/types/domain/routeHandlers
 */

import { SemanticValueFactory, type ActionName, type ClassName, type SourceFilePath } from './semanticValues';

export const RouteHandlerKind = Object.freeze({
  ControllerAction: 'controller_action',
  InvokableController: 'invokable_controller',
  Closure: 'closure'
} as const);

export type RouteHandlerKind = typeof RouteHandlerKind[keyof typeof RouteHandlerKind];

export interface RouteHandlerKindSpecification<K extends RouteHandlerKind = RouteHandlerKind> {
  readonly kind: K;
  readonly isController: boolean;
  readonly isClosure: boolean;
  readonly description: string;
}

export type RouteHandlerKindRegistry = {
  readonly [K in RouteHandlerKind]: RouteHandlerKindSpecification<K>;
};

export const ROUTE_HANDLER_KIND_REGISTRY: RouteHandlerKindRegistry = Object.freeze({
  [RouteHandlerKind.ControllerAction]: {
    kind: RouteHandlerKind.ControllerAction,
    isController: true,
    isClosure: false,
    description: 'Controller action method (e.g. Controller@method)'
  },
  [RouteHandlerKind.InvokableController]: {
    kind: RouteHandlerKind.InvokableController,
    isController: true,
    isClosure: false,
    description: 'Single action invokable controller (e.g. Controller@__invoke)'
  },
  [RouteHandlerKind.Closure]: {
    kind: RouteHandlerKind.Closure,
    isController: false,
    isClosure: true,
    description: 'Inline route closure function'
  }
});

export interface BaseRouteHandlerDescriptor {
  readonly kind: RouteHandlerKind;
  readonly target: ClassName;
}

export interface ControllerActionHandlerDescriptor extends BaseRouteHandlerDescriptor {
  readonly kind: typeof RouteHandlerKind.ControllerAction;
  readonly controllerName: ClassName;
  readonly actionName: ActionName;
  readonly target: ClassName; // e.g. 'OrderController@index'
}

export interface InvokableControllerHandlerDescriptor extends BaseRouteHandlerDescriptor {
  readonly kind: typeof RouteHandlerKind.InvokableController;
  readonly controllerName: ClassName;
  readonly actionName: ActionName & '__invoke';
  readonly target: ClassName; // e.g. 'DashboardController@__invoke'
}

export interface ClosureHandlerDescriptor extends BaseRouteHandlerDescriptor {
  readonly kind: typeof RouteHandlerKind.Closure;
  readonly actionName: ActionName;
  readonly target: ClassName; // e.g. 'closure@query'
}

export type RouteHandlerDescriptor =
  | ControllerActionHandlerDescriptor
  | InvokableControllerHandlerDescriptor
  | ClosureHandlerDescriptor;

export interface RouteHandlerVisitor<R> {
  readonly controllerAction: (handler: ControllerActionHandlerDescriptor) => R;
  readonly invokableController: (handler: InvokableControllerHandlerDescriptor) => R;
  readonly closure: (handler: ClosureHandlerDescriptor) => R;
}

/**
 * Pure Catamorphism Matcher for RouteHandlerDescriptor (0 'if', 0 'switch' downstream).
 */
export function matchRouteHandler<R>(
  handler: RouteHandlerDescriptor,
  visitor: RouteHandlerVisitor<R>
): R {
  if (handler.kind === RouteHandlerKind.ControllerAction) {
    return visitor.controllerAction(handler);
  }
  if (handler.kind === RouteHandlerKind.InvokableController) {
    return visitor.invokableController(handler);
  }
  return visitor.closure(handler);
}

/**
 * First-Class FormRequest AST Descriptor.
 * Repositories and routes hold ordered arrays of FormRequestDescriptor (0 null, 0 undefined, 0 '?').
 */
export interface FormRequestDescriptor {
  readonly name: ClassName;
  readonly sourceFile: SourceFilePath;
}

export const ScannedFormRequestDescriptor = Object.freeze({
  create(name: string, sourceFile: string): FormRequestDescriptor {
    return Object.freeze({
      name: SemanticValueFactory.className(name),
      sourceFile: SemanticValueFactory.sourceFilePath(sourceFile)
    });
  }
});
