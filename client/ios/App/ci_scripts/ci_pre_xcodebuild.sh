#!/bin/sh

set -e

echo "=== ci_pre_xcodebuild: Verifying node_modules ==="

NODE_MODULES_PATH="$CI_PRIMARY_REPOSITORY_PATH/client/node_modules"

if [ ! -d "$NODE_MODULES_PATH" ]; then
    echo "ERROR: node_modules not found at $NODE_MODULES_PATH"
    echo "This should have been created by ci_post_clone.sh"
    exit 1
fi

echo "node_modules OK: $NODE_MODULES_PATH"
echo "=== Verification complete ==="
