/**
 * cacheLoader.ts
 *
 * Loads previous manifest and IR cache from disk for incremental analysis.
 *
 * @module cli/utils/incremental
 */

import fs from 'fs-extra';
import path from 'path';
import type { SemanticIRNode } from '@routesync/core';
import type { ScannedManifest } from './incrementalTypes';

export interface PreviousIncrementalState {
  readonly prevManifest: ScannedManifest | null;
  readonly prevIRNodes: Record<string, SemanticIRNode>;
}

export function loadPreviousIncrementalState(prevManifestPath: string): PreviousIncrementalState {
  let prevManifest: ScannedManifest | null = null;
  if (fs.existsSync(prevManifestPath)) {
    try {
      prevManifest = fs.readJsonSync(prevManifestPath);
    } catch {
      // ignore JSON parsing errors
    }
  }

  let prevIRNodes: Record<string, SemanticIRNode> = {};
  const prevIRPath = path.resolve(path.dirname(prevManifestPath), 'routesync.ir.json');
  if (fs.existsSync(prevIRPath)) {
    try {
      const prevIR = fs.readJsonSync(prevIRPath);
      prevIRNodes = prevIR?.nodes || {};
    } catch {
      // ignore JSON parsing errors
    }
  }

  return { prevManifest, prevIRNodes };
}
