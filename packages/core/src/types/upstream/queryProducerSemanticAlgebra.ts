/**
 * Compatibility entry point for the existing QueryProducerSemanticInterface.
 * Semantic interpretation lives in queryProducerSemanticReasoning.ts; this
 * module preserves established imports while keeping the algebra name out of
 * the reasoning implementation.
 */
export { queryProducerSemanticReasoning as queryProducerSemanticAlgebra } from './queryProducerSemanticReasoning';
