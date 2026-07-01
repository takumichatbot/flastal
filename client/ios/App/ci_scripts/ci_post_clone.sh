#!/bin/sh

set -e
set -x  # コマンドを全てログに出力

echo "=== ci_post_clone: Installing Capacitor SPM dependencies ==="
echo "CI_PRIMARY_REPOSITORY_PATH: ${CI_PRIMARY_REPOSITORY_PATH}"
echo "uname: $(uname -m)"

# PATH を直接設定（Apple Silicon + Intel 両対応）
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:$PATH"

# Node.js の確認・インストール
if command -v node > /dev/null 2>&1; then
    echo "Node.js found: $(node --version)"
else
    echo "Node.js not found. Installing via Homebrew..."
    HOMEBREW_NO_AUTO_UPDATE=1 brew install node || true
fi

# インストール後も見つからなければ終了
if ! command -v node > /dev/null 2>&1; then
    echo "ERROR: node is not available. Cannot continue."
    exit 1
fi

node --version
npm --version

# client ディレクトリで依存関係インストール
CLIENT_DIR="${CI_PRIMARY_REPOSITORY_PATH}/client"
echo "Entering: ${CLIENT_DIR}"
cd "${CLIENT_DIR}"

# package.json と package-lock.json の存在確認
test -f package.json     && echo "package.json: OK" || { echo "ERROR: package.json not found"; exit 1; }
test -f package-lock.json && echo "package-lock.json: OK" || { echo "WARNING: package-lock.json not found"; }

# npm ci を実行（post-install スクリプトをスキップして安定性向上）
# @next/swc などのネイティブバイナリビルドがXcode Cloud環境で失敗するのを回避
npm ci --ignore-scripts --no-audit

# Capacitor パッケージが存在するか確認
echo "Verifying Capacitor packages..."
ls node_modules/@capacitor/app/package.json
ls node_modules/@capacitor-community/apple-sign-in/package.json

echo "=== node_modules installed. SPM local paths are now resolvable. ==="
