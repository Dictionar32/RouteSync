import { describe, expect, it } from 'vitest';
import { createClassName, createResourceName, createRoutePath } from '../names';
import {
  defaultApiResourceRegistration,
  resolveApiResourceFlow,
  singularizeLaravelResourceName,
} from '../routeResourceFlow';

const registration = (name: string) => defaultApiResourceRegistration(
  createResourceName(name),
  { kind: 'conventional_controller', className: createClassName('PhotoController') },
);

describe('Laravel apiResource upstream route flow phase 48', () => {
  it('uses Laravel singular resource parameters instead of hardcoded {id}', () => {
    const plan = resolveApiResourceFlow({
      declarationPath: createRoutePath('photos'),
      prefix: [],
      resource: createResourceName('photos'),
      registration: registration('photos'),
    });

    expect(plan.actions.map(action => `${action.method} ${action.path.value.value}`)).toEqual([
      'GET /photos',
      'POST /photos',
      'GET /photos/{photo}',
      'PUT /photos/{photo}',
      'PATCH /photos/{photo}',
      'DELETE /photos/{photo}',
    ]);
  });

  it('resolves nested resources according to Laravel resource URI conventions', () => {
    const plan = resolveApiResourceFlow({
      declarationPath: createRoutePath('photos.comments'),
      prefix: [],
      resource: createResourceName('comments'),
      registration: registration('comments'),
    });

    expect(plan.actions.map(action => `${action.method} ${action.path.value.value}`)).toEqual([
      'GET /photos/{photo}/comments',
      'POST /photos/{photo}/comments',
      'GET /photos/{photo}/comments/{comment}',
      'PUT /photos/{photo}/comments/{comment}',
      'PATCH /photos/{photo}/comments/{comment}',
      'DELETE /photos/{photo}/comments/{comment}',
    ]);
  });

  it('supports Laravel-style singularization for common resource names', () => {
    expect(singularizeLaravelResourceName('categories')).toBe('category');
    expect(singularizeLaravelResourceName('people')).toBe('person');
    expect(singularizeLaravelResourceName('orders')).toBe('order');
  });
});
