import type { ScannerCallableListInterface, CallableArgumentJudgment, CallableArgumentQuery, CallableCaptureJudgment, CallableCaptureQuery, CallableListJudgment, CallableListQuery, CallableParameterJudgment, CallableParameterQuery, CallableParameterTypeEvidence } from './scannerCallableListInterface';

const malformedAt = <Token>(tokens: readonly Token[], index: number, expected: string, actual: string) => ({
  kind: 'malformed' as const,
  location: tokens[index] === undefined
    ? { kind: 'end_of_source' as const }
    : { kind: 'token' as const, evidence: tokens[index] as Token },
  expected,
  actual,
});

const resolveList = <Token>(query: CallableListQuery<Token>): CallableListJudgment<Token> => {
  const partition = query.structure.partitionTopLevel({ tokens: query.tokens, separator: ',', tokenValue: query.tokenValue });
  if (partition.kind === 'malformed') {
    return { kind: 'malformed', location: partition.location, ...(partition.expected === undefined ? {} : { expected: partition.expected }), actual: partition.actual };
  }
  const rawParts = [...partition.parts];
  if (rawParts.length === 1 && rawParts[0]?.length === 0) {
    return { kind: 'resolved', evidence: Object.freeze({ purpose: query.purpose, parts: Object.freeze([]) }) };
  }
  if (rawParts[0]?.length === 0) return malformedAt(query.tokens, 0, 'non-empty list element', '<empty-element>');
  if (rawParts[rawParts.length - 1]?.length === 0) rawParts.pop(); // PHP permits a trailing comma.
  const emptyIndex = rawParts.findIndex(part => part.length === 0);
  if (emptyIndex >= 0) return malformedAt(query.tokens, 0, 'non-empty list element', '<empty-element>');
  return { kind: 'resolved', evidence: Object.freeze({ purpose: query.purpose, parts: Object.freeze(rawParts) }) };
};

const resolveCaptures = <Token>(query: CallableCaptureQuery<Token>): CallableCaptureJudgment<Token> => {
  const list = resolveList({ ...query, purpose: 'captures' });
  if (list.kind === 'malformed') return list;
  if (list.kind !== 'resolved') return { kind: 'contract_violation', reason: 'invalid_partition_evidence' };
  const evidence: { readonly token: Token; readonly byReference: boolean }[] = [];
  for (const part of list.evidence.parts) {
    const first = part[0];
    const byReference = first !== undefined && query.tokenValue(first) === '&';
    const variable = byReference ? part[1] : first;
    if (variable === undefined || query.tokenKind(variable) !== 'VARIABLE' || part.length !== (byReference ? 2 : 1)) {
      return malformedAt(part, variable === undefined ? 0 : 1, byReference ? '& VARIABLE' : 'VARIABLE', part.map(query.tokenValue).join(' '));
    }
    evidence.push(Object.freeze({ token: variable, byReference }));
  }
  return { kind: 'resolved', evidence: Object.freeze(evidence) };
};


const primitiveParameterTypes = ['string', 'int', 'float', 'bool', 'mixed', 'array'] as const;

const resolveParameterType = <Token>(
  tokens: readonly Token[],
  query: CallableParameterQuery<Token>,
): { readonly evidence: CallableParameterTypeEvidence<Token> } | { readonly malformed: ReturnType<typeof malformedAt<Token>> } => {
  if (tokens.length === 0) return { evidence: Object.freeze({ kind: 'absent' }) };
  const values = tokens.map(query.tokenValue);
  const nullable = values[0] === '?';
  const typeTokens = nullable ? tokens.slice(1) : tokens;
  if (typeTokens.length === 0) return { malformed: malformedAt(tokens, 0, 'type after nullable marker', '?') };
  const typeValues = typeTokens.map(query.tokenValue);
  const single = typeTokens.length === 1 ? typeTokens[0] : undefined;
  if (single !== undefined && query.tokenKind(single) === 'IDENTIFIER') {
    const primitive = primitiveParameterTypes.find(name => name === query.tokenValue(single));
    const inner: Exclude<CallableParameterTypeEvidence<Token>, { readonly kind: 'absent' } | { readonly kind: 'nullable' }> = primitive === undefined
      ? Object.freeze({ kind: 'named', nameTokens: Object.freeze([single]) })
      : Object.freeze({ kind: 'primitive', name: primitive });
    return { evidence: nullable ? Object.freeze({ kind: 'nullable', inner }) : inner };
  }
  // Qualified class/interface names are source evidence, not a runtime classification.
  const isNameToken = (token: Token): boolean => {
    const kind = query.tokenKind(token);
    return kind === 'IDENTIFIER' || kind === 'NAME_QUALIFIED' || kind === 'NAME_FULLY_QUALIFIED' || kind === 'NAME_RELATIVE';
  };
  let nameIndex = typeValues[0] === '\\' ? 1 : 0;
  let validQualifiedName = nameIndex < typeTokens.length && isNameToken(typeTokens[nameIndex]!);
  if (validQualifiedName) {
    nameIndex += 1;
    while (nameIndex < typeTokens.length && validQualifiedName) {
      validQualifiedName = typeValues[nameIndex] === '\\' && nameIndex + 1 < typeTokens.length && isNameToken(typeTokens[nameIndex + 1]!);
      nameIndex += 2;
    }
  }
  validQualifiedName = validQualifiedName && nameIndex >= typeTokens.length;
  if (validQualifiedName) {
    const inner = Object.freeze({ kind: 'named' as const, nameTokens: Object.freeze([...typeTokens]) });
    return { evidence: nullable ? Object.freeze({ kind: 'nullable', inner }) : inner };
  }
  return { malformed: malformedAt(tokens, 0, 'supported parameter type (primitive, named, or nullable)', values.join(' ')) };
};

const resolveParameters = <Token>(query: CallableParameterQuery<Token>): CallableParameterJudgment<Token> => {
  const list = resolveList({ ...query, purpose: 'parameters' });
  if (list.kind === 'malformed') return list;
  if (list.kind !== 'resolved') return { kind: 'contract_violation', reason: 'invalid_partition_evidence' };
  const evidence = [];
  for (const part of list.evidence.parts) {
    const variableIndexes = part.map((token, index) => query.tokenKind(token) === 'VARIABLE' ? index : -1).filter(index => index >= 0);
    if (variableIndexes.length !== 1) return malformedAt(part, variableIndexes[1] ?? 0, 'exactly one parameter variable', part.map(query.tokenValue).join(' '));
    const variableIndex = variableIndexes[0];
    if (variableIndex === undefined) return { kind: 'contract_violation', reason: 'invalid_partition_evidence' };
    const variable = part[variableIndex];
    if (variable === undefined) return { kind: 'contract_violation', reason: 'invalid_partition_evidence' };
    const before = part.slice(0, variableIndex);
    const after = part.slice(variableIndex + 1);
    const byReference = before.some(token => query.tokenValue(token) === '&');
    const variadic = before.some(token => query.tokenValue(token) === '...');
    const typeTokens = before.filter(token => query.tokenValue(token) !== '&' && query.tokenValue(token) !== '...');
    const typeResolution = resolveParameterType(typeTokens, query);
    if ('malformed' in typeResolution) return typeResolution.malformed;
    const equalsIndex = after.findIndex(token => query.tokenValue(token) === '=');
    if (after.length > 0 && equalsIndex < 0) return malformedAt(after, 0, 'default-value separator =', after.map(query.tokenValue).join(' '));
    const defaultTokens = equalsIndex < 0 ? undefined : after.slice(equalsIndex + 1);
    if (defaultTokens !== undefined && defaultTokens.length === 0) return malformedAt(after, equalsIndex, 'non-empty default value', '<empty-default>');
    if (typeTokens.some(token => query.tokenKind(token) === 'VARIABLE')) return malformedAt(typeTokens, 0, 'type evidence before parameter variable', typeTokens.map(query.tokenValue).join(' '));
    evidence.push(Object.freeze({ typeTokens: Object.freeze(typeTokens), typeEvidence: typeResolution.evidence, variable, defaultTokens: defaultTokens === undefined ? undefined : Object.freeze(defaultTokens), byReference, variadic }));
  }
  return { kind: 'resolved', evidence: Object.freeze(evidence) };
};

const resolveArgument = <Token>(query: CallableArgumentQuery<Token>): CallableArgumentJudgment<Token> => {
  const tokens = query.tokens;
  if (tokens.length === 0) return malformedAt(tokens, 0, 'non-empty argument', '<empty-argument>');
  if (query.tokenValue(tokens[0]!) === '...') {
    const valueTokens = tokens.slice(1);
    return valueTokens.length === 0 ? malformedAt(tokens, 0, 'expression after ...', '<empty-unpack>') : { kind: 'resolved', evidence: Object.freeze({ kind: 'unpacked', valueTokens: Object.freeze(valueTokens) }) };
  }
  const colon = tokens.findIndex(token => query.tokenValue(token) === ':');
  if (colon > 0 && query.tokenKind(tokens[0]!) === 'IDENTIFIER') {
    if (colon !== 1 || colon === tokens.length - 1) return malformedAt(tokens, colon, 'name: expression', tokens.map(query.tokenValue).join(' '));
    return { kind: 'resolved', evidence: Object.freeze({ kind: 'named', name: tokens[0]!, valueTokens: Object.freeze(tokens.slice(colon + 1)) }) };
  }
  return { kind: 'resolved', evidence: Object.freeze({ kind: 'positional', valueTokens: Object.freeze([...tokens]) }) };
};

export const scannerCallableListAlgebra: ScannerCallableListInterface = Object.freeze({ resolveList, resolveCaptures, resolveParameters, resolveArgument });
export { scannerCallableListAlgebra as scannerCallableListContractAlgebra };
