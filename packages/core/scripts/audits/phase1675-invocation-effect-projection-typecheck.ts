import type {
  InvocationExceptionEmissionFlow,
  InvocationResultEmissionFlow,
  SemanticCallEmissionFlow,
} from '../../src/types/upstream/invocationSemanticJudgmentInterface';

declare const resultFlow: InvocationResultEmissionFlow;
declare const exceptionFlow: InvocationExceptionEmissionFlow;

const acceptedResult: InvocationResultEmissionFlow = resultFlow;
const acceptedException: InvocationExceptionEmissionFlow = exceptionFlow;
const acceptedUnion: SemanticCallEmissionFlow = resultFlow;

// @ts-expect-error exception flows cannot be projected as result flows
const rejectedExceptionAsResult: InvocationResultEmissionFlow = exceptionFlow;
// @ts-expect-error result flows cannot be projected as exception flows
const rejectedResultAsException: InvocationExceptionEmissionFlow = resultFlow;

void acceptedResult;
void acceptedException;
void acceptedUnion;
void rejectedExceptionAsResult;
void rejectedResultAsException;
