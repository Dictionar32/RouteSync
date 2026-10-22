import { phpTypeAtomAlgebra } from './phpTypeAtomAlgebra';
import type { TypeExpression } from './typeVocabulary';
import type { PhpParameterTypeEvidence, PhpParameterTypeInterface, PhpParameterTypeJudgment } from './phpParameterTypeInterface';
export type { PhpParameterTypeEvidence, PhpParameterTypeInterface, PhpParameterTypeJudgment } from './phpParameterTypeInterface';

const resolve = (evidence: PhpParameterTypeEvidence, inheritedContext?: import('./phpTypeAtomInterface').PhpTypeClassContext): PhpParameterTypeJudgment => {
  const classContext = evidence.classContext ?? inheritedContext;
  switch (evidence.kind) {
    case 'primitive': {
      const atom = phpTypeAtomAlgebra.resolve({ source: evidence.name, classContext });
      if (atom.kind === 'resolved') return { kind: 'resolved', expression: atom.expression };
      if (atom.kind === 'unsupported') return atom;
      return { kind: 'malformed', diagnostic: atom.diagnostic };
    }
    case 'named': {
      const atom = phpTypeAtomAlgebra.resolve({ source: evidence.name, classContext });
      if (atom.kind === 'resolved') return { kind: 'resolved', expression: atom.expression };
      if (atom.kind === 'unsupported') return atom;
      return { kind: 'malformed', diagnostic: atom.diagnostic };
    }
    case 'nullable': {
      const inner = resolve(evidence.inner, classContext);
      if (inner.kind !== 'resolved') return inner;
      return { kind: 'resolved', expression: { kind: 'nullable', value: inner.expression } };
    }
  }
};

export const phpParameterTypeAlgebra: PhpParameterTypeInterface = Object.freeze({ resolve });
