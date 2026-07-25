#!/bin/bash
cd /home/annas-zen/Documents/RouteSync
NODE_OPTIONS='--loader tsx' npx vitest run packages/cli/src/generators/__tests__/emitters.integration.test.ts 2>&1
