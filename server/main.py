# ===============================================
# Imports
# ===============================================
import os
import json
import secrets
import string
import socketio
import cloudinary
import cloudinary.uploader
import resend
import stripe

from fastapi import FastAPI, Depends, Response, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func

from database import SessionLocal, engine
from config import SECRET_KEY, ALGORITHM
import models, schemas, security

# ===============================================
# 初期設定 (Initial Setup)
# ===============================================

# Cloudinary設定
cloudinary.config(
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
  api_key = os.environ.get('CLOUDINARY_API_KEY'),
  api_secret = os.environ.get('CLOUDINARY_API_SECRET')
)

# データベーステーブル作成
models.Base.metadata.create_all(bind=engine)

# 1. Socket.IOサーバーと、FastAPIアプリ本体を別々の変数名で作成
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")
fastapi_app = FastAPI() # FastAPI本体の名前を `fastapi_app` に変更

# CORS許可オリジン
origins = [
    "http://localhost:3000",
    "https://flastal-frontend.onrender.com",
]

# 2. CORSミドルウェアを、ラップする「前」のfastapi_appに追加
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. 必要な設定がすべて完了したfastapi_appを、Socket.IOでラップする
#    最終的なアプリケーションの名前は「app」にする
app = socketio.ASGIApp(sio, fastapi_app)


# 外部サービスAPIキー設定
resend.api_key = os.environ.get("RESEND_API_KEY")
stripe.api_key = os.environ.get("STRIPE_API_KEY")

# 認証設定
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")
ADMIN_PASSWORD_HASH = security.get_password_hash(os.environ.get("ADMIN_PASSWORD", "supersecretpassword"))

# ===============================================
# データベースと認証のヘルパー関数
# ===============================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or payload.get("scope") != "user":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_venue(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate venue credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or payload.get("scope") != "venue":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    venue = db.query(models.Venue).filter(models.Venue.email == email).first()
    if venue is None:
        raise credentials_exception
    return venue

def get_current_florist(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate florist credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None or payload.get("scope") != "florist":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    florist = db.query(models.Florist).filter(models.Florist.email == email).first()
    if florist is None:
        raise credentials_exception
    return florist

def get_current_admin_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=403, detail="Forbidden")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "admin":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return {"role": "admin"}
    
def get_user_from_token(token: str, db: Session):
    try:
        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]
        else:
            return None, None
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        scope: str = payload.get("scope")
        if email is None or scope is None: return None, None
        if scope == 'user':
            user = db.query(models.User).filter(models.User.email == email).first()
            return user, 'USER'
        elif scope == 'florist':
            user = db.query(models.Florist).filter(models.Florist.email == email).first()
            return user, 'FLORIST'
    except (JWTError, IndexError):
        return None, None
    return None, None

# ===============================================
# ファン (User) API
# ===============================================

@fastapi_app.post("/api/users/register", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_by_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="このメールアドレスは既に使用されています")
    db_user_by_handle = db.query(models.User).filter(models.User.handleName == user.handleName).first()
    if db_user_by_handle:
        raise HTTPException(status_code=400, detail="このハンドルネームは既に使用されています")
    hashed_password = security.get_password_hash(user.password)
    while True:
        referral_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        if not db.query(models.User).filter(models.User.referralCode == referral_code).first():
            break
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        handleName=user.handleName,
        referralCode=referral_code
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@fastapi_app.post("/api/token", description="ファンユーザーのログイン")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # ★★★ 修正後: scopeに"user"を明記する ★★★
    access_token = security.create_access_token(data={"sub": user.email, "scope": "user"})
    
    return {"access_token": access_token, "token_type": "bearer"}

@fastapi_app.get("/api/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@fastapi_app.post("/api/forgot-password")
def forgot_password(request: schemas.EmailSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        return {"message": "Password reset email sent"}
    reset_token = security.create_access_token(
        data={"sub": user.email, "scope": "password_reset"},
        expires_delta_minutes=60
    )
    reset_link = f"https://flastal-frontend.onrender.com/reset-password/{reset_token}"
    try:
        params = {
            "from": "FLASTAL <noreply@flastal.com>",
            "to": [user.email],
            "subject": "FLASTAL パスワード再設定のご案内",
            "html": f"<p>パスワードを再設定するには、以下のリンクをクリックしてください:</p><p><a href='{reset_link}'>パスワードを再設定する</a></p><p>このリンクは1時間有効です。</p>",
        }
        resend.Emails.send(params)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Email could not be sent")
    return {"message": "Password reset email sent"}

@fastapi_app.post("/api/reset-password")
def reset_password(request: schemas.ResetPasswordSchema, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "password_reset":
            raise credentials_exception
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    user.hashed_password = security.get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password has been reset successfully"}

@fastapi_app.get("/api/users/me/created-projects", response_model=list[schemas.Project])
def get_my_created_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Project).filter(models.Project.planner_id == current_user.id).all()

@fastapi_app.get("/api/users/me/pledged-projects", response_model=list[schemas.Pledge])
def get_my_pledged_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Pledge).options(
        joinedload(models.Pledge.project)
    ).filter(models.Pledge.user_id == current_user.id).all()

# ===============================================
# 企画 (Project) API
# ===============================================

@fastapi_app.get("/api/projects", response_model=list[schemas.Project])
def get_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).filter(models.Project.visibility == "PUBLIC").order_by(models.Project.id.desc()).all()

@fastapi_app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_project = models.Project(
        **project.dict(),
        organizer=current_user.handleName,
        planner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@fastapi_app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).options(
        joinedload(models.Project.planner),
        joinedload(models.Project.pledges).joinedload(models.Pledge.user),
        joinedload(models.Project.messages).joinedload(models.Message.user),
        joinedload(models.Project.tasks),
        joinedload(models.Project.expenses),
        joinedload(models.Project.announcements),
        joinedload(models.Project.review),
        joinedload(models.Project.activePoll).joinedload(models.Poll.options),
        joinedload(models.Project.activePoll).joinedload(models.Poll.votes),
    ).filter(models.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@fastapi_app.patch("/api/projects/{project_id}/complete", response_model=schemas.Project)
def complete_project(project_id: int, completion_data: schemas.ProjectComplete, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    if project.status != 'SUCCESSFUL':
        raise HTTPException(status_code=400, detail="Project cannot be completed in its current state.")
    project.completionImageUrls = completion_data.completionImageUrls
    project.completionComment = completion_data.completionComment
    project.status = 'COMPLETED'
    db.commit()
    return project

@fastapi_app.patch("/api/projects/{project_id}/cancel", response_model=schemas.Project)
def cancel_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).options(
        joinedload(models.Project.pledges).joinedload(models.Pledge.user)
    ).filter(models.Project.id == project_id).first()
    if not project or project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    if project.status in ['COMPLETED', 'CANCELED']:
        raise HTTPException(status_code=400, detail="Project has already been closed.")
    for pledge in project.pledges:
        pledge.user.points += pledge.amount
    project.status = 'CANCELED'
    db.commit()
    return project

@fastapi_app.get("/api/projects/featured", response_model=list[schemas.Project])
def get_featured_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).filter(
        models.Project.targetAmount > 0, models.Project.visibility == "PUBLIC"
    ).order_by(
        (models.Project.collectedAmount / models.Project.targetAmount).desc()
    ).limit(4).all()

# ===============================================
# 支援 (Pledge) & レビュー (Review) API
# ===============================================

@fastapi_app.post("/api/pledges", response_model=schemas.Pledge)
def create_pledge(pledge_data: schemas.PledgeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == pledge_data.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.points < pledge_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient points")
    current_user.points -= pledge_data.amount
    project.collectedAmount += pledge_data.amount
    if project.status == 'FUNDRAISING' and project.collectedAmount >= project.targetAmount:
        project.status = 'SUCCESSFUL'
    new_pledge = models.Pledge(
        amount=pledge_data.amount,
        comment=pledge_data.comment,
        project_id=pledge_data.projectId,
        user_id=current_user.id
    )
    db.add(new_pledge)
    db.commit()
    db.refresh(new_pledge)
    return new_pledge

@fastapi_app.get("/api/reviews/featured", response_model=list[schemas.Review])
def get_featured_reviews(db: Session = Depends(get_db)):
    return db.query(models.Review).options(
        joinedload(models.Review.user),
        joinedload(models.Review.project)
    ).order_by(models.Review.id.desc()).limit(3).all()

@fastapi_app.post("/api/reviews", response_model=schemas.Review)
def create_review(review_data: schemas.ReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_review = db.query(models.Review).filter(models.Review.project_id == review_data.project_id).first()
    if db_review:
        raise HTTPException(status_code=400, detail="This project has already been reviewed")
    new_review = models.Review(
        **review_data.dict(),
        user_id=current_user.id
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

# ===============================================
# その他の企画関連API
# ===============================================

@fastapi_app.post("/api/messages", response_model=schemas.Message)
def create_message(message_data: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == message_data.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    pledge = db.query(models.Pledge).filter(
        models.Pledge.project_id == message_data.projectId,
        models.Pledge.user_id == current_user.id
    ).first()
    if not pledge:
        raise HTTPException(status_code=403, detail="Only pledgers can post messages.")
    existing_message = db.query(models.Message).filter(
        models.Message.project_id == message_data.projectId,
        models.Message.user_id == current_user.id
    ).first()
    if existing_message:
        raise HTTPException(status_code=400, detail="You have already posted a message for this project.")
    new_message = models.Message(
        content=message_data.content,
        cardName=message_data.cardName,
        project_id=message_data.projectId,
        user_id=current_user.id
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message, attribute_names=['user'])
    return new_message

@fastapi_app.post("/api/tasks", response_model=schemas.Task)
def create_task(task_data: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == task_data.projectId).first()
    if not project or project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    new_task = models.Task(title=task_data.title, project_id=task_data.projectId)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@fastapi_app.patch("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_data: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).options(joinedload(models.Task.project)).filter(models.Task.id == task_id).first()
    if not task or task.project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    task.isCompleted = task_data.isCompleted
    db.commit()
    db.refresh(task)
    return task

@fastapi_app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).options(joinedload(models.Task.project)).filter(models.Task.id == task_id).first()
    if not task or task.project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@fastapi_app.post("/api/expenses", response_model=schemas.Expense)
def create_expense(expense_data: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == expense_data.projectId).first()
    if not project or project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    new_expense = models.Expense(**expense_data.dict(), project_id=expense_data.projectId)
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@fastapi_app.get("/api/chat-templates", response_model=list[schemas.ChatTemplate])
def get_chat_templates():
    # 本来はデータベースから取得しますが、今回は固定で返します
    templates = [
        {"id": 1, "text": "参加しました！よろしくお願いします！", "category": "挨拶", "hasCustomInput": False, "placeholder": None},
        {"id": 2, "text": "デザイン案について相談したいです。", "category": "相談", "hasCustomInput": False, "placeholder": None},
        {"id": 3, "text": "金額について質問です！", "category": "質問", "hasCustomInput": False, "placeholder": None},
        {"id": 4, "text": "...", "category": "自由入力", "hasCustomInput": True, "placeholder": "具体的な内容を入力"},
    ]
    return templates

@fastapi_app.delete("/api/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    expense = db.query(models.Expense).options(joinedload(models.Expense.project)).filter(models.Expense.id == expense_id).first()
    if not expense or expense.project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@fastapi_app.post("/api/announcements", response_model=schemas.Announcement)
def create_announcement(announcement_data: schemas.AnnouncementCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == announcement_data.projectId).first()
    if not project or project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    new_announcement = models.Announcement(**announcement_data.dict(), project_id=announcement_data.projectId)
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement

# ===============================================
# 会場 (Venue) API
# ===============================================

@fastapi_app.post("/api/venues/register", response_model=schemas.VenuePublic)
def register_venue(venue_data: schemas.VenueCreate, db: Session = Depends(get_db)):
    if db.query(models.Venue).filter(models.Venue.email == venue_data.email).first():
        raise HTTPException(status_code=400, detail="このメールアドレスは既に使用されています")
    hashed_password = security.get_password_hash(venue_data.password)
    new_venue = models.Venue(
        venueName=venue_data.venueName,
        email=venue_data.email,
        hashed_password=hashed_password
    )
    db.add(new_venue)
    db.commit()
    db.refresh(new_venue)
    return new_venue

@fastapi_app.post("/api/venues/login", response_model=schemas.TokenDataVenue)
def login_venue(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.email == form_data.username).first()
    if not venue or not security.verify_password(form_data.password, venue.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = security.create_access_token(data={"sub": venue.email, "scope": "venue"})
    return {"access_token": access_token, "token_type": "bearer", "venue": venue}

@fastapi_app.get("/api/venues", response_model=list[schemas.VenuePublic])
def get_venues(db: Session = Depends(get_db)):
    return db.query(models.Venue).all()

@fastapi_app.get("/api/venues/{venue_id}", response_model=schemas.VenuePublic)
def get_venue_details(venue_id: int, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@fastapi_app.patch("/api/venues/{venue_id}", response_model=schemas.VenuePublic)
def update_venue_details(venue_id: int, venue_data: schemas.VenueUpdate, db: Session = Depends(get_db), current_venue: models.Venue = Depends(get_current_venue)):
    if current_venue.id != venue_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this venue")
    for key, value in venue_data.dict(exclude_unset=True).items():
        setattr(current_venue, key, value)
    db.commit()
    db.refresh(current_venue)
    return current_venue

# ===============================================
# お花屋さん (Florist) API
# ===============================================

@fastapi_app.post("/api/florists/register")
def register_florist(florist_data: schemas.FloristCreate, db: Session = Depends(get_db)):
    if db.query(models.Florist).filter(models.Florist.email == florist_data.email).first():
        raise HTTPException(status_code=400, detail="このメールアドレスは既に使用されています")
    hashed_password = security.get_password_hash(florist_data.password)
    new_florist = models.Florist(
        shopName=florist_data.shopName,
        platformName=florist_data.platformName,
        contactName=florist_data.contactName,
        email=florist_data.email,
        hashed_password=hashed_password,
        status="PENDING"
    )
    db.add(new_florist)
    db.commit()
    return {"message": "登録申請を受け付けました。運営による承認をお待ちください。"}

@fastapi_app.post("/api/florists/login", response_model=schemas.TokenDataFlorist)
def login_florist(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    florist = db.query(models.Florist).filter(models.Florist.email == form_data.username).first()
    if not florist or not security.verify_password(form_data.password, florist.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = security.create_access_token(data={"sub": florist.email, "scope": "florist"})
    return {"access_token": access_token, "token_type": "bearer", "florist": florist}

@fastapi_app.get("/api/florists", response_model=list[schemas.FloristPublic])
def get_all_florists(db: Session = Depends(get_db)):
    florists = db.query(models.Florist).filter(models.Florist.status == "APPROVED").all()
    results = []
    for florist in florists:
        review_stats = db.query(
            func.count(models.Review.id).label("count"),
            func.avg(models.Review.rating).label("avg")
        ).filter(models.Review.florist_id == florist.id).one()
        florist.reviewCount = review_stats.count
        florist.averageRating = float(review_stats.avg) if review_stats.avg else 0.0
        results.append(florist)
    return results

@fastapi_app.get("/api/florists/{florist_id}", response_model=schemas.FloristPublic)
def get_florist_details(florist_id: int, db: Session = Depends(get_db)):
    florist = db.query(models.Florist).filter(models.Florist.id == florist_id, models.Florist.status == "APPROVED").first()
    if not florist:
        raise HTTPException(status_code=404, detail="Florist not found or not approved")
    review_stats = db.query(
        func.count(models.Review.id).label("count"),
        func.avg(models.Review.rating).label("avg")
    ).filter(models.Review.florist_id == florist_id).one()
    florist.reviewCount = review_stats.count
    florist.averageRating = float(review_stats.avg) if review_stats.avg else 0.0
    return florist

@fastapi_app.get("/api/florists/dashboard")
def get_florist_dashboard_data(db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    offers = db.query(models.Offer).options(
        joinedload(models.Offer.project).joinedload(models.Project.planner)
    ).filter(models.Offer.florist_id == current_florist.id).all()
    return {
        "florist": { "balance": current_florist.balance },
        "offers": offers
    }

@fastapi_app.patch("/api/florists/{florist_id}", response_model=schemas.FloristPublic)
def update_florist_profile(florist_id: int, florist_data: schemas.FloristUpdate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    if current_florist.id != florist_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    for key, value in florist_data.dict(exclude_unset=True).items():
        setattr(current_florist, key, value)
    db.commit()
    db.refresh(current_florist)
    return current_florist

# ===============================================
# オファー、見積もり、支払い API
# ===============================================

@fastapi_app.post("/api/offers", response_model=schemas.Offer)
def create_offer(offer_data: schemas.OfferCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == offer_data.projectId).first()
    florist = db.query(models.Florist).filter(models.Florist.id == offer_data.floristId, models.Florist.status == "APPROVED").first()
    if not project or not florist:
        raise HTTPException(status_code=404, detail="Project or Florist not found")
    if project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project planner can make offers.")
    existing_offer = db.query(models.Offer).filter(models.Offer.project_id == project.id, models.Offer.florist_id == florist.id).first()
    if existing_offer:
        raise HTTPException(status_code=400, detail="Offer has already been sent.")
    new_offer = models.Offer(project_id=project.id, florist_id=florist.id)
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    return new_offer

@fastapi_app.patch("/api/offers/{offer_id}", response_model=schemas.Offer)
def update_offer_status(offer_id: int, status_data: schemas.OfferStatusUpdate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if not offer or offer.florist_id != current_florist.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this offer.")
    offer.status = status_data.status
    if offer.status == 'ACCEPTED' and not offer.chat_room_id:
        new_chat_room = models.ChatRoom(
            project_id=offer.project_id,
            florist_id=offer.florist_id
        )
        db.add(new_chat_room)
        db.flush()
        offer.chat_room_id = new_chat_room.id
    db.commit()
    db.refresh(offer)
    return offer

@fastapi_app.get("/api/chat-rooms/{chat_room_id}")
def get_chat_room_details(chat_room_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)): # 実際はuser or florist
    chat_room = db.query(models.ChatRoom).options(
        joinedload(models.ChatRoom.project).joinedload(models.Project.planner),
        joinedload(models.ChatRoom.project).joinedload(models.Project.quotation).joinedload(models.Quotation.items),
        joinedload(models.ChatRoom.florist),
        joinedload(models.ChatRoom.messages)
    ).filter(models.ChatRoom.id == chat_room_id).first()
    if not chat_room: # 権限チェックは簡略化
        raise HTTPException(status_code=404, detail="Chat room not found")
    return chat_room

@fastapi_app.post("/api/quotations", response_model=schemas.Quotation)
def create_quotation(quotation_data: schemas.QuotationCreate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    total_amount = sum(item.amount for item in quotation_data.items)
    new_quotation = models.Quotation(
        project_id=quotation_data.projectId,
        florist_id=current_florist.id,
        totalAmount=total_amount
    )
    db.add(new_quotation)
    db.flush()
    for item_data in quotation_data.items:
        db.add(models.QuotationItem(**item_data.dict(), quotation_id=new_quotation.id))
    db.commit()
    db.refresh(new_quotation)
    return new_quotation

@fastapi_app.patch("/api/quotations/{quotation_id}/approve")
def approve_quotation(quotation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quotation = db.query(models.Quotation).options(joinedload(models.Quotation.project), joinedload(models.Quotation.florist)).filter(models.Quotation.id == quotation_id).first()
    if not quotation or quotation.project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    if quotation.project.collectedAmount < quotation.totalAmount:
        raise HTTPException(status_code=400, detail="プロジェクトの支援総額が見積額に達していません。")
    quotation.project.collectedAmount -= quotation.totalAmount
    commission_rate = 0.10
    commission_amount = int(quotation.totalAmount * commission_rate)
    florist_payout = quotation.totalAmount - commission_amount
    quotation.florist.balance += florist_payout
    new_commission = models.Commission(
        amount=commission_amount,
        project_id=quotation.project.id
    )
    db.add(new_commission)
    quotation.isApproved = True
    db.commit()
    return {"message": "Quotation approved and payment completed."}

@fastapi_app.get("/api/florists/{florist_id}/payouts", response_model=list[schemas.Payout])
def get_payout_history(florist_id: int, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    if current_florist.id != florist_id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    return db.query(models.Payout).filter(models.Payout.florist_id == current_florist.id).order_by(models.Payout.createdAt.desc()).all()

@fastapi_app.post("/api/payouts", response_model=schemas.Payout)
def request_payout(payout_data: schemas.PayoutCreate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    MINIMUM_PAYOUT_AMOUNT = 1000
    if payout_data.amount < MINIMUM_PAYOUT_AMOUNT:
        raise HTTPException(status_code=400, detail=f"Minimum payout amount is {MINIMUM_PAYOUT_AMOUNT} pt.")
    if current_florist.balance < payout_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance.")
    current_florist.balance -= payout_data.amount
    new_payout = models.Payout(
        amount=payout_data.amount,
        accountInfo=payout_data.accountInfo,
        florist_id=current_florist.id,
        status="PENDING"
    )
    db.add(new_payout)
    db.commit()
    db.refresh(new_payout)
    return new_payout

# ===============================================
# Stripe & Upload API
# ===============================================

@fastapi_app.post("/api/checkout/create-session")
def create_checkout_session(request: schemas.CheckoutRequest, current_user: models.User = Depends(get_current_user)):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': { 'currency': 'jpy', 'product_data': {'name': f"{request.points} ポイント購入"}, 'unit_amount': request.amount },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"https://{os.environ.get('FRONTEND_URL', 'flastal-frontend.onrender.com')}/payment/success",
            cancel_url=f"https://{os.environ.get('FRONTEND_URL', 'flastal-frontend.onrender.com')}/points",
            client_reference_id=str(current_user.id),
            metadata={'points': str(request.points)}
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@fastapi_app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        points_purchased = int(session.get('metadata', {}).get('points', 0))
        if user_id and points_purchased > 0:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()
            if user:
                user.points += points_purchased
                db.commit()
    return {"status": "success"}

@fastapi_app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        result = cloudinary.uploader.upload(file.file)
        return {"url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
# ===============================================
# アンケート (Poll) API
# ===============================================

@fastapi_app.post("/api/group-chat/polls", response_model=schemas.Poll)
def create_poll(poll_data: schemas.PollCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == poll_data.projectId).first()
    if not project or project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create a poll for this project.")
    
    # 既存のアクティブなアンケートがあれば無効化する
    db.query(models.Poll).filter(models.Poll.project_id == poll_data.projectId, models.Poll.isActive == True).update({"isActive": False})

    new_poll = models.Poll(
        question=poll_data.question,
        project_id=poll_data.projectId,
        creator_id=current_user.id
    )
    db.add(new_poll)
    db.flush() # new_poll.id を確定させる

    # 選択肢を作成
    for option_text in poll_data.options:
        db.add(models.PollOption(text=option_text, poll_id=new_poll.id))
    
    db.commit()
    db.refresh(new_poll)
    
    # WebSocketで企画参加者全員にアンケートが作成されたことを通知する（将来的な拡張）
    
    return new_poll

@fastapi_app.post("/api/group-chat/polls/vote", response_model=schemas.PollVote)
def vote_on_poll(vote_data: schemas.PollVoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.id == vote_data.pollId).first()
    if not poll or not poll.isActive:
        raise HTTPException(status_code=400, detail="This poll is not active.")
    
    # 支援者のみ投票可能
    pledge = db.query(models.Pledge).filter(models.Pledge.project_id == poll.project_id, models.Pledge.user_id == current_user.id).first()
    is_planner = poll.project.planner_id == current_user.id
    if not pledge and not is_planner:
        raise HTTPException(status_code=403, detail="Only pledgers or the planner can vote.")

    # 既に投票済みかチェック
    existing_vote = db.query(models.PollVote).filter(models.PollVote.poll_id == vote_data.pollId, models.PollVote.user_id == current_user.id).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted.")

    new_vote = models.PollVote(
        poll_id=vote_data.pollId,
        user_id=current_user.id,
        option_index=vote_data.optionIndex
    )
    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)
    
    # WebSocketで企画参加者全員に投票があったことを通知する（将来的な拡張）

    return new_vote

# ===============================================
# 管理者 (Admin) API
# ===============================================

class AdminLoginRequest(BaseModel):
    password: str

@fastapi_app.post("/api/admin/login")
def admin_login(form_data: AdminLoginRequest):
    if not security.verify_password(form_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Authentication failed")
    access_token = security.create_access_token(data={"sub": "admin", "scope": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}

@fastapi_app.get("/api/admin/commissions")
def get_commissions(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Commission).options(joinedload(models.Commission.project)).all()

@fastapi_app.get("/api/admin/florists/pending")
def get_pending_florists(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Florist).filter(models.Florist.status == "PENDING").all()

@fastapi_app.patch("/api/admin/florists/{florist_id}/status")
def update_florist_status(florist_id: int, status_data: schemas.FloristStatusUpdate, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    florist = db.query(models.Florist).filter(models.Florist.id == florist_id).first()
    if not florist: raise HTTPException(404, "Florist not found")
    florist.status = status_data.status
    db.commit()
    return {"message": "Status updated"}

@fastapi_app.get("/api/admin/payouts")
def get_pending_payouts(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Payout).options(joinedload(models.Payout.florist)).filter(models.Payout.status == "PENDING").all()

@fastapi_app.patch("/api/admin/payouts/{payout_id}/complete")
def complete_payout(payout_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id).first()
    if not payout: raise HTTPException(404, "Payout not found")
    payout.status = "COMPLETED"
    db.commit()
    return {"message": "Payout marked as completed"}

@fastapi_app.get("/api/admin/reports")
def get_pending_reports(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Report).options(joinedload(models.Report.project), joinedload(models.Report.reporter)).filter(models.Report.status == "PENDING").all()

@fastapi_app.patch("/api/admin/reports/{report_id}/review")
def review_report(report_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report: raise HTTPException(404, "Report not found")
    report.status = "REVIEWED"
    db.commit()
    return {"message": "Report marked as reviewed"}

@fastapi_app.patch("/api/admin/projects/{project_id}/visibility")
def toggle_project_visibility(project_id: int, visibility_data: schemas.ProjectVisibilityUpdate, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project: raise HTTPException(404, "Project not found")
    project.visibility = "PRIVATE" if not visibility_data.isVisible else "PUBLIC"
    db.commit()
    return {"message": "Visibility updated"}

@fastapi_app.get("/api/admin/projects", response_model=list[schemas.Project])
def get_all_projects_for_admin(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Project).options(joinedload(models.Project.planner)).order_by(models.Project.id.desc()).all()

@fastapi_app.get("/api/admin/projects/{project_id}/chats", response_model=schemas.ChatsForModeration)
def get_project_chats_for_admin(project_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    group_chat = db.query(models.GroupChatMessage).options(joinedload(models.GroupChatMessage.user)).filter(models.GroupChatMessage.project_id == project_id).all()
    chat_room = db.query(models.ChatRoom).filter(models.ChatRoom.project_id == project_id).first()
    florist_chat = []
    if chat_room:
        florist_chat = db.query(models.ChatMessage).options(
            joinedload(models.ChatMessage.user), joinedload(models.ChatMessage.florist)
        ).filter(models.ChatMessage.chat_room_id == chat_room.id).all()
    return {"groupChat": group_chat, "floristChat": florist_chat}

@fastapi_app.delete("/api/admin/group-chat/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_chat_message(message_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    message = db.query(models.GroupChatMessage).filter(models.GroupChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@fastapi_app.delete("/api/admin/florist-chat/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_florist_chat_message(message_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    message = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# ===============================================
# Socket.IO イベントハンドラ
# ===============================================

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@sio.event
async def connect(sid, environ, auth): # ★★★ auth引数を追加
    print(f"Socket.IO client connected: {sid}")

    # auth引数から直接トークンを取得する方が確実
    token = auth.get('token') if auth else None

    if not token:
        print(f"Connection rejected for {sid}: No token provided.")
        raise socketio.exceptions.ConnectionRefusedError('authentication failed')

    db = next(get_db_session())
    user, user_type = get_user_from_token(token, db)
    db.close()

    if not user:
        print(f"Connection rejected for {sid}: Invalid token.")
        raise socketio.exceptions.ConnectionRefusedError('authentication failed')
    
    await sio.save_session(sid, {'user_id': user.id, 'user_type': user_type})
    print(f"Client {sid} authenticated as {user_type} {user.id}")

@sio.event
async def disconnect(sid):
    print(f"Socket.IO client disconnected: {sid}")

@sio.event
async def joinProjectRoom(sid, projectId):
    sio.enter_room(sid, f"project_{projectId}")

@sio.on('sendGroupChatMessage')
async def handle_group_chat_message(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    db = next(get_db_session())
    try:
        project_id = data.get('projectId')
        if not project_id or not user_id:
            await sio.emit('messageError', 'Missing data', to=sid)
            return
        
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        pledge = db.query(models.Pledge).filter(models.Pledge.project_id == project_id, models.Pledge.user_id == user_id).first()
        is_planner = project.planner_id == user_id
        if not project or (not pledge and not is_planner):
             await sio.emit('messageError', 'Not authorized', to=sid)
             return

        new_message = models.GroupChatMessage(**data, user_id=user_id)
        db.add(new_message)
        db.commit()
        db.refresh(new_message, attribute_names=['user'])
        
        message_for_client = schemas.GroupChatMessageForAdmin.from_orm(new_message).dict()
        await sio.emit('receiveGroupChatMessage', message_for_client, room=f"project_{project_id}")
    finally:
        db.close()

@sio.event
async def joinPrivateChatRoom(sid, chatRoomId):
    sio.enter_room(sid, f"chat_{chatRoomId}")

@sio.on('sendChatMessage')
async def handle_chat_message(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    user_type = session.get('user_type')
    db = next(get_db_session())
    try:
        new_message = models.ChatMessage(
            chat_room_id=data['chatRoomId'],
            content=data['content'],
            sender_id=user_id,
            sender_type=user_type
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        # メッセージ送信者情報を付加してクライアントに返す
        db.refresh(new_message, attribute_names=['user', 'florist'])
        message_for_client = schemas.ChatMessageForAdmin.from_orm(new_message).dict()
        await sio.emit('receiveChatMessage', message_for_client, room=f"chat_{data['chatRoomId']}")
    finally:
        db.close()
