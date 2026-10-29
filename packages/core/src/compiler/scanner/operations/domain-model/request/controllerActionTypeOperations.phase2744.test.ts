import { describe, expect, it } from 'vitest';
import { RouteHandlerKind } from '../../../../../types/route';
import { createActionName, createControllerName } from '../../../../../types/domain/semanticValues';
import { controllerActionTypeOperations } from './controllerActionTypes';

describe('controller action type runtime operation phase 2744', () => {
  it('projects the invokable-controller ADT for __invoke', () => {
    const result = controllerActionTypeOperations.buildRouteHandler(
      createControllerName('App\\Http\\Controllers\\HealthController'),
      createActionName('__invoke'),
    );

    expect(result.kind).toBe(RouteHandlerKind.InvokableController);
    expect(result.actionName.value.value).toBe('__invoke');
  });

  it('projects a controller-action ADT for named methods', () => {
    const result = controllerActionTypeOperations.buildRouteHandler(
      createControllerName('App\\Http\\Controllers\\UserController'),
      createActionName('show'),
    );

    expect(result.kind).toBe(RouteHandlerKind.ControllerAction);
    expect(result.actionName.value.value).toBe('show');
  });
});
