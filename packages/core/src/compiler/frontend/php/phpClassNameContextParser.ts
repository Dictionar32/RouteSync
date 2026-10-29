import type { TokenDescriptor } from './phpAstTypes';
import { createClassName } from '../../../types/upstream/names';
import { phpQualifiedClassNameFactory, type PhpClassImportBinding, type PhpClassNameResolutionContext } from '../../../types/upstream/phpClassNameResolutionInterface';

export const joinPhpNameTokens = (tokens: readonly TokenDescriptor[]): string => tokens.map(token => token.value).join('');

const importSegments = (tokens: readonly TokenDescriptor[]): readonly (readonly TokenDescriptor[])[] => {
  const segments: TokenDescriptor[][] = [];
  let current: TokenDescriptor[] = [];
  for (const token of tokens) {
    if (token.value === ',') { segments.push(current); current = []; }
    else current.push(token);
  }
  segments.push(current);
  return Object.freeze(segments.map(segment => Object.freeze(segment)));
};

const classImportBinding = (tokens: readonly TokenDescriptor[], groupPrefix: string): PhpClassImportBinding | undefined => {
  if (tokens.length === 0 || tokens[0]?.value === 'function' || tokens[0]?.value === 'const') return undefined;
  const aliasIndex = tokens.findIndex(candidate => candidate.value.toLowerCase() === 'as');
  const targetTokens = aliasIndex < 0 ? tokens : tokens.slice(0, aliasIndex);
  const targetSuffix = joinPhpNameTokens(targetTokens).replace(/^\\+|\\+$/g, '');
  const target = [groupPrefix.replace(/^\\+|\\+$/g, ''), targetSuffix].filter(Boolean).join('\\');
  const alias = aliasIndex < 0 ? target.split('\\').at(-1) ?? '' : tokens[aliasIndex + 1]?.value ?? '';
  if (target.length === 0 || alias.length === 0 || (aliasIndex >= 0 && aliasIndex + 2 !== tokens.length)) return undefined;
  return Object.freeze({ kind: 'php_class_import_binding', alias: createClassName(alias), target: phpQualifiedClassNameFactory.create(target) });
};

const parseClassImportStatement = (statement: readonly TokenDescriptor[]): Readonly<{ readonly bindings: readonly PhpClassImportBinding[]; readonly complete: boolean }> => {
  if (statement.length === 0) return Object.freeze({ bindings: Object.freeze([]), complete: false });
  if (statement[0]?.value === 'function' || statement[0]?.value === 'const') return Object.freeze({ bindings: Object.freeze([]), complete: true });
  const openGroup = statement.findIndex(candidate => candidate.value === '{');
  if (openGroup >= 0) {
    const closeGroup = statement.findIndex((candidate, index) => index > openGroup && candidate.value === '}');
    if (closeGroup !== statement.length - 1) return Object.freeze({ bindings: Object.freeze([]), complete: false });
    const prefix = joinPhpNameTokens(statement.slice(0, openGroup)).replace(/^\\+|\\+$/g, '');
    if (prefix.length === 0 || !joinPhpNameTokens(statement.slice(0, openGroup)).endsWith('\\')) return Object.freeze({ bindings: Object.freeze([]), complete: false });
    const bindings: PhpClassImportBinding[] = [];
    for (const member of importSegments(statement.slice(openGroup + 1, closeGroup))) {
      const binding = classImportBinding(member, prefix);
      if (binding !== undefined) { bindings.push(binding); continue; }
      if (member.length > 0 && (member[0]?.value === 'function' || member[0]?.value === 'const')) continue;
      return Object.freeze({ bindings: Object.freeze(bindings), complete: false });
    }
    return Object.freeze({ bindings: Object.freeze(bindings), complete: true });
  }
  const bindings: PhpClassImportBinding[] = [];
  for (const segment of importSegments(statement)) {
    const binding = classImportBinding(segment, '');
    if (binding === undefined) return Object.freeze({ bindings: Object.freeze(bindings), complete: false });
    bindings.push(binding);
  }
  return Object.freeze({ bindings: Object.freeze(bindings), complete: true });
};

/** Builds the one lexical class-name context used by controller and DTO parsers. */
export const phpClassNameResolutionContextAt = (tokens: readonly TokenDescriptor[], boundaryIndex: number): PhpClassNameResolutionContext => {
  const activeNamespaceIndex = tokens.slice(0, boundaryIndex).findLastIndex(token => token.type === 'IDENTIFIER' && token.value === 'namespace');
  const namespaceTerminator = activeNamespaceIndex < 0 ? -1 : tokens.findIndex((token, index) => index > activeNamespaceIndex && index < boundaryIndex && (token.value === ';' || token.value === '{'));
  const namespaceName = activeNamespaceIndex < 0 || namespaceTerminator < 0 ? '' : joinPhpNameTokens(tokens.slice(activeNamespaceIndex + 1, namespaceTerminator)).replace(/^\\+|\\+$/g, '');
  const importStart = namespaceTerminator < 0 ? 0 : namespaceTerminator + 1;
  const imports: PhpClassImportBinding[] = [];
  let importsComplete = true;
  const prefix = tokens.slice(importStart, boundaryIndex);
  for (let index = 0; index < prefix.length; index += 1) {
    const token = prefix[index];
    if (token?.type !== 'IDENTIFIER' || token.value !== 'use') continue;
    const statementEndRelative = prefix.findIndex((candidate, offset) => offset > index && candidate.value === ';');
    if (statementEndRelative < 0) { importsComplete = false; break; }
    const statement = prefix.slice(index + 1, statementEndRelative);
    index = statementEndRelative;
    const parsed = parseClassImportStatement(statement);
    imports.push(...parsed.bindings);
    importsComplete = importsComplete && parsed.complete;
  }
  return Object.freeze({ kind: 'php_class_name_resolution_context', namespaceName: phpQualifiedClassNameFactory.create(namespaceName), classImports: Object.freeze(imports), importInventory: importsComplete ? 'complete' : 'incomplete' });
};
