/**
 * @fileoverview Compiler Verification Module
 * 
 * This module provides verification passes to check compiler invariants:
 * - CFG structural correctness
 * - SSA form properties
 * - Domination properties
 * - Alias analysis
 * - Effect analysis
 * 
 * @module compiler/verification
 */

// Verification infrastructure
export { Verifier } from './Verifier';
export { VerifierManager } from './VerifierManager';
export { VerifierPhase } from './VerificationContext';
export type { VerificationContext } from './VerificationContext';

// Concrete verifiers
export { CFGVerifier } from './CFGVerifier';
export { SSAVerifier } from './SSAVerifier';

// Analysis components
export { AliasAnalysis } from './AliasAnalysis';
export { DefaultEffectAnalysis } from './EffectAnalysis';
export type { EffectAnalysis } from './EffectAnalysis';
