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
    organizer: str
    description: str | None = None
    targetAmount: int
    collectedAmount: int
    deliveryAddress: str | None = None
    deliveryDateTime: datetime | None = None
    imageUrl: str | None = None
    status: str
    review: Review | None = None
    
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