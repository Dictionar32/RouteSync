import { createClassName } from './names';
import { stringValue } from './valueObjects';
import type { TypeExpression } from './typeVocabulary';
import type { PhpTypeAtomEvidence, PhpTypeAtomInterface, PhpTypeAtomJudgment, PhpTypeClassContext } from './phpTypeAtomInterface';
export type { PhpTypeAtomEvidence, PhpTypeAtomInterface, PhpTypeAtomJudgment, PhpTypeClassContext } from './phpTypeAtomInterface';

const contextualAtoms = new Set(['self', 'parent', 'static']);
const unsupportedVocabularyAtoms = new Set(['void', 'null', 'true', 'false', 'iterable', 'resource', 'callable']);
const primitiveKinds: Readonly<Record<string, 'string' | 'integer' | 'decimal' | 'number' | 'boolean' | 'json'>> = Object.freeze({
  string: 'string', int: 'integer', float: 'decimal', bool: 'boolean', array: 'json',
});
const primitive = (kind: 'string' | 'number' | 'boolean' | 'json'): TypeExpression => ({ kind: 'primitive', value: { kind } });
const malformed = (source: string, diagnostic: string): PhpTypeAtomJudgment => ({ kind: 'malformed', source, reason: 'invalid_atom', diagnostic });
const unsupported = (source: string, reason: 'context_required' | 'missing_vocabulary', diagnostic: string): PhpTypeAtomJudgment => ({ kind: 'unsupported', source, reason, diagnostic });

const resolveContextualAtom = (source: string, lowered: string, context: PhpTypeClassContext | undefined): PhpTypeAtomJudgment => {
  if (lowered === 'self') {
    const name = context?.enclosingClass;
    return name === undefined
      ? unsupported(source, 'context_required', `PHP type atom requires enclosing-class evidence: ${source}`)
      : resolveClassReference(source, name);
  }
  if (lowered === 'parent') {
    const name = context?.parentClass;
    return name === undefined
      ? unsupported(source, 'context_required', `PHP type atom requires parent-class evidence: ${source}`)
      : resolveClassReference(source, name);
  }
  if (lowered === 'static') return unsupported(source, 'context_required', `PHP late-static type requires a dedicated target representation: ${source}`);
  return unsupported(source, 'context_required', `PHP contextual type requires declaration evidence: ${source}`);
};

const resolveClassReference = (source: string, name: string): PhpTypeAtomJudgment => {
  const normalized = name.startsWith('\\') ? name.slice(1) : name;
  const segments = normalized.split('\\');
  const validName = segments.length > 0 && segments.every(segment => /^[A-Za-z_][A-Za-z0-9_]*$/.test(segment));
  return validName
    ? { kind: 'resolved', expression: { kind: 'reference', value: { kind: 'class', name: createClassName(normalized) } } }
    : malformed(source, `Invalid class-context evidence for PHP type atom: ${name}`);
};

const resolve = (evidence: PhpTypeAtomEvidence): PhpTypeAtomJudgment => {
  const source = evidence.source.trim();
  const lowered = source.toLowerCase();
  if (source.length === 0) return malformed(evidence.source, 'PHP type atom must not be empty');
  if (contextualAtoms.has(lowered)) {
    return resolveContextualAtom(evidence.source, lowered, evidence.classContext);
  }
  if (unsupportedVocabularyAtoms.has(lowered)) {
    return unsupported(evidence.source, 'missing_vocabulary', `PHP type atom has no faithful canonical TypeExpression representation: ${source}`);
  }
  const primitiveKind = primitiveKinds[lowered];
  if (primitiveKind !== undefined) return { kind: 'resolved', expression: primitive(primitiveKind) };
  if (lowered === 'mixed') return { kind: 'resolved', expression: { kind: 'mixed' } };
  if (lowered === 'never') return { kind: 'resolved', expression: { kind: 'uninhabited' } };
  if (lowered === 'object') return { kind: 'resolved', expression: { kind: 'object', properties: { kind: 'type_properties', items: { kind: 'empty' } } } };

  const className = source.startsWith('\\') ? source.slice(1) : source;
  const segments = className.split('\\');
  const validName = segments.length > 0 && segments.every(segment => /^[A-Za-z_][A-Za-z0-9_]*$/.test(segment));
  return validName
    ? { kind: 'resolved', expression: { kind: 'reference', value: { kind: 'class', name: createClassName(className) } } }
    : malformed(evidence.source, `Unsupported or malformed PHP type expression: ${source}`);
};

export const phpTypeAtomAlgebra: PhpTypeAtomInterface = Object.freeze({ resolve });
