from database import SessionLocal, engine
import models
import security
from datetime import datetime, timedelta

models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    # --- テストユーザーの作成 ---
    user1_password = security.get_password_hash("test1")
    user1 = models.User(
        email="user1@example.com", 
        hashed_password=user1_password,
        handleName="Takumi",
        referralCode="USER1CODE"
    )
    db.add(user1)
    db.commit()
    
    # --- テスト企画の作成 (項目を追加) ---
    project1 = models.Project(
        title="アイドルの生誕祭にお花を贈ろう！", 
        organizer="Takumi", # user1(Takumi)が企画者
        description="みんなで最高のフラスタを贈りましょう！",
        targetAmount=50000,
        collectedAmount=55000, # 目標達成
        status="SUCCESSFUL", # ★★★ステータスを「成功」に設定★★★
        deliveryAddress="〇〇劇場",
        deliveryDateTime=datetime.now() + timedelta(days=30)
    )
    db.add(project1)
    db.commit()

    print("データベースに初期データを投入しました。")
    print("---")
    print("Test User 1: user1@example.com / pass: test1")
    print("---")

finally:
    db.close()