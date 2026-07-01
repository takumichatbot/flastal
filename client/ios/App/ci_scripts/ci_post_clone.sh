#!/bin/sh

set -e
set -x

echo "=== ci_post_clone: Installing Capacitor dependencies ==="
echo "CI_PRIMARY_REPOSITORY_PATH: ${CI_PRIMARY_REPOSITORY_PATH}"
echo "uname: $(uname -m)"

# Homebrew バイナリパスを追加（Apple Silicon + Intel 両対応）
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:$PATH"

# Node.js の確認・インストール
if command -v node > /dev/null 2>&1; then
    echo "Node.js found: $(node --version)"
else
    echo "Node.js not found. Installing via Homebrew..."
    HOMEBREW_NO_AUTO_UPDATE=1 brew install node || true
fi

if ! command -v node > /dev/null 2>&1; then
    echo "ERROR: node is not available."
    exit 1
fi

node --version
npm --version

# client/ で npm ci を実行（postinstall スクリプトも実行される）
CLIENT_DIR="${CI_PRIMARY_REPOSITORY_PATH}/client"
cd "${CLIENT_DIR}"
echo "Working dir: $(pwd)"

test -f package.json      && echo "package.json OK" || { echo "ERROR: package.json not found"; exit 1; }
test -f package-lock.json && echo "package-lock.json OK" || echo "WARNING: package-lock.json not found"

npm ci --no-audit

# @capacitor-community/apple-sign-in の Package.swift がパッチ済みか確認
echo "Verifying Package.swift patch..."
grep '"7.0.0"..<"9.0.0"' node_modules/@capacitor-community/apple-sign-in/Package.swift \
    && echo "Package.swift patch OK" \
    || { echo "ERROR: Package.swift not patched. Applying manually..."; node scripts/patch-capacitor.js; }

# Capacitor パッケージ存在確認
ls node_modules/@capacitor/app/package.json
ls node_modules/@capacitor/status-bar/package.json
ls node_modules/@capacitor-community/apple-sign-in/package.json

echo "=== node_modules ready. SPM paths are resolvable. ==="
