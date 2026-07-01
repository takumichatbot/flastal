#!/bin/sh

set -e

echo "=== ci_post_clone: Installing Capacitor dependencies ==="
echo "Repository: $CI_PRIMARY_REPOSITORY_PATH"

# Homebrew のバイナリパスを直接 PATH に追加（eval 不使用）
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:$PATH"

echo "PATH: $PATH"

# Node.js が使えるか確認
if ! command -v node > /dev/null 2>&1; then
    echo "Node.js not found in PATH. Trying brew install..."
    HOMEBREW_NO_AUTO_UPDATE=1 brew install node || true
fi

# インストール後も見つからない場合は明示的に失敗
if ! command -v node > /dev/null 2>&1; then
    echo "ERROR: node not available after install attempt. Aborting."
    exit 1
fi

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

# client/ に移動して npm ci を実行
# Package.swift の ../../../node_modules/ 参照に必要
cd "$CI_PRIMARY_REPOSITORY_PATH/client"

echo "Checking required files..."
ls -la package.json package-lock.json

echo "Running npm ci..."
npm ci

echo "=== node_modules installed. SPM local paths are now resolvable. ==="
