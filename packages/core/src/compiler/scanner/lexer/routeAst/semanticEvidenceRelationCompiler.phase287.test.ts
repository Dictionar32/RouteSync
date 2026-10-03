import { compileSemanticEvidenceRelations } from './semanticEvidenceRelationCompiler';
import { knowledgeId, semanticSource } from './semanticKnowledgeDataFlowRelations';

const source = semanticSource('/phase287.php', 0, 1);
const predicate = knowledgeId(source, 'predicate', 'predicate');
const candidate = knowledgeId(source, 'match', 'candidate');

const result = compileSemanticEvidenceRelations({
  facts: [
    { kind: 'predicate', value: { id: predicate, source: source as never } } as never,
    { kind: 'match', value: { id: candidate, candidate, source: source as never } } as never,
  ],
  dataFlow: [
    { kind: 'dependency', source: candidate, target: predicate, role: { code: 'predicate' } as never, guard: { kind: 'absent', reason: { code: 'not_applicable' } } } as never,
  ],
});

if (!result.some(fact => fact.relation === 'condition')) throw new Error('relation-native evidence must emit condition');
if (!result.some(fact => fact.relation === 'candidate')) throw new Error('relation-native evidence must emit candidate');
if (!result.some(fact => fact.relation === 'depends')) throw new Error('relation-native evidence must emit dependency');
console.log('RELATIONAL-EVIDENCE-COMPILER-PASS');
