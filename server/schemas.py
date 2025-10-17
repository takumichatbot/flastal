from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime

# --- Review (先に定義) ---
class ReviewBase(BaseModel):
    rating: int
    comment: str | None = None

class Review(ReviewBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# --- Project (先に定義) ---
class ProjectBaseForPledge(BaseModel):
    id: int
    title: str
    class Config:
        from_attributes = True

# --- Pledge Schemas ---
class PledgeBase(BaseModel):
    amount: int

class Pledge(PledgeBase):
    id: int
    project: ProjectBaseForPledge
    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    handleName: str

class User(UserBase):
    id: int
    handleName: str
    points: int
    referralCode: str
    class Config:
        from_attributes = True
        
# ネストされたオブジェクト内で使用する、公開しても安全なユーザー情報
class UserNested(BaseModel):
    id: int
    handleName: str
    class Config:
        from_attributes = True

# --- Project Schemas (本体) ---
class ProjectCreate(BaseModel):
    title: str
    description: str
    targetAmount: int
    deliveryAddress: str
    deliveryDateTime: datetime
    designDetails: str | None = None
    visibility: str = "PUBLIC"
    size: str | None = None
    flowerTypes: str | None = None
    imageUrl: str | None = None

class ProjectUpdate(BaseModel):
    title: str
    organizer: str


class Project(BaseModel):
    id: int
    title: str
    organizer: str # 将来的にはplanner: UserNested にするとより良い
    description: str | None = None
    targetAmount: int
    collectedAmount: int
    deliveryAddress: str | None = None
    deliveryDateTime: datetime | None = None
    imageUrl: str | None = None
    status: str
    group_chat_messages: list[GroupChatMessage] = []
    planner: UserNested | None = None
    pledges: list[Pledge] = []
    messages: list[Message] = []
    tasks: list[Task] = []
    expenses: list[Expense] = []
    announcements: list[Announcement] = []
    review: Review | None = None
    activePoll: Poll | None = None
    
    class Config:
        from_attributes = True

# --- その他のスキーマ ---
class EmailSchema(BaseModel):
    email: str
    
class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str
    
class CheckoutRequest(BaseModel):
    points: int
    amount: int
    
class Venue(BaseModel):
    id: int
    venueName: str
    regulations: str | None = None
    class Config:
        from_attributes = True

class ReviewCreate(ReviewBase):
    project_id: int
    
# 支援を作成するためのスキーマ
class PledgeCreate(BaseModel):
    projectId: int
    amount: int
    comment: str | None = None

class Message(BaseModel):
    id: int
    content: str
    cardName: str
    user: UserNested # 誰が投稿したかを表示
    class Config:
        from_attributes = True

class Task(BaseModel):
    id: int
    title: str
    isCompleted: bool
    class Config:
        from_attributes = True

class Expense(BaseModel):
    id: int
    itemName: str
    amount: int
    class Config:
        from_attributes = True
        
class Announcement(BaseModel):
    id: int
    title: str
    content: str
    createdAt: datetime
    class Config:
        from_attributes = True

class Pledge(PledgeBase): # 既存のPledgeを拡張
    id: int
    comment: str | None = None
    user: UserNested # 誰が支援したかを表示
    # project: ProjectBaseForPledge は、Projectスキーマ内で使うと循環参照になるので削除
    class Config:
        from_attributes = True
        
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    projectId: int
    
class ExpenseCreate(BaseModel):
    itemName: str
    amount: int
    projectId: int
    
class TaskCreate(BaseModel):
    title: str
    projectId: int

class TaskUpdate(BaseModel):
    isCompleted: bool
    
class MessageCreate(BaseModel):
    content: str
    cardName: str
    projectId: int
    
# 企画完了報告用のスキーマ
class ProjectComplete(BaseModel):
    completionImageUrls: list[str]
    completionComment: str | None = None
    
class GroupChatMessage(BaseModel):
    id: int
    content: str | None = None
    templateId: int | None = None
    createdAt: datetime
    user: UserNested # 誰が投稿したか
    class Config:
        from_attributes = True
        
class ReportCreate(BaseModel):
    projectId: int
    reason: str
    details: str | None = None
    
class PollVote(BaseModel):
    userId: int
    optionIndex: int
    class Config: from_attributes = True

class PollOption(BaseModel):
    text: str
    class Config: from_attributes = True

class Poll(BaseModel):
    id: int
    question: str
    options: list[str] # テキストのリストとして返す
    votes: list[PollVote] = []
    class Config:
        from_attributes = True
        # ORMのoptionsオブジェクトをoptions: list[str]に変換する
        @classmethod
        def from_orm(cls, obj):
            data = super().from_orm(obj)
            if hasattr(data, 'options'):
                data.options = [opt.text for opt in obj.options]
            return cls(**data)
        
class PollCreate(BaseModel):
    projectId: int
    question: str
    options: list[str]

class PollVoteCreate(BaseModel):
    pollId: int
    optionIndex: int
    
class VenueCreate(BaseModel):
    venueName: str
    email: str
    password: str

class VenueUpdate(BaseModel):
    venueName: str | None = None
    address: str | None = None
    regulations: str | None = None

class VenuePublic(BaseModel):
    id: int
    venueName: str
    address: str | None = None
    regulations: str | None = None
    class Config:
        from_attributes = True

# ログイン成功時に返す情報のスキーマ
class TokenDataVenue(BaseModel):
    access_token: str
    token_type: str
    venue: VenuePublic
    
class FloristCreate(BaseModel):
    shopName: str
    platformName: str
    contactName: str
    email: str
    password: str

class FloristUpdate(BaseModel):
    shopName: str
    contactName: str
    address: str | None = None
    phoneNumber: str | None = None
    website: str | None = None
    portfolio: str | None = None
    laruBotApiKey: str | None = None

class FloristPublic(BaseModel):
    id: int
    shopName: str
    contactName: str
    
    # ↓↓↓ 以下を追加 ↓↓↓
    reviewCount: int = 0
    averageRating: float = 0.0
    
    class Config:
        from_attributes = True

class TokenDataFlorist(BaseModel):
    access_token: str
    token_type: str
    florist: FloristPublic

# オファーやダッシュボードで使うスキーマ
class OfferCreate(BaseModel):
    projectId: int
    floristId: int
    
class QuotationItemBase(BaseModel):
    itemName: str
    amount: int

class QuotationItem(QuotationItemBase):
    id: int
    class Config: from_attributes = True

class Quotation(BaseModel):
    id: int
    totalAmount: int
    isApproved: bool
    items: list[QuotationItem]
    class Config: from_attributes = True

class QuotationCreate(BaseModel):
    projectId: int
    items: list[QuotationItemBase]
    
# --- 管理者向けスキーマ ---

# グループチャットメッセージ（ユーザー情報付き）
class GroupChatMessageForAdmin(GroupChatMessage): # 既存のGroupChatMessageを継承
    user: UserNested

# プライベートチャットメッセージ（ユーザーまたはお花屋さん情報付き）
class ChatMessageForAdmin(ChatMessage): # 既存のChatMessageを継承
    # sender_typeに応じてどちらかが入る
    user: UserNested | None = None
    florist: FloristPublic | None = None

# チャット監視ページ用のレスポンススキーマ
class ChatsForModeration(BaseModel):
    groupChat: list[GroupChatMessageForAdmin]
    floristChat: list[ChatMessageForAdmin]