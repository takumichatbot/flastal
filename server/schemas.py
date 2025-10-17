from __future__ import annotations
from pydantic import BaseModel, model_validator
from datetime import datetime

# ===============================================
# ベースとなるスキーマ (他のスキーマが使用)
# ===============================================

class UserNested(BaseModel):
    id: int
    handleName: str
    class Config:
        from_attributes = True

class ProjectNested(BaseModel):
    id: int
    title: str
    class Config:
        from_attributes = True

# ===============================================
# User (ファン) 関連スキーマ
# ===============================================

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

# ===============================================
# Project (企画) 関連スキーマ
# ===============================================


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

# ★★★ ここにPledgeスキーマを移動し、正しく定義 ★★★
class Pledge(BaseModel):
    id: int
    comment: str | None = None
    amount: int
    user: UserNested
    user_id: int
    # project: ProjectNested # ← ★★★ この行をコメントアウト、または削除 ★★★
    class Config:
        from_attributes = True

# ★★★ 他の関連スキーマもここにまとめる ★★★
class Message(BaseModel):
    id: int
    content: str
    cardName: str
    user: UserNested
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
        
class PollOption(BaseModel):
    text: str
    class Config:
        from_attributes = True

class PollVote(BaseModel):
    user_id: int
    option_index: int
    class Config:
        from_attributes = True

class Poll(BaseModel):
    id: int
    question: str
    options: list[PollOption]  # ★★★ ここを list[str] から変更 ★★★
    votes: list[PollVote] = []
    class Config:
        from_attributes = True
        
        
class Review(BaseModel):
    id: int
    rating: int
    comment: str | None = None
    user_id: int
    class Config:
        from_attributes = True

# ★★★ メインのProjectスキーマ (全ての部品が定義された後に記述) ★★★
class Project(BaseModel):
    id: int
    title: str
    organizer: str
    description: str | None = None
    targetAmount: int
    collectedAmount: int
    deliveryAddress: str | None = None
    deliveryDateTime: datetime | None = None
    imageUrl: str | None = None
    status: str
    planner: UserNested | None = None
    pledges: list[Pledge] = []
    messages: list[Message] = []
    tasks: list[Task] = []
    expenses: list[Expense] = []
    announcements: list[Announcement] = []
    review: Review | None = None
    activePoll: Poll | None = None
    group_chat_messages: list[GroupChatMessage] = []
    class Config:
        from_attributes = True

# ===============================================
# Venue (会場) & Florist (花屋) 関連スキーマ
# ===============================================

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
    reviewCount: int = 0
    averageRating: float = 0.0
    class Config:
        from_attributes = True

class TokenDataFlorist(BaseModel):
    access_token: str
    token_type: str
    florist: FloristPublic
    
# ===============================================
# Offer, Quotation, Payout 関連スキーマ
# ===============================================

class Offer(BaseModel):
    id: int
    status: str
    project: ProjectNested 
    florist: FloristPublic
    class Config:
        from_attributes = True

class QuotationItemBase(BaseModel):
    itemName: str
    amount: int

class QuotationItem(QuotationItemBase):
    id: int
    class Config:
        from_attributes = True

class Quotation(BaseModel):
    id: int
    totalAmount: int
    isApproved: bool
    items: list[QuotationItem]
    class Config:
        from_attributes = True

class Payout(BaseModel):
    id: int
    amount: int
    status: str
    createdAt: datetime
    class Config:
        from_attributes = True

# ===============================================
# APIリクエスト/レスポンス用スキーマ
# ===============================================

class EmailSchema(BaseModel):
    email: str
    
class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str
    
class CheckoutRequest(BaseModel):
    points: int
    amount: int

class ReviewCreate(BaseModel):
    project_id: int
    rating: int
    comment: str | None = None
    
class PledgeCreate(BaseModel):
    projectId: int
    amount: int
    comment: str | None = None

class MessageCreate(BaseModel):
    content: str
    cardName: str
    projectId: int

class TaskCreate(BaseModel):
    title: str
    projectId: int

class TaskUpdate(BaseModel):
    isCompleted: bool

class ExpenseCreate(BaseModel):
    itemName: str
    amount: int
    projectId: int
    
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    projectId: int
    
class ProjectComplete(BaseModel):
    completionImageUrls: list[str]
    completionComment: str | None = None
    
class ReportCreate(BaseModel):
    projectId: int
    reason: str
    details: str | None = None

class PollCreate(BaseModel):
    projectId: int
    question: str
    options: list[str]

class PollVoteCreate(BaseModel):
    pollId: int
    optionIndex: int

class OfferCreate(BaseModel):
    projectId: int
    floristId: int

class OfferStatusUpdate(BaseModel):
    status: str

class QuotationCreate(BaseModel):
    projectId: int
    items: list[QuotationItemBase]

class PayoutCreate(BaseModel):
    amount: int
    accountInfo: str

class ChatTemplate(BaseModel):
    id: int
    text: str
    category: str
    hasCustomInput: bool
    placeholder: str | None = None
    class Config:
        from_attributes = True

# ===============================================
# チャット & 管理者用スキーマ
# ===============================================

class GroupChatMessage(BaseModel):
    id: int
    content: str | None = None
    templateId: int | None = None
    createdAt: datetime
    user: UserNested
    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    id: int
    content: str
    sender_type: str
    sender_id: int
    createdAt: datetime
    class Config:
        from_attributes = True

class GroupChatMessageForAdmin(GroupChatMessage):
    user: UserNested

class ChatMessageForAdmin(ChatMessage):
    user: UserNested | None = None
    florist: FloristPublic | None = None

class ChatsForModeration(BaseModel):
    groupChat: list[GroupChatMessageForAdmin]
    floristChat: list[ChatMessageForAdmin]

class FloristStatusUpdate(BaseModel):
    status: str

class ProjectVisibilityUpdate(BaseModel):
    isVisible: bool