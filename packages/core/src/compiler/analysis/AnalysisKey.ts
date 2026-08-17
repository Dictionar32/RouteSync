/**
 * @file AnalysisKey.ts
 * @description Standard analysis keys backed by AnalysisRegistry.
 */
import { createAnalysisKeyFactory } from '../passes/PassResult';
import type { AnalysisRegistry } from './AnalysisRegistry';

const analysisKey = createAnalysisKeyFactory<AnalysisRegistry>();

export const CFGAnalysis = analysisKey('CFG');
export const DominatorsAnalysis = analysisKey('Dominators');
export const LoopInfoAnalysis = analysisKey('LoopInfo');
export const SSAAnalysis = analysisKey('SSA');
export const UseDefAnalysis = analysisKey('UseDef');