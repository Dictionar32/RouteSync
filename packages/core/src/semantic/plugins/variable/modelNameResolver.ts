/**
 * modelNameResolver.ts
 *
 * Resolves variable names to models using exact matching, capitalization,
 * and singularization heuristics (plural -> singular, compound suffix).
 *
 * @module semantic/plugins/variable
 */

import type { SemanticResolution } from '../../../types/contract';
import type { ResolutionContext } from '../../types';

export function resolveModelByName(
  name: string,
  symbolTable: ResolutionContext['symbolTable']
): SemanticResolution | null {
  // Exact match
  const exactMatch = symbolTable.getCaseInsensitive(name);
  if (exactMatch) {
    return {
      status: 'resolved',
      type: 'model',
      model: exactMatch.name,
      confidence: 80,
      trace: [{
        source: 'VariableResolver',
        rule: 'Variable name exact match to manifest model',
        input: name,
        output: `model: ${exactMatch.name}`
      }]
    };
  }

  // Capitalized match
  const capName = name.charAt(0).toUpperCase() + name.slice(1);
  const capMatch = symbolTable.get(capName);
  if (capMatch) {
    return {
      status: 'resolved',
      type: 'model',
      model: capName,
      confidence: 70,
      trace: [{
        source: 'VariableResolver',
        rule: 'Variable name capitalized match to manifest model',
        input: name,
        output: `model: ${capName}`
      }]
    };
  }

  // Heuristics for plural variable names (e.g. categories -> Category, products -> Product)
  let singularName = '';
  if (name.endsWith('ies')) {
    singularName = name.slice(0, -3) + 'y';
  } else if (name.endsWith('s')) {
    singularName = name.slice(0, -1);
  }

  if (singularName) {
    const singularExactMatch = symbolTable.getCaseInsensitive(singularName);
    if (singularExactMatch) {
      return {
        status: 'resolved',
        type: 'model',
        model: singularExactMatch.name,
        collection: true,
        confidence: 80,
        trace: [{
          source: 'VariableResolver',
          rule: 'Variable name singularized exact match to manifest model',
          input: name,
          output: `model: ${singularExactMatch.name} (collection)`
        }]
      };
    }

    const singularCapName = singularName.charAt(0).toUpperCase() + singularName.slice(1);
    const singularCapMatch = symbolTable.get(singularCapName);
    if (singularCapMatch) {
      return {
        status: 'resolved',
        type: 'model',
        model: singularCapName,
        collection: true,
        confidence: 70,
        trace: [{
          source: 'VariableResolver',
          rule: 'Variable name singularized capitalized match to manifest model',
          input: name,
          output: `model: ${singularCapName} (collection)`
        }]
      };
    }

    // Compound-name fallback: $reviews → singular 'Review' → find any model ending with 'Review'
    const suffixUpper = singularCapName;
    const suffixMatch = symbolTable.findFirst(
      (entry: { name: string }) => entry.name.endsWith(suffixUpper)
    );
    if (suffixMatch) {
      return {
        status: 'resolved',
        type: 'model',
        model: suffixMatch.name,
        collection: true,
        confidence: 60,
        trace: [{
          source: 'VariableResolver',
          rule: 'Variable name compound-suffix match to manifest model',
          input: name,
          output: `model: ${suffixMatch.name} (collection, suffix=${suffixUpper})`
        }]
      };
    }
  }

  return null;
}
