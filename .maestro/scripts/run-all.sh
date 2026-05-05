#!/bin/bash
# Run all Maestro E2E tests for Block Merge
# Usage: ./run-all.sh

set -e

FLOWS_DIR="$(dirname "$0")/../flows"

echo "=== Block Merge E2E Tests ==="
echo ""

# Run all flows
maestro test "$FLOWS_DIR" --format junit --output ".maestro/reports/results.xml"

echo ""
echo "=== All tests complete ==="
