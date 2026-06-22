#!/bin/bash
# Firebase FCM セットアップスクリプト
# 使い方: bash scripts/setup-fcm.sh /path/to/google-services.json

set -e

SRC="$1"
DEST="client/android/app/google-services.json"

if [ -z "$SRC" ]; then
  echo "使い方: bash scripts/setup-fcm.sh /path/to/google-services.json"
  echo ""
  echo "google-services.json の取得手順:"
  echo "1. https://console.firebase.google.com/ にアクセス"
  echo "2. 新しいプロジェクトを作成（例: flastal-prod）"
  echo "3. 「Android アプリを追加」→ パッケージ名: com.flastal.app"
  echo "4. google-services.json をダウンロード"
  echo "5. このスクリプトを実行: bash scripts/setup-fcm.sh ~/Downloads/google-services.json"
  exit 1
fi

if [ ! -f "$SRC" ]; then
  echo "エラー: ファイルが見つかりません: $SRC"
  exit 1
fi

cp "$SRC" "$DEST"
echo "✅ $DEST にコピーしました"

# Capacitor sync
cd client
npx cap sync android
echo "✅ Capacitor Android sync 完了"
echo ""
echo "次のステップ:"
echo "  Android Studio でビルド: npx cap open android"
echo "  または: npm run cap:android"
