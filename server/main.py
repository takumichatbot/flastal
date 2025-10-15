from fastapi import FastAPI, Depends, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
import json
import secrets
import string
import os # osをインポート
import resend

import models, schemas, security
from database import SessionLocal, engine
from config import SECRET_KEY, ALGORITHM

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://flastal-frontend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Resendクライアントを初期化
resend.api_key = os.environ.get("RESEND_API_KEY")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/api/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# === ユーザー認証 API ===

@app.post("/api/forgot-password")
def forgot_password(request: schemas.EmailSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # ユーザーが存在しない場合でも、セキュリティのため成功したように見せかける
        return {"message": "Password reset email sent"}

    # パスワードリセット用の特別なトークンを生成（有効期限1時間）
    reset_token = security.create_access_token(
        data={"sub": user.email, "scope": "password_reset"},
        expires_delta_minutes=60
    )
    
    # フロントエンドのパスワードリセットページのURL
    reset_link = f"https://flastal-frontend.onrender.com/reset-password/{reset_token}"
    
    try:
        params = {
            # "onboarding@resend.dev" から、あなたのドメインのアドレスに変更
            "from": "FLASTAL <noreply@flastal.com>", 
            "to": [user.email],
            "subject": "FLASTAL パスワード再設定のご案内",
            "html": f"<p>パスワードを再設定するには、以下のリンクをクリックしてください:</p><p><a href='{reset_link}'>パスワードを再設定する</a></p><p>このリンクは1時間有効です。</p>",
        }
        email = resend.Emails.send(params)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Email could not be sent")

    return {"message": "Password reset email sent"}

@app.post("/api/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/users/register", response_model=schemas.User)
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
        db_code = db.query(models.User).filter(models.User.referralCode == referral_code).first()
        if not db_code:
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

# === 企画 API ===

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.get("/api/users/me/created-projects", response_model=list[schemas.Project])
def get_my_created_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.organizer == current_user.handleName).all()
    return projects
    
@app.get("/api/users/me/pledged-projects", response_model=list[schemas.Pledge])
def get_my_pledged_projects(current_user: models.User = Depends(get_current_user)):
    return current_user.pledges

@app.post("/api/projects", status_code=201)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    new_project = models.Project(title=project.title, organizer=project.organizer)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/api/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(models.Project).all()
    projects_dict = [{"id": p.id, "title": p.title, "organizer": p.organizer} for p in projects]
    return Response(content=json.dumps(projects_dict, ensure_ascii=False), media_type="application/json; charset=utf-8")

@app.put("/api/projects/{project_id}")
def update_project(project_id: int, project_data: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db_project.title = project_data.title
    db_project.organizer = project_data.organizer
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project_to_delete = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project_to_delete is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project_to_delete)
    db.commit()
    return {"message": "Project deleted successfully"}
    
# === レビュー API ===
@app.post("/api/reviews", response_model=schemas.Review)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_review = db.query(models.Review).filter(models.Review.project_id == review.project_id).first()
    if db_review:
        raise HTTPException(status_code=400, detail="This project has already been reviewed")

    new_review = models.Review(
        **review.dict(), 
        user_id=current_user.id
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review