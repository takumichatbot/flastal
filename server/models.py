from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func # createdAtのためにインポート
from database import Base

class GroupChatMessage(Base):
    __tablename__ = "group_chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=True) # 自由記述メッセージ
    templateId = Column(Integer, nullable=True) # テンプレートID
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    project = relationship("Project", back_populates="group_chat_messages")
    user = relationship("User", back_populates="group_chat_messages")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    organizer = Column(String) # handleNameを保存
    description = Column(Text, nullable=True)
    targetAmount = Column(Integer, default=0)
    collectedAmount = Column(Integer, default=0)
    deliveryAddress = Column(String, nullable=True)
    deliveryDateTime = Column(DateTime, nullable=True)
    imageUrl = Column(String, nullable=True)
    status = Column(String, default="FUNDRAISING")
    designDetails = Column(Text, nullable=True)
    visibility = Column(String, default="PUBLIC")
    size = Column(String, nullable=True)
    flowerTypes = Column(String, nullable=True)
    completionImageUrls = Column(JSON, nullable=True)
    completionComment = Column(Text, nullable=True)
    # "users.id" は、usersテーブルのidカラムを指す、という意味
    planner_id = Column(Integer, ForeignKey("users.id"))
    # --- リレーションシップ定義 ---
    planner = relationship("User", back_populates="created_projects")
    pledges = relationship("Pledge", back_populates="project", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="project", uselist=False, cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="project", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="project", cascade="all, delete-orphan")
    group_chat_messages = relationship("GroupChatMessage", back_populates="project", cascade="all, delete-orphan")
    activePoll = relationship("Poll", uselist=False, back_populates="project")
    quotation = relationship("Quotation", uselist=False, back_populates="project")
    
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    handleName = Column(String, index=True)
    points = Column(Integer, default=0)
    referralCode = Column(String, unique=True, index=True)
    pledges = relationship("Pledge", back_populates="user")
    created_projects = relationship("Project", back_populates="planner")
    messages = relationship("Message", back_populates="user")
    group_chat_messages = relationship("GroupChatMessage", back_populates="user")

class Pledge(Base):
    __tablename__ = "pledges"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    user = relationship("User", back_populates="pledges")
    project = relationship("Project", back_populates="pledges")
    comment = Column(String, nullable=True) # 応援コメント用

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # ↓↓↓ 以下を追加 ↓↓↓
    florist_id = Column(Integer, ForeignKey("florists.id"))

    project = relationship("Project", back_populates="review")
    user = relationship("User")
    # ↓↓↓ 以下を追加 ↓↓↓
    florist = relationship("Florist", back_populates="reviews")
    
    
class Venue(Base):
    __tablename__ = "venues"
    id = Column(Integer, primary_key=True, index=True)
    venueName = Column(String, unique=True, index=True)
    regulations = Column(Text, nullable=True)
    
    # ↓↓↓ 以下を追加 ↓↓↓
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    address = Column(String, nullable=True) # 住所カラムも追加
    
# 寄せ書きメッセージ
class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    cardName = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    project = relationship("Project", back_populates="messages")
    user = relationship("User", back_populates="messages")

# To-Doタスク
class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    isCompleted = Column(Boolean, default=False)
    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship("Project", back_populates="tasks")
    
# 収支報告の支出項目
class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    itemName = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship("Project", back_populates="expenses")
    
# お知らせ
class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship("Project", back_populates="announcements")
    

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    reason = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    reporter_id = Column(Integer, ForeignKey("users.id"))

    project = relationship("Project")
    reporter = relationship("User")
    status = Column(String, default="PENDING") # PENDING, REVIEWED
    
class Poll(Base):
    __tablename__ = "polls"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True) # 1企画にアクティブなPollは1つ
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")
    votes = relationship("PollVote", back_populates="poll", cascade="all, delete-orphan")

class PollOption(Base):
    __tablename__ = "poll_options"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    poll_id = Column(Integer, ForeignKey("polls.id"))
    
    poll = relationship("Poll", back_populates="options")

class PollVote(Base):
    __tablename__ = "poll_votes"
    id = Column(Integer, primary_key=True, index=True)
    option_index = Column(Integer, nullable=False) # どの選択肢に投票したか
    
    poll_id = Column(Integer, ForeignKey("polls.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    poll = relationship("Poll", back_populates="votes")
    
class Florist(Base):
    __tablename__ = "florists"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    shopName = Column(String, nullable=False)      # 公開される活動名
    platformName = Column(String, nullable=True) # 運営確認用の本名
    contactName = Column(String, nullable=False)
    address = Column(String, nullable=True)
    phoneNumber = Column(String, nullable=True)
    website = Column(String, nullable=True)
    portfolio = Column(Text, nullable=True)
    status = Column(String, default="PENDING")     # PENDING, APPROVED, REJECTED
    balance = Column(Integer, default=0)           # 売上残高
    laruBotApiKey = Column(String, nullable=True)
    reviews = relationship("Review", back_populates="florist")

class Offer(Base):
    __tablename__ = "offers"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="PENDING") # PENDING, ACCEPTED, REJECTED
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    florist_id = Column(Integer, ForeignKey("florists.id"))

    project = relationship("Project")
    florist = relationship("Florist")
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=True)
    chat_room = relationship("ChatRoom")

class Payout(Base):
    __tablename__ = "payouts"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    accountInfo = Column(Text, nullable=False)
    status = Column(String, default="PENDING") # PENDING, COMPLETED
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

    florist_id = Column(Integer, ForeignKey("florists.id"))
    
class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    id = Column(Integer, primary_key=True, index=True)
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    florist_id = Column(Integer, ForeignKey("florists.id"))
    
    project = relationship("Project")
    florist = relationship("Florist")
    messages = relationship("ChatMessage", back_populates="chat_room", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    sender_type = Column(String) # 'USER' or 'FLORIST'
    sender_id = Column(Integer)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"))
    chat_room = relationship("ChatRoom", back_populates="messages")
    
class Quotation(Base):
    __tablename__ = "quotations"
    id = Column(Integer, primary_key=True, index=True)
    totalAmount = Column(Integer, nullable=False)
    isApproved = Column(Boolean, default=False)

    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    florist_id = Column(Integer, ForeignKey("florists.id"))

    project = relationship("Project", back_populates="quotation")
    florist = relationship("Florist")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")

class QuotationItem(Base):
    __tablename__ = "quotation_items"
    id = Column(Integer, primary_key=True, index=True)
    itemName = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))

    quotation = relationship("Quotation", back_populates="items")
    
class Commission(Base):
    __tablename__ = "commissions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    
    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Project")