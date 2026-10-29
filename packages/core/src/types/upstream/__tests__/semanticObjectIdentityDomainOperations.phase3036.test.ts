import { knowledgeId, semanticSource } from '../semanticDataflowKnowledge';
import { semanticObjectIdentityOperations } from '../semanticObjectIdentityInterface';

const sourceA = semanticSource.create('identity-a.php', 10, 20);
const sourceB = semanticSource.create('identity-b.php', 10, 20);
const left = knowledgeId(sourceA, 'variable', 'left');
const right = knowledgeId(sourceA, 'variable', 'right');
const sameLeft = knowledgeId(sourceA, 'variable', 'left');
const otherSource = knowledgeId(sourceB, 'variable', 'left');

const sameOrdered = semanticObjectIdentityOperations.sameOrderedPair([left, right], [sameLeft, right]);
const reversedOrdered = semanticObjectIdentityOperations.sameOrderedPair([left, right], [right, left]);
const reversedUnordered = semanticObjectIdentityOperations.sameUnorderedPair([left, right], [right, sameLeft]);
const distinctSource = semanticObjectIdentityOperations.same(left, otherSource);

if (sameOrdered.kind !== 'same_semantic_object_pair') {
  throw new Error('Phase 3036: equal ordered KnowledgeId pairs must match.');
}
if (reversedOrdered.kind !== 'different_semantic_object_pair') {
  throw new Error('Phase 3036: ordered pair comparison must preserve order.');
}
if (reversedUnordered.kind !== 'same_semantic_object_pair') {
  throw new Error('Phase 3036: unordered pair comparison must recognize reversed identities.');
}
if (distinctSource.kind !== 'different_knowledge_id') {
  throw new Error('Phase 3036: source provenance must participate in KnowledgeId identity.');
}
