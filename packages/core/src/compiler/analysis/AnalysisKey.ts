/**
 * @fileoverview Analysis key constants and registry
 * @module compiler/analysis/AnalysisKey
 */

import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominatorTree } from './DominatorAnalysis';
import type { LoopAnalysis } from './LoopAnalysis';
import type { SSARepresentation } from './SSAAnalysis';
import type { UseDefGraph } from './UseDefAnalysis';

/**
 * Type-safe key for analysis results
 * 
 * @template T Type of the analysis result
 */
import { AnalysisKey } from '../passes';
/**
 * Standard analysis keys
 * 
 * These keys are used to request and cache analysis results
 * in the analysis manager.
 */

/**
 * Control flow graph analysis key
 */
export const CFGAnalysis = new AnalysisKey<ControlFlowGraph>('CFG');

/**
 * Dominator tree analysis key
 */
export const DominatorsAnalysis = new AnalysisKey<DominatorTree>('Dominators');

/**
 * Loop information analysis key
 */
export const LoopInfoAnalysis = new AnalysisKey<LoopAnalysis>('LoopInfo');

/**
 * SSA form analysis key
 */
export const SSAAnalysis = new AnalysisKey<SSARepresentation>('SSA');

/**
 * Use-definition chain analysis key
 */
export const UseDefAnalysis = new AnalysisKey<UseDefGraph>('UseDef');
