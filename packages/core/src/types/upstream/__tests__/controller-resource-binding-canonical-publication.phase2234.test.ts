import { describe, expect, it } from 'vitest';
import { controllerResourceBindingAuthority } from '../controllerResourceBindingAuthority';
import { createSourceFile } from '../names';
import { SemanticValueFactory } from '../../domain/semanticValues';
import { responseRef } from '../semanticReferences';
import type { ControllerResourceBindingPublicationInput } from '../controllerResourceBindingInterface';

describe('controller resource binding canonical publication phase 2234', () => {
  it('publishes already-judged resource facts without reclassifying them', () => {
    const input: ControllerResourceBindingPublicationInput = {
      resourceName: SemanticValueFactory.resourceName('Post'),
      model: { kind: 'model_class', name: SemanticValueFactory.modelName('Post') },
      response: responseRef('PostResponse'),
      source: {
        kind: 'source_span',
        file: createSourceFile('/app/Http/Controllers/PostController.php'),
        start: { kind: 'number_value', value: 18 },
        end: { kind: 'number_value', value: 43 },
      },
    };

    expect(controllerResourceBindingAuthority.publishResolved(input)).toEqual({
      resource: { kind: 'resource_reference', name: input.resourceName },
      model: input.model,
      response: input.response,
      source: input.source,
    });
  });
});
