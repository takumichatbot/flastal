# server/config.py
import os # osをインポート

# 環境変数からSECRET_KEYを読み込む。なければデフォルト値を使う。
SECRET_KEY = os.environ.get("SECRET_KEY", "your-super-secret-key-for-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30