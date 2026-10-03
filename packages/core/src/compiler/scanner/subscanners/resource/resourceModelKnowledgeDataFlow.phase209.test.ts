import { describe, expect, it } from 'vitest';
import { createModelName, createRelationName, createResourceName } from '../../../../types/upstream/names';
import {
  createResourceModelResolutionFact,
  createResourceRelationFact,
  deriveResourceModelResolutionIndex,
  type ResourceModelKnowledgeDataFlow,
} from './resourceModelKnowledgeDataFlow';

describe('Phase 209 resource model knowledge/data-flow', () => {
  it('keeps Resource -> Model resolution as canonical facts and derives lookup only as an index', () => {
    const resource = createResourceName('PhotoResource');
    const model = createModelName('Photo');
    const flow: ResourceModelKnowledgeDataFlow = Object.freeze({
      kind: 'resource_model_knowledge_data_flow',
      relations: Object.freeze([]),
      resolutions: Object.freeze([
        createResourceModelResolutionFact(resource, model, 'convention'),
      ]),
    });

    const index = deriveResourceModelResolutionIndex(flow);

    expect(flow.resolutions).toHaveLength(1);
    expect(index.get(resource)).toEqual(model);
  });

  it('represents nested resource relation meaning as data instead of a control-flow branch', () => {
    const parent = createResourceName('PhotoResource');
    const child = createResourceName('CommentResource');
    const relation = createRelationName('comments');

    const fact = createResourceRelationFact(parent, child, relation);

    expect(fact.kind).toBe('resource_relation');
    expect(fact.parentResource).toEqual(parent);
    expect(fact.childResource).toEqual(child);
    expect(fact.relationKey).toEqual(relation);
  });
});
