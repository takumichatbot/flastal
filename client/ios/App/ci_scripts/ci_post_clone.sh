#!/bin/sh

set -e

echo "=== ci_post_clone: Installing Node.js dependencies ==="

# Homebrew の PATH を設定（Apple Silicon / Intel 両対応）
if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
fi

# Node.js が未インストールの場合のみインストール
if ! command -v node > /dev/null 2>&1; then
    echo "Node.js not found. Installing via Homebrew..."
    HOMEBREW_NO_AUTO_UPDATE=1 brew install node
fi

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

# client/ で npm ci を実行 → node_modules を作成
# Package.swift の ../../../node_modules/ 参照先がここ
cd "$CI_PRIMARY_REPOSITORY_PATH/client"
npm ci

echo "=== npm ci complete. node_modules is ready for SPM resolution. ==="
