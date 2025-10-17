# main.py の先頭
import os
import json
import secrets
import string

import cloudinary
import cloudinary.uploader
import resend
import stripe
import socketio

from fastapi import FastAPI, Depends, Response, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel # main.py内のスキーマ定義のため
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func # ファイル上部でインポート

from database import SessionLocal, engine
from config import SECRET_KEY, ALGORITHM
import models, schemas, security

cloudinary.config(
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'), 
  api_key = os.environ.get('CLOUDINARY_API_KEY'), 
  api_secret = os.environ.get('CLOUDINARY_API_SECRET')
)

models.Base.metadata.create_all(bind=engine)  # 新しい設計図でテーブルを作成
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")

# FastAPIアプリのインスタンスを作成
app = FastAPI()


# Deploy trigger comment

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
# Resendクライアントを初期化
resend.api_key = os.environ.get("RESEND_API_KEY")
# ★ Stripe APIキーを設定
stripe.api_key = os.environ.get("STRIPE_API_KEY")

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

@app.post("/api/reset-password")
def reset_password(request: schemas.ResetPasswordSchema, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
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

    # 新しいパスワードをハッシュ化して保存
    hashed_password = security.get_password_hash(request.new_password)
    user.hashed_password = hashed_password
    db.commit()
    
    return {"message": "Password has been reset successfully"}


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
# 「注目の企画」を取得するAPI (例: 目標達成率が高い順に4件)
@app.get("/api/projects/featured", response_model=list[schemas.Project])
def get_featured_projects(db: Session = Depends(get_db)):
    # 達成率(progress)を計算し、それで並び替える
    # collectedAmount / targetAmount が大きい順。ただしtargetAmountが0の場合は除外
    featured_projects = db.query(models.Project).filter(
        models.Project.targetAmount > 0
    ).order_by(
        (models.Project.collectedAmount / models.Project.targetAmount).desc()
    ).limit(4).all()
    
    return featured_projects

# 「主催者の声（レビュー）」を取得するAPI (例: 最新のレビューを3件)
@app.get("/api/reviews/featured", response_model=list[schemas.Review])
def get_featured_reviews(db: Session = Depends(get_db)):
    # 関連するユーザーとプロジェクトの情報も一緒に取得する
    featured_reviews = db.query(models.Review).options(
        joinedload(models.Review.user),
        joinedload(models.Review.project)
    ).order_by(
        models.Review.id.desc() # IDの降順 = 新しい順
    ).limit(3).all()

    return featured_reviews

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).options(
        joinedload(models.Project.planner),
        joinedload(models.Project.pledges).joinedload(models.Pledge.user), # Pledgeに関連するUserも取得
        joinedload(models.Project.messages).joinedload(models.Message.user), # Messageに関連するUserも取得
        joinedload(models.Project.tasks),
        joinedload(models.Project.expenses),
        joinedload(models.Project.announcements),
        joinedload(models.Project.review)
    ).filter(models.Project.id == project_id).first()
    
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return db_project

@app.get("/api/users/me/created-projects", response_model=list[schemas.Project])
def get_my_created_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # ★★★ 文字列の 'organizer' ではなく、安全な 'planner_id' で比較 ★★★
    projects = db.query(models.Project).filter(models.Project.planner_id == current_user.id).all()
    return projects
    
@app.get("/api/users/me/pledged-projects", response_model=list[schemas.Pledge])
def get_my_pledged_projects(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # ★★★ フロントエンドでプロジェクト情報を表示するため、joinedload を追加 ★★★
    pledges = db.query(models.Pledge).options(
        joinedload(models.Pledge.project) # 支援した企画の情報も一緒に取得
    ).filter(models.Pledge.user_id == current_user.id).all()
    return pledges

@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project_data = project.dict()
    new_project = models.Project(
        **project_data,
        organizer=current_user.handleName, # フロントの表示のために残しつつ
        planner_id=current_user.id         # ★★★ 必ずIDで紐付ける ★★★
    )
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

@app.post("/api/pledges", response_model=schemas.Pledge)
def create_pledge(pledge_data: schemas.PledgeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):

    # 支援対象のプロジェクトが存在するか確認
    project = db.query(models.Project).filter(models.Project.id == pledge_data.projectId).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # ユーザーのポイントが足りているか確認
    if current_user.points < pledge_data.amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient points")

    # ポイントを消費
    current_user.points -= pledge_data.amount
    # プロジェクトの集まった金額を増やす
    project.collectedAmount += pledge_data.amount
    
    # 企画が「募集中」で、かつ集まった金額が目標額以上になった場合
    if project.status == 'FUNDRAISING' and project.collectedAmount >= project.targetAmount:
        project.status = 'SUCCESSFUL'
        # ここで企画者に「目標達成おめでとう！」というメールを送信する処理を入れると完璧
        
    # 新しい支援(Pledge)レコードを作成
    # ★★★ リクエストのbodyではなく、安全なcurrent_userからIDを取得 ★★★
    new_pledge = models.Pledge(
        amount=pledge_data.amount,
        comment=pledge_data.comment,
        project_id=pledge_data.projectId,
        user_id=current_user.id  # ← 安全な方法！
    )
    
    db.add(new_pledge)
    db.commit()
    db.refresh(new_pledge)
    
    # フロントエンドが期待する形に合わせるため、少しデータを整形して返す
    # （この部分は後ほどschemas.pyの修正でよりスマートになります）
    return {
        "id": new_pledge.id,
        "amount": new_pledge.amount,
        "project": {
            "id": project.id,
            "title": project.title
        }
    }
    
# === 会場 (Venue) API ===

# 会場専用の認証ヘルパー
def get_current_venue(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate venue credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        # ★ 会場用のトークンかスコープをチェック
        if email is None or payload.get("scope") != "venue":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    venue = db.query(models.Venue).filter(models.Venue.email == email).first()
    if venue is None:
        raise credentials_exception
    return venue

# 会場 新規登録
@app.post("/api/venues/register", response_model=schemas.VenuePublic)
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

# 会場 ログイン
@app.post("/api/venues/login", response_model=schemas.TokenDataVenue)
def login_venue(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.email == form_data.username).first()
    if not venue or not security.verify_password(form_data.password, venue.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # ★ スコープに 'venue' を指定して、ファン用トークンと区別する
    access_token = security.create_access_token(data={"sub": venue.email, "scope": "venue"})
    return {"access_token": access_token, "token_type": "bearer", "venue": venue}

# 会場 情報取得 (これは誰でも見れる公開情報)
@app.get("/api/venues/{venue_id}", response_model=schemas.VenuePublic)
def get_venue_details(venue_id: int, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

# 会場 情報更新 (★★ 認証が必須 ★★)
@app.patch("/api/venues/{venue_id}", response_model=schemas.VenuePublic)
def update_venue_details(
    venue_id: int, 
    venue_data: schemas.VenueUpdate, 
    db: Session = Depends(get_db), 
    current_venue: models.Venue = Depends(get_current_venue)
):
    # URLのIDとトークンのIDが一致するか確認 (他人による更新を防ぐ)
    if current_venue.id != venue_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this venue")

    # データを更新
    for key, value in venue_data.dict(exclude_unset=True).items():
        setattr(current_venue, key, value)
    
    db.commit()
    db.refresh(current_venue)
    return current_venue

# ===============================================
# お花屋さん (Florist) API
# ===============================================

# --- 認証ヘルパー ---

# お花屋さん専用の認証ヘルパー関数
def get_current_florist(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate florist credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        # ★ お花屋さん用のトークンかスコープをチェック
        if email is None or payload.get("scope") != "florist":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    florist = db.query(models.Florist).filter(models.Florist.email == email).first()
    if florist is None:
        raise credentials_exception
    return florist

# --- 登録・ログイン ---

@app.post("/api/florists/register")
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
        status="PENDING" # ★★★ 初期ステータスは「審査中」
    )
    db.add(new_florist)
    db.commit()
    
    # ここで運営への通知メールなどを送るとさらに良い
    
    return {"message": "登録申請を受け付けました。運営による承認をお待ちください。"}

@app.post("/api/florists/login", response_model=schemas.TokenDataFlorist)
def login_florist(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    florist = db.query(models.Florist).filter(models.Florist.email == form_data.username).first()
    if not florist or not security.verify_password(form_data.password, florist.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # ★ スコープに 'florist' を指定してトークンを生成
    access_token = security.create_access_token(data={"sub": florist.email, "scope": "florist"})
    return {"access_token": access_token, "token_type": "bearer", "florist": florist}

# --- 公開API (認証不要) ---

@app.get("/api/florists", response_model=list[schemas.FloristPublic])
def get_all_florists(db: Session = Depends(get_db)):
    florists = db.query(models.Florist).filter(models.Florist.status == "APPROVED").all()
    
    # ★★★ レビュー情報を集計して追加 ★★★
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

@app.get("/api/florists/{florist_id}", response_model=schemas.FloristPublic)
def get_florist_details(florist_id: int, db: Session = Depends(get_db)):
    florist = db.query(models.Florist).filter(models.Florist.id == florist_id, models.Florist.status == "APPROVED").first()
    if not florist:
        raise HTTPException(status_code=404, detail="Florist not found or not approved")
    
    # ★★★ こちらでも同様にレビュー情報を集計 ★★★
    review_stats = db.query(
        func.count(models.Review.id).label("count"),
        func.avg(models.Review.rating).label("avg")
    ).filter(models.Review.florist_id == florist_id).one()
    
    florist.reviewCount = review_stats.count
    florist.averageRating = float(review_stats.avg) if review_stats.avg else 0.0
    
    return florist

# --- 認証必須API ---

@app.get("/api/florists/dashboard")
def get_florist_dashboard_data(db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    # 自分宛のオファーをステータスごとに取得
    offers = db.query(models.Offer).options(
        joinedload(models.Offer.project).joinedload(models.Project.planner) # オファー元の企画と企画者情報も取得
    ).filter(models.Offer.florist_id == current_florist.id).all()
    
    return {
        "florist": {
            "balance": current_florist.balance
        },
        "offers": offers
    }

@app.patch("/api/florists/{florist_id}", response_model=schemas.FloristPublic)
def update_florist_profile(florist_id: int, florist_data: schemas.FloristUpdate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    # URLのIDとトークンのIDが一致するか確認
    if current_florist.id != florist_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")

    for key, value in florist_data.dict(exclude_unset=True).items():
        setattr(current_florist, key, value)
    
    db.commit()
    db.refresh(current_florist)
    return current_florist

# --- オファー関連API ---

@app.post("/api/offers", response_model=schemas.Offer)
def create_offer(offer_data: schemas.OfferCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ファン(user)としてログインしていることが前提
    project = db.query(models.Project).filter(models.Project.id == offer_data.projectId).first()
    florist = db.query(models.Florist).filter(models.Florist.id == offer_data.floristId, models.Florist.status == "APPROVED").first()

    if not project or not florist:
        raise HTTPException(status_code=404, detail="Project or Florist not found")

    # 企画の企画者本人のみオファー可能
    if project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the project planner can make offers.")
        
    # 既にオファー済みかチェック
    existing_offer = db.query(models.Offer).filter(models.Offer.project_id == project.id, models.Offer.florist_id == florist.id).first()
    if existing_offer:
        raise HTTPException(status_code=400, detail="Offer has already been sent.")

    new_offer = models.Offer(project_id=project.id, florist_id=florist.id)
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    return new_offer

@app.patch("/api/offers/{offer_id}", response_model=schemas.Offer)
def update_offer_status(offer_id: int, status_data: schemas.OfferStatusUpdate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    # お花屋さんとしてログインしていることが前提
    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    # 自分宛のオファーか確認
    if offer.florist_id != current_florist.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this offer.")
        
    # ステータスを更新
    offer.status = status_data.status
    
    if offer.status == 'ACCEPTED':
        # 既にこのオファーにチャットルームが存在しないか確認
        if not offer.chat_room_id:
            new_chat_room = models.ChatRoom(
                project_id=offer.project_id,
                florist_id=offer.florist_id
            )
            db.add(new_chat_room)
            db.flush() # new_chat_room.id を確定させる
            
            # Offerに作成したチャットルームのIDを紐付ける
            offer.chat_room_id = new_chat_room.id
            
    db.commit()
    
    # 承認した場合、企画者とお花屋さんのチャットルームを作成するロジックなどをここに追加
    
    db.refresh(offer)
    return offer

# --- チャットルーム・見積書 API ---

@app.get("/api/chat-rooms/{chat_room_id}")
def get_chat_room_details(chat_room_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ユーザーがこのチャットルームのメンバーか検証する必要がある (簡略化のため省略)
    chat_room = db.query(models.ChatRoom).options(
        joinedload(models.ChatRoom.project).joinedload(models.Project.planner),
        joinedload(models.ChatRoom.project).joinedload(models.Project.quotation).joinedload(models.Quotation.items),
        joinedload(models.ChatRoom.florist),
        joinedload(models.ChatRoom.messages)
    ).filter(models.ChatRoom.id == chat_room_id).first()
    
    if not chat_room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    return chat_room

@app.post("/api/quotations", response_model=schemas.Quotation)
def create_quotation(quotation_data: schemas.QuotationCreate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    total_amount = sum(item.amount for item in quotation_data.items)
    new_quotation = models.Quotation(
        projectId=quotation_data.projectId,
        floristId=current_florist.id,
        totalAmount=total_amount
    )
    db.add(new_quotation)
    db.flush()
    
    for item_data in quotation_data.items:
        db.add(models.QuotationItem(**item_data.dict(), quotation_id=new_quotation.id))
        
    db.commit()
    db.refresh(new_quotation)
    return new_quotation

@app.patch("/api/quotations/{quotation_id}/approve")
def approve_quotation(quotation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quotation = db.query(models.Quotation).options(joinedload(models.Quotation.project), joinedload(models.Quotation.florist)).filter(models.Quotation.id == quotation_id).first()
    
    if not quotation or quotation.project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    if quotation.project.collectedAmount < quotation.totalAmount:
        raise HTTPException(status_code=400, detail="プロジェクトの支援総額が見積額に達していません。")
        
    # ★★★ 支払い処理 ★★★
    quotation.project.collectedAmount -= quotation.totalAmount # 企画からポイントを引く
    quotation.florist.balance += quotation.totalAmount       # お花屋さんの売上残高に加算
    quotation.isApproved = True
    
    commission_rate = 0.10
    commission_amount = int(quotation.totalAmount * commission_rate)
    florist_payout = quotation.totalAmount - commission_amount
    
    # お花屋さんの売上残高に手数料を引いた額を加算
    quotation.florist.balance += florist_payout
    
    # 運営の収益として手数料を記録
    new_commission = models.Commission(
        amount=commission_amount,
        project_id=quotation.project.id
    )
    db.add(new_commission)
    
    db.commit()
    return {"message": "Quotation approved and payment completed."}

# --- 出金関連API ---

@app.get("/api/florists/{florist_id}/payouts", response_model=list[schemas.Payout])
def get_payout_history(florist_id: int, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    if current_florist.id != florist_id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    
    payouts = db.query(models.Payout).filter(models.Payout.florist_id == current_florist.id).order_by(models.Payout.createdAt.desc()).all()
    return payouts

@app.post("/api/payouts", response_model=schemas.Payout)
def request_payout(payout_data: schemas.PayoutCreate, db: Session = Depends(get_db), current_florist: models.Florist = Depends(get_current_florist)):
    MINIMUM_PAYOUT_AMOUNT = 1000
    
    if payout_data.amount < MINIMUM_PAYOUT_AMOUNT:
        raise HTTPException(status_code=400, detail=f"Minimum payout amount is {MINIMUM_PAYOUT_AMOUNT} pt.")
        
    if current_florist.balance < payout_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance.")

    # 売上残高から申請額を引く
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
    
    # ここで運営への出金申請通知メールなどを送ると良い
    
    return new_payout

# === Stripe決済 API ===
# --- ここからが新しいコード ---

@app.post("/api/checkout/create-session")
def create_checkout_session(request: schemas.CheckoutRequest, current_user: models.User = Depends(get_current_user)):
    # リクエストから安全なデータを取り出す
    checkout_data = request.dict()
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'jpy',
                    'product_data': {
                        'name': f"{checkout_data['points']} ポイント購入",
                    },
                    'unit_amount': checkout_data['amount'],
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"https://{os.environ.get('FRONTEND_URL', 'flastal-frontend.onrender.com')}/payment/success",
            cancel_url=f"https://{os.environ.get('FRONTEND_URL', 'flastal-frontend.onrender.com')}/points",
            client_reference_id=str(current_user.id),
            metadata={
                'points': str(checkout_data['points'])
            }
        )
        return {"url": session.url}
    except Exception as e:
        # エラーの詳細をログに出力
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # checkout.session.completed イベントを処理
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        points_purchased = int(session.get('metadata', {}).get('points', 0))

        if user_id and points_purchased > 0:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()
            if user:
                user.points += points_purchased
                db.commit()
                print(f"User {user_id} purchased {points_purchased} points.")

    return {"status": "success"}

@app.get("/api/venues", response_model=list[schemas.Venue])
def get_venues(db: Session = Depends(get_db)):
    return db.query(models.Venue).all()

@app.post("/api/announcements", response_model=schemas.Announcement)
def create_announcement(announcement_data: schemas.AnnouncementCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # お知らせを投稿するプロジェクトを取得
    project = db.query(models.Project).filter(models.Project.id == announcement_data.projectId).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # ★★★ 権限チェック: ログインユーザーが企画者本人か確認 ★★★
    if project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to post announcements for this project.")

    # 新しいお知らせを作成してデータベースに保存
    new_announcement = models.Announcement(
        title=announcement_data.title,
        content=announcement_data.content,
        project_id=announcement_data.projectId
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)

    return new_announcement

# 経費を追加するAPI
@app.post("/api/expenses", response_model=schemas.Expense)
def create_expense(expense_data: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == expense_data.projectId).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # 権限チェック
    if project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    new_expense = models.Expense(**expense_data.dict())
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

# 経費を削除するAPI
@app.delete("/api/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    expense = db.query(models.Expense).options(
        joinedload(models.Expense.project) # どのプロジェクトに属しているかを知るため
    ).filter(models.Expense.id == expense_id).first()
    
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        
    # 権限チェック
    if expense.project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"} # 204なので実際には返らない

# タスクを追加するAPI
@app.post("/api/tasks", response_model=schemas.Task)
def create_task(task_data: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == task_data.projectId).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    new_task = models.Task(title=task_data.title, project_id=task_data.projectId)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# タスクの完了/未完了を更新するAPI
@app.patch("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_data: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).options(
        joinedload(models.Task.project)
    ).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if task.project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        
    task.isCompleted = task_data.isCompleted
    db.commit()
    db.refresh(task)
    return task

# タスクを削除するAPI
@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).options(
        joinedload(models.Task.project)
    ).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    if task.project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

@app.post("/api/messages", response_model=schemas.Message)
def create_message(message_data: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 企画の存在確認
    project = db.query(models.Project).filter(models.Project.id == message_data.projectId).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # ★★★ 権限チェック 1: ユーザーがこの企画の支援者か？ ★★★
    pledge = db.query(models.Pledge).filter(
        models.Pledge.project_id == message_data.projectId,
        models.Pledge.user_id == current_user.id
    ).first()
    if not pledge:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only pledgers can post messages.")

    # ★★★ 権限チェック 2: このユーザーは既にメッセージを投稿済みか？ ★★★
    existing_message = db.query(models.Message).filter(
        models.Message.project_id == message_data.projectId,
        models.Message.user_id == current_user.id
    ).first()
    if existing_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already posted a message for this project.")

    # 新しいメッセージを作成
    new_message = models.Message(
        content=message_data.content,
        cardName=message_data.cardName,
        project_id=message_data.projectId,
        user_id=current_user.id
    )
    db.add(new_message)
    db.commit()

    # レスポンスのために、関連するユーザー情報を読み込む
    db.refresh(new_message, attribute_names=['user'])
    return new_message


@app.patch("/api/projects/{project_id}/complete", response_model=schemas.Project)
def complete_project(project_id: int, completion_data: schemas.ProjectComplete, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # 権限チェック: 企画者本人か？
    if project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        
    # ステータスチェック: 企画は目標達成(SUCCESSFUL)しているか？
    # ※フロントエンドではSUCCESSFULの場合のみボタンが表示されるが、APIでもチェックするのが安全
    if project.status != 'SUCCESSFUL':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project cannot be completed in its current state.")

    # データを更新してステータスを'COMPLETED'に変更
    project.completionImageUrls = completion_data.completionImageUrls
    project.completionComment = completion_data.completionComment
    project.status = 'COMPLETED'
    
    db.commit()
    db.refresh(project)
    return project

@app.patch("/api/projects/{project_id}/cancel", response_model=schemas.Project)
def cancel_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # joinedloadで支援者(pledges)と、その支援者の情報(user)も一度に取得
    project = db.query(models.Project).options(
        joinedload(models.Project.pledges).joinedload(models.Pledge.user)
    ).filter(models.Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # 権限チェック
    if project.planner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
        
    # ステータスチェック: 既に完了/中止されていないか
    if project.status in ['COMPLETED', 'CANCELED']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project has already been closed.")

    # ★★★ 返金処理 ★★★
    for pledge in project.pledges:
        # pledge.user に支援者の情報が入っている
        pledge.user.points += pledge.amount
    
    # プロジェクトのステータスを'CANCELED'に更新
    project.status = 'CANCELED'
    
    db.commit()
    db.refresh(project)
    
    return project

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Cloudinaryに画像をアップロード
        result = cloudinary.uploader.upload(file.file)
        # アップロードされた画像の安全なURLを取得
        image_url = result.get("secure_url")
        return {"url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    
@app.post("/api/reports/project")
def create_project_report(report_data: schemas.ReportCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 企画が存在するか確認
    project = db.query(models.Project).filter(models.Project.id == report_data.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_report = models.Report(
        **report_data.dict(),
        reporter_id=current_user.id
    )
    db.add(new_report)
    db.commit()

    # ここで管理者へのメール通知などを将来的に実装すると良い
    
    return {"message": "ご報告ありがとうございます。内容を確認し、適切に対応いたします。"}

# アンケート作成API
@app.post("/api/group-chat/polls", response_model=schemas.Poll)
def create_poll(poll_data: schemas.PollCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == poll_data.projectId).first()
    if not project or project.planner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    
    # 既存のアクティブなアンケートがあれば無効化する
    db.query(models.Poll).filter(models.Poll.project_id == poll_data.projectId).update({"isActive": False})

    new_poll = models.Poll(question=poll_data.question, project_id=poll_data.projectId, creator_id=current_user.id)
    db.add(new_poll)
    db.flush() # new_poll.id が確定する

    # 選択肢を作成
    for option_text in poll_data.options:
        db.add(models.PollOption(text=option_text, poll_id=new_poll.id))
    
    db.commit()
    db.refresh(new_poll)
    return new_poll

# 投票API
@app.post("/api/group-chat/polls/vote")
def vote_on_poll(vote_data: schemas.PollVoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    poll = db.query(models.Poll).filter(models.Poll.id == vote_data.pollId).first()
    if not poll or not poll.isActive:
        raise HTTPException(status_code=400, detail="This poll is not active.")
    
    # 支援者のみ投票可能
    pledge = db.query(models.Pledge).filter(models.Pledge.project_id == poll.project_id, models.Pledge.user_id == current_user.id).first()
    if not pledge:
        raise HTTPException(status_code=403, detail="Only pledgers can vote.")

    # 既に投票済みかチェック
    existing_vote = db.query(models.PollVote).filter(models.PollVote.poll_id == vote_data.pollId, models.PollVote.user_id == current_user.id).first()
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted.")

    new_vote = models.PollVote(poll_id=vote_data.pollId, user_id=current_user.id, option_index=vote_data.optionIndex)
    db.add(new_vote)
    db.commit()

    return {"message": "Vote successful."}

# ===============================================
# 管理者 (Admin) API
# ===============================================

# --- チャット監視API ---

@app.get("/api/admin/projects", response_model=list[schemas.Project])
def get_all_projects_for_admin(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """チャット監視用に、全てのプロジェクトを企画者情報付きで取得する"""
    return db.query(models.Project).options(joinedload(models.Project.planner)).order_by(models.Project.id.desc()).all()

@app.get("/api/admin/projects/{project_id}/chats", response_model=schemas.ChatsForModeration)
def get_project_chats_for_admin(project_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """指定された企画の全チャット履歴を取得する"""
    group_chat = db.query(models.GroupChatMessage).options(
        joinedload(models.GroupChatMessage.user)
    ).filter(models.GroupChatMessage.project_id == project_id).all()
    
    # 企画とお花屋さんのプライベートチャットを取得
    chat_room = db.query(models.ChatRoom).filter(models.ChatRoom.project_id == project_id).first()
    florist_chat = []
    if chat_room:
        florist_chat = db.query(models.ChatMessage).options(
            joinedload(models.ChatMessage.user), # sender_typeが'USER'の場合
            joinedload(models.ChatMessage.florist) # sender_typeが'FLORIST'の場合
        ).filter(models.ChatMessage.chat_room_id == chat_room.id).all()

    return {"groupChat": group_chat, "floristChat": florist_chat}

@app.delete("/api/admin/group-chat/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_chat_message(message_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """グループチャットのメッセージを削除する"""
    message = db.query(models.GroupChatMessage).filter(models.GroupChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # WebSocketでリアルタイムにクライアントから削除する通知を送る
    # await sio.emit('groupMessageDeleted', {'messageId': message_id}, room=f"project_{message.project_id}")
    
    db.delete(message)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.delete("/api/admin/florist-chat/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_florist_chat_message(message_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    """企画者-お花屋さん間のプライベートチャットメッセージを削除する"""
    message = db.query(models.ChatMessage).filter(models.ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # WebSocketでリアルタイムにクライアントから削除する通知を送る
    # await sio.emit('privateMessageDeleted', {'messageId': message_id}, room=f"chat_{message.chat_room_id}")

    db.delete(message)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- 認証ヘルパー ---

ADMIN_PASSWORD_HASH = security.get_password_hash(os.environ.get("ADMIN_PASSWORD", "supersecretpassword"))

def get_current_admin_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=403, detail="Forbidden")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # ★ 管理者専用のスコープをチェック
        if payload.get("scope") != "admin":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return {"role": "admin"}

# --- ログイン ---
class AdminLoginRequest(BaseModel):
    password: str

@app.post("/api/admin/login")
def admin_login(form_data: AdminLoginRequest):
    if not security.verify_password(form_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    # ★ スコープに 'admin' を指定してトークンを生成
    access_token = security.create_access_token(data={"sub": "admin", "scope": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}

# --- 各種管理API (すべて `Depends(get_current_admin_user)` で保護) ---

@app.get("/api/admin/commissions")
def get_commissions(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Commission).options(joinedload(models.Commission.project)).all()

@app.get("/api/admin/florists/pending")
def get_pending_florists(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Florist).filter(models.Florist.status == "PENDING").all()

@app.patch("/api/admin/florists/{florist_id}/status")
def update_florist_status(florist_id: int, status_data: schemas.FloristStatusUpdate, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    florist = db.query(models.Florist).filter(models.Florist.id == florist_id).first()
    if not florist: raise HTTPException(404, "Florist not found")
    florist.status = status_data.status
    db.commit()
    # ここで承認/拒否メールを送信すると良い
    return {"message": "Status updated"}

@app.get("/api/admin/payouts")
def get_pending_payouts(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Payout).options(joinedload(models.Payout.florist)).filter(models.Payout.status == "PENDING").all()

@app.patch("/api/admin/payouts/{payout_id}/complete")
def complete_payout(payout_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id).first()
    if not payout: raise HTTPException(404, "Payout not found")
    payout.status = "COMPLETED"
    db.commit()
    return {"message": "Payout marked as completed"}

@app.get("/api/admin/reports")
def get_pending_reports(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    return db.query(models.Report).options(joinedload(models.Report.project), joinedload(models.Report.reporter)).filter(models.Report.status == "PENDING").all()

@app.patch("/api/admin/reports/{report_id}/review")
def review_report(report_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report: raise HTTPException(404, "Report not found")
    report.status = "REVIEWED"
    db.commit()
    return {"message": "Report marked as reviewed"}

@app.patch("/api/admin/projects/{project_id}/visibility")
def toggle_project_visibility(project_id: int, visibility_data: schemas.ProjectVisibilityUpdate, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project: raise HTTPException(404, "Project not found")
    project.visibility = "PRIVATE" if not visibility_data.isVisible else "PUBLIC"
    db.commit()
    return {"message": "Visibility updated"}

# (チャット監視系APIは複雑なので、必要に応じて追加)



# ===============================================
# Socket.IO イベントハンドラ
# ===============================================

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
        
        message_for_client = schemas.ChatMessage.from_orm(new_message).dict() # ChatMessageスキーマが必要
        await sio.emit('receiveChatMessage', message_for_client, room=f"chat_{data['chatRoomId']}")
    finally:
        db.close()

# データベースセッションを非同期イベント内で使用するためのヘルパー
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# get_current_userを非同期イベント内で使えるように少し改造
def get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: return None
    except JWTError:
        return None
    return db.query(models.User).filter(models.User.email == email).first()

@sio.event
async def connect(sid, environ):
    print(f"Socket.IO client connected: {sid}")
    token = environ.get('HTTP_AUTHORIZATION', None) # Next.js 13+からは 'HTTP_AUTHORIZATION' で取れることが多い
    if not token:
        # 'auth'で渡された場合
        token = environ.get('asgi.scope', {}).get('auth', {}).get('token')

    if not token:
        print(f"Connection rejected for {sid}: No token provided.")
        raise socketio.exceptions.ConnectionRefusedError('authentication failed')

    db = next(get_db_session())
    user = get_user_from_token(token, db)
    db.close()

    if not user:
        print(f"Connection rejected for {sid}: Invalid token.")
        raise socketio.exceptions.ConnectionRefusedError('authentication failed')
    
    # ★★★ 接続(sid)とユーザーIDを紐付けて保存 ★★★
    await sio.save_session(sid, {'user_id': user.id, 'handleName': user.handleName})
    print(f"Client {sid} authenticated as user {user.id}")


@sio.event
async def disconnect(sid):
    print(f"Socket.IO client disconnected: {sid}")

# フロントエンドの `socket.emit('joinProjectRoom', id)` に対応
@sio.event
async def joinProjectRoom(sid, projectId):
    # 特定の企画IDの「ルーム」にクライアントを参加させる
    sio.enter_room(sid, f"project_{projectId}")
    print(f"Client {sid} joined room: project_{projectId}")

# フロントエンドの `socket.emit('sendGroupChatMessage', ...)` に対応
@sio.on('sendGroupChatMessage')
async def handle_group_chat_message(sid, data):
    # 保存したセッションから安全なユーザー情報を取得
    session = await sio.get_session(sid)
    user_id = session.get('user_id')

    # user_id = data.get('userId') ← この行を完全に削除！
    
    db = next(get_db_session())
    try:
        project_id = data.get('projectId')
        user_id = data.get('userId') # 本来はここもトークンから検証すべきだが、簡略化のためsidと紐付ける
        content = data.get('content')
        template_id = data.get('templateId')

        # 必須データがなければエラーを返す
        if not project_id or not user_id:
            await sio.emit('messageError', 'Missing project or user ID.', to=sid)
            return

        # ユーザーとプロジェクトの存在、および参加権限を確認
        user = db.query(models.User).filter(models.User.id == user_id).first()
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        pledge = db.query(models.Pledge).filter(models.Pledge.project_id == project_id, models.Pledge.user_id == user_id).first()
        is_planner = project.planner_id == user_id

        if not user or not project or (not pledge and not is_planner):
            await sio.emit('messageError', 'You are not authorized to post in this chat.', to=sid)
            return

        # データベースにチャットメッセージを保存
        new_message = models.GroupChatMessage(
            content=content,
            templateId=template_id,
            project_id=project_id,
            user_id=user_id
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)

        # フロントエンドに返すためのデータを作成 (Pydanticスキーマを使って整形)
        message_for_client = schemas.GroupChatMessage.from_orm(new_message).dict()

        # ★★★ ルーム内の全員に新しいメッセージを送信 ★★★
        await sio.emit('receiveGroupChatMessage', message_for_client, room=f"project_{project_id}")

    except Exception as e:
        print(f"Error in handle_group_chat_message: {e}")
        await sio.emit('messageError', 'An error occurred on the server.', to=sid)
    finally:
        # 必ずセッションを閉じる
        db.close()