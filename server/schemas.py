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
class ProjectBase(BaseModel):
    title: str
    organizer: str
    description: str | None = None
    targetAmount: int
    collectedAmount: int
    deliveryAddress: str | None = None
    deliveryDateTime: datetime | None = None
    imageUrl: str | None = None
    status: str

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

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