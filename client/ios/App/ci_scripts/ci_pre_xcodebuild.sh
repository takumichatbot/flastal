#!/bin/sh

set -e

echo "=== ci_pre_xcodebuild: Installing Node.js dependencies ==="

# Xcode Cloud には Homebrew 経由で Node を使う
export HOMEBREW_NO_AUTO_UPDATE=1
brew install node || true

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

# client ディレクトリで npm ci を実行
cd "$CI_PRIMARY_REPOSITORY_PATH/client"
npm ci

echo "=== npm ci complete ==="
