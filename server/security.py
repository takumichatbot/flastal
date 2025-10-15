from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# パスワードのハッシュ化に使うアルゴリズムを指定
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# パスワードを検証する関数
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# パスワードをハッシュ化する関数
def get_password_hash(password):
    return pwd_context.hash(password)

# アクセストークンを作成する関数
def create_access_token(data: dict, expires_delta_minutes: int | None = None):
    to_encode = data.copy()
    # トークンの有効期限を設定
    if expires_delta_minutes:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta_minutes)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # JWTを作成
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt