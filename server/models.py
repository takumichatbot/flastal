from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text # Text, DateTimeを追加
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # funcを追加
from database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    organizer = Column(String)
    
    # --- ここから下を追記・修正 ---
    description = Column(Text, nullable=True) # 詳細説明
    targetAmount = Column(Integer, default=0) # 目標金額
    collectedAmount = Column(Integer, default=0) # 支援総額
    deliveryAddress = Column(String, nullable=True) # お届け先
    deliveryDateTime = Column(DateTime(timezone=True), nullable=True) # お届け日時
    imageUrl = Column(String, nullable=True) # 画像URL
    status = Column(String, default="FUNDRAISING") # 企画ステータス
    # --- 追記ここまで ---
    
    pledges = relationship("Pledge", back_populates="project")
    review = relationship("Review", back_populates="project", uselist=False)
    
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    handleName = Column(String, index=True)
    points = Column(Integer, default=0)
    referralCode = Column(String, unique=True, index=True)

    # --- この行を追記 ---
    # このユーザーが行った支援のリスト
    pledges = relationship("Pledge", back_populates="user")

# --- ここから下を追記 ---

class Pledge(Base):
    __tablename__ = "pledges"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False) # 支援額

    # 外部キー制約
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))

    # リレーションシップ（関連）
    user = relationship("User", back_populates="pledges")
    project = relationship("Project", back_populates="pledges")
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False) # 5段階評価など
    comment = Column(String, nullable=True) # コメント

    # どの企画に対するレビューか
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True) # 1企画に1レビュー
    # 誰からのレビューか
    user_id = Column(Integer, ForeignKey("users.id"))

    # 関連
    project = relationship("Project", back_populates="review")
    user = relationship("User")