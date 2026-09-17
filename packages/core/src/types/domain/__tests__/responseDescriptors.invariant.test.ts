import { describe, expect, it } from 'vitest';
import { ModelResponseDescriptor, ResourceResponseDescriptor } from '../responseDescriptors';

describe('ResponseDescriptor origin invariants', () => {
  it('requires an explicit resource identity', () => {
    const descriptor = ResourceResponseDescriptor.create({ resourceName: 'OrderResource' });
    expect(descriptor.resourceName).toBe('OrderResource');
  });

  it('requires an explicit model identity', () => {
    const descriptor = ModelResponseDescriptor.create({ modelName: 'Order' });
    expect(descriptor.modelName).toBe('Order');
  });
});
