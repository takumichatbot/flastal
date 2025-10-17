import os
import sys
from logging.config import fileConfig

# --- .envファイルを読み込む設定 ---
from dotenv import load_dotenv
load_dotenv()
# ---------------------------------

from sqlalchemy import engine_from_config
from sqlalchemy import pool

# ▼▼▼ おそらくこの行が抜けているか、場所が違う ▼▼▼
from alembic import context
# ▲▲▲ ここにこの行を追加・確認してく

# ==================================================================
# ▼▼▼ ここからが修正箇所です ▼▼▼
# ==================================================================

# --- 1. あなたのプロジェクト構造に合わせて、モデルファイルがあるディレクトリへのパスを追加 ---
# このスクリプト(env.py)の親ディレクトリ(alembic/)の、さらに親(flastal/)にある
# 'server'というディレクトリをPythonがファイルを探す場所のリストに追加します。
# あなたのフォルダ名が 'server' でない場合は、実際のフォルダ名に書き換えてください。
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..', 'server')))

# --- 2. あなたのモデル定義をインポートします ---
# これで、server/models.py から Base を見つけられるようになります。
from models import Base

# ==================================================================
# ▲▲▲ ここまでが修正箇所です ▲▲▲
# ==================================================================


# これはAlembicの設定オブジェクトで、.iniファイルの値にアクセスします
config = context.config

# Renderの環境変数からデータベースURLを読み込むように設定します
# この行を追加することで、alembic.iniの %(DATABASE_URL)s が正しく解釈されます
config.set_main_option('sqlalchemy.url', os.environ.get('DATABASE_URL'))

# Pythonのロギング用に設定ファイルを解釈します
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# あなたのモデルのMetaDataオブジェクトをここに設定します
# これにより、Alembicはあなたのテーブル定義を認識できます
target_metadata = Base.metadata

# その他のAlembic設定（通常は変更不要です）

def run_migrations_offline() -> None:
    """オフラインモードでマイグレーションを実行します。"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """オンラインモードでマイグレーションを実行します。"""
    connectable = engine_from_config(
        # ▼▼▼ ここの行を修正します ▼▼▼
        config.get_section(config.config_ini_section, {}), # <- 'config_main_section' から変更
        # ▲▲▲ ここの行を修正します ▲▲▲
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()