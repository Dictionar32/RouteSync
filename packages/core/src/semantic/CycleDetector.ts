/**
 * CycleDetector.ts
 *
 * Prevents recursive resolution cycles in semantic analysis.
 *
 * @module core/semantic
 */

export class CycleDetector {
  private visited = new Set<string>();

  enter(nodeId: string): boolean {
    if (this.visited.has(nodeId)) {
      return false; // Cycle detected
    }
    this.visited.add(nodeId);
    return true;
  }

  leave(nodeId: string): void {
    this.visited.delete(nodeId);
  }
}
