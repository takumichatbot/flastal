from pydantic import BaseModel
from datetime import datetime # datetimeを追加

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

# --- Review Schemas ---
# Projectで参照されるため、先に定義します
class ReviewBase(BaseModel):
    rating: int
    comment: str | None = None

class ReviewCreate(ReviewBase):
    project_id: int

class Review(ReviewBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Project Schemas ---
# Pledgeで参照されるため、先に定義します
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

class ProjectUpdate(BaseModel): # ProjectUpdateも合わせて修正
    title: str
    organizer: str
    description: str | None = None
    targetAmount: int
    collectedAmount: int
    deliveryAddress: str | None = None
    deliveryDateTime: datetime | None = None
    imageUrl: str | None = None
    status: str

class Project(BaseModel): # Projectも合わせて修正
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


class Project(ProjectBase):
    id: int
    review: Review | None = None # 先に定義したReviewを参照

    class Config:
        from_attributes = True

# --- Pledge Schemas ---
class PledgeBase(BaseModel):
    amount: int

class Pledge(PledgeBase):
    id: int
    project: Project # 先に定義したProjectを参照

    class Config:
        from_attributes = True
        
class EmailSchema(BaseModel):
    email: str
    
class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str
    
# --- Checkout Schema ---
class CheckoutRequest(BaseModel):
    points: int
    amount: int
    
class Venue(BaseModel):
    id: int
    venueName: str
    regulations: str | None = None
    class Config:
        from_attributes = True