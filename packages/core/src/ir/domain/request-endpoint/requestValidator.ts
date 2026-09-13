/**
 * requestValidator.ts
 *
 * Request ID generator and ContractIR diagnostic validator.
 *
 * @module core/ir/domain/request-endpoint
 */

import { createHash } from 'crypto';
import type { ContractIR, ParsedRequest } from '../../../types/ir';
import type { DiagnosticCollector } from '../irTypes';

export function generateRequestId(request: ParsedRequest): string {
  return createHash('md5')
    .update(`request:${request.name}:${request.controller || 'unknown'}`)
    .digest('hex')
    .substring(0, 8);
}

export function validateContractIR(ir: ContractIR, diagnostics: DiagnosticCollector): void {
  diagnostics.info('Validating Contract IR integrity');

  for (const endpoint of ir.endpoints) {
    if (endpoint.response.resource) {
      const resourceExists = ir.resources.some(r => r.name === endpoint.response.resource);
      if (!resourceExists) {
        diagnostics.warn(`Endpoint ${endpoint.id} references unknown resource: ${endpoint.response.resource}`);
      }
    }
  }

  for (const endpoint of ir.endpoints) {
    if (endpoint.request?.reference) {
      const requestExists = ir.requests.some(r => r.name === endpoint.request!.reference);
      if (!requestExists) {
        diagnostics.warn(`Endpoint ${endpoint.id} references unknown request: ${endpoint.request.reference}`);
      }
    }
  }

  diagnostics.info('IR validation complete');
}
