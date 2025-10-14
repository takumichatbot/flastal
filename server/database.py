
# server/database.py
import os # osをインポート
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 環境変数からDATABASE_URLを読み込む。なければローカルのURLを使う。
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:mysecretpassword@localhost/flastal_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()