import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendDynamicEmail, queueEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

const REFERRAL_BONUS_POINTS = parseInt(process.env.REFERRAL_BONUS_POINTS || '200');

// ==========================================
// ★★★ 共通ヘルパー: トークン発行 ★★★
// ==========================================
const generateToken = (payload, expiresIn = '15m') => {
    const cleanPayload = {
        ...payload,
        id: payload.id ? String(payload.id) : undefined,
        sub: payload.sub ? String(payload.sub) : (payload.id ? String(payload.id) : undefined)
    };
    return jwt.sign(cleanPayload, process.env.JWT_SECRET, { expiresIn });
};

export const generateTokensForOAuth = async (payload) => {
    return generateTokens(payload);
};

// ビジネスロール（Florist/Venue/Organizer）向け: 7日間有効、DB保存不要
// refreshTokenにもJWT自体を使い、/auth/refreshで再検証して返す
export const generateBusinessToken = (payload) => {
    const token = generateToken(payload, '7d');
    return { accessToken: token, refreshToken: token };
};

const generateTokens = async (payload) => {
    const accessToken = generateToken(payload);
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const userId = String(payload.id);
    await prisma.refreshToken.create({
        data: { token: refreshTokenValue, userId, expiresAt },
    });
    return { accessToken, refreshToken: refreshTokenValue };
};

// ==========================================
// ★★★ 1. 一般ユーザー (User) ★★★
// ==========================================

export const registerUser = async (req, res) => {
    try {
        const { email, password, handleName, referralCode } = req.body;
        const lowerEmail = email.toLowerCase();

        const existingUser = await prisma.user.findUnique({ where: { email: lowerEmail } });
        if (existingUser) return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const userData = {
            email: lowerEmail,
            handleName,
            password: hashedPassword,
            isVerified: false,
            verificationToken,
        };

        let referrer = null;
        if (referralCode && referralCode.trim() !== '') {
            referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.trim() } });
            if (referrer) userData.referredById = referrer.id;
        }

        await prisma.user.create({ data: userData });

        // 紹介ボーナス: 招待した人と新規ユーザー両方にポイント付与
        if (referrer) {
            await prisma.user.update({
                where: { id: referrer.id },
                data: { points: { increment: REFERRAL_BONUS_POINTS } },
            });
            queueEmail(referrer.email, 'REFERRAL_BONUS', {
                userName: referrer.handleName || 'さん',
                points: REFERRAL_BONUS_POINTS.toLocaleString(),
                newUserName: handleName,
            });
        }

        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(lowerEmail, 'VERIFICATION_EMAIL', {
            userName: handleName,
            verificationUrl: verificationUrl
        });

        res.status(201).json({ message: '確認メールを送信しました。' });
    } catch (error) {
        logger.error('User登録エラー', { context: 'authController', error: error.message });
        res.status(500).json({ message: '登録処理中にエラーが発生しました。' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const lowerEmail = email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: lowerEmail } });

        if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません。' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'パスワードが間違っています。' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'メールアドレスの認証が完了していません。' });
        }

        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'このアカウントは利用停止中です。お問い合わせください。' });
        }

        let userRole = user.role;
        const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(lowerEmail)) {
            userRole = 'ADMIN';
        }

        // 2FA が有効な場合はトークンを要求
        if (user.totpEnabled) {
            const { totpToken } = req.body;
            if (!totpToken) {
                return res.status(200).json({ requireTotp: true });
            }
            const { validateTotpToken } = await import('./totpController.js');
            const valid = validateTotpToken(user.totpSecret, totpToken);
            if (!valid) return res.status(401).json({ message: '認証コードが正しくありません' });
        }

        // ADMINメールの場合はrolesにも反映
        const userRoles = userRole === 'ADMIN'
            ? ['ADMIN']
            : (user.roles?.length ? user.roles : [userRole]);

        const { accessToken, refreshToken } = await generateTokens({
            id: user.id,
            email: user.email,
            handleName: user.handleName,
            role: userRole,
            roles: userRoles,
            status: 'APPROVED'
        });

        const { password: _, ...userData } = user;

        res.status(200).json({ message: 'ログインに成功しました。', token: accessToken, refreshToken, user: userData });
    } catch (error) {
        logger.error('User login failed', { error: error.message });
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 2. お花屋さん (Florist) ★★★
// ==========================================

export const registerFlorist = async (req, res) => {
    try {
        const { email, password, shopName, contactName, platformName } = req.body;
        const lowerEmail = email.toLowerCase();
        
        const existing = await prisma.florist.findUnique({ where: { email: lowerEmail } });
        if (existing) return res.status(409).json({ message: 'このメールアドレスは既に登録されています。' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        await prisma.florist.create({
            data: { 
                email: lowerEmail, 
                password: hashedPassword, 
                shopName, 
                platformName, 
                contactName, 
                status: 'PENDING', 
                isVerified: false, 
                verificationToken 
            },
        });
        
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(lowerEmail, 'VERIFICATION_EMAIL', { userName: platformName, verificationUrl });
        res.status(201).json({ message: '確認メールを送信しました。' });
    } catch (error) {
        logger.error('Florist Register Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: '登録中にエラーが発生しました。' });
    }
};

export const loginFlorist = async (req, res) => {
    try {
        const { email, password } = req.body;
        const lowerEmail = email.toLowerCase();
        const florist = await prisma.florist.findUnique({ where: { email: lowerEmail } });
        
        if (!florist || !(await bcrypt.compare(password, florist.password))) {
            return res.status(401).json({ message: '認証に失敗しました。' });
        }
        
        if (!florist.isVerified) {
            return res.status(403).json({ message: 'メールアドレスの認証が完了していません。' });
        }

        if (florist.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'このアカウントは利用停止中です。お問い合わせください。' });
        }

        if (florist.status !== 'APPROVED') {
            return res.status(403).json({ message: 'アカウントが承認されていません。審査完了までお待ちください。' });
        }
        
        const { accessToken, refreshToken } = generateBusinessToken({
            id: florist.id,
            email: florist.email,
            role: 'FLORIST',
            status: florist.status,
            shopName: florist.shopName,
            handleName: florist.platformName
        });

        const { password: _, ...data } = florist;
        res.status(200).json({ message: 'ログインに成功しました。', token: accessToken, refreshToken, florist: data });
    } catch (error) {
        logger.error('Florist login failed', { error: error.message });
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 3. 会場 (Venue) ★★★
// ==========================================

export const registerVenue = async (req, res) => {
    try {
        const { email, password, venueName } = req.body;
        const lowerEmail = email.toLowerCase();
        const existing = await prisma.venue.findUnique({ where: { email: lowerEmail } });
        if (existing) return res.status(409).json({ message: '既に使用されています。' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        await prisma.venue.create({ 
            data: { email: lowerEmail, password: hashedPassword, venueName, status: 'PENDING', isVerified: false, verificationToken } 
        });
        
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(lowerEmail, 'VERIFICATION_EMAIL', { userName: venueName, verificationUrl });
        res.status(201).json({ message: 'メールを送信しました。' });
    } catch (error) { 
        logger.error('Venue Register Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: '登録エラーが発生しました。' }); 
    }
};

export const loginVenue = async (req, res) => {
    try {
        const { email, password } = req.body;
        const venue = await prisma.venue.findUnique({ where: { email: email.toLowerCase() } });
        
        if (!venue || !(await bcrypt.compare(password, venue.password))) return res.status(401).json({ message: '認証失敗' });
        if (!venue.isVerified) return res.status(403).json({ message: 'メール認証が完了していません。確認メールをご確認ください。', code: 'EMAIL_UNVERIFIED' });
        if (venue.status !== 'APPROVED') return res.status(403).json({ message: '現在審査中です。承認後にログインできます。', code: 'PENDING_APPROVAL' });
        
        const { accessToken, refreshToken } = generateBusinessToken({
            id: venue.id,
            email: venue.email,
            role: 'VENUE',
            status: venue.status,
            venueName: venue.venueName
        });

        const { password: _, ...data } = venue;
        res.status(200).json({ message: '成功', token: accessToken, refreshToken, venue: data });
    } catch (error) { 
        logger.error('Venue Login Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: 'エラーが発生しました。' }); 
    }
};

// ==========================================
// ★★★ 4. 主催者 (Organizer) ★★★
// ==========================================

export const registerOrganizer = async (req, res) => {
    try {
        const { email, password, name, website } = req.body;
        const lowerEmail = email.toLowerCase();
        const existing = await prisma.organizer.findUnique({ where: { email: lowerEmail } });
        if (existing) return res.status(409).json({ message: '使用済みのアドレスです。' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        await prisma.organizer.create({ 
            data: { email: lowerEmail, password: hashedPassword, name, website, status: 'PENDING', isVerified: false, verificationToken } 
        });
        
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(lowerEmail, 'VERIFICATION_EMAIL', { userName: name, verificationUrl });
        res.status(201).json({ message: '登録完了メールを送信しました。' });
    } catch (error) { 
        logger.error('Organizer Register Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: 'エラーが発生しました。' }); 
    }
};

export const loginOrganizer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const org = await prisma.organizer.findUnique({ where: { email: email.toLowerCase() } });
        
        if (!org || !(await bcrypt.compare(password, org.password))) return res.status(401).json({ message: '認証失敗' });
        if (!org.isVerified) return res.status(403).json({ message: 'メール認証が完了していません。確認メールをご確認ください。', code: 'EMAIL_UNVERIFIED' });
        if (org.status !== 'APPROVED') return res.status(403).json({ message: '現在審査中です。承認後にログインできます。', code: 'PENDING_APPROVAL' });
        
        const { accessToken, refreshToken } = generateBusinessToken({
            id: org.id,
            email: org.email,
            role: 'ORGANIZER',
            status: org.status,
            name: org.name
        });
        res.status(200).json({ message: '成功', token: accessToken, refreshToken });
    } catch (error) { 
        logger.error('Organizer Login Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: 'エラーが発生しました。' }); 
    }
};

// ==========================================
// ★★★ 5. 共通認証機能 (Verify, Reset) ★★★
// ==========================================

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'トークンが必要です' });

        let userType = null; 
        let record = null;

        record = await prisma.user.findFirst({ where: { verificationToken: token } });
        if (record) userType = 'user';

        if (!record) { 
            record = await prisma.florist.findFirst({ where: { verificationToken: token } }); 
            if (record) userType = 'florist'; 
        }
        if (!record) { 
            record = await prisma.venue.findFirst({ where: { verificationToken: token } }); 
            if (record) userType = 'venue'; 
        }
        if (!record) { 
            record = await prisma.organizer.findFirst({ where: { verificationToken: token } }); 
            if (record) userType = 'organizer'; 
        }

        if (!record) {
            record = await prisma.illustrator.findFirst({ where: { verificationToken: token } });
            if (record) userType = 'illustrator';
        }

        if (!record) return res.status(400).json({ message: '無効または期限切れのトークンです。' });

        await prisma[userType].update({ 
            where: { id: record.id }, 
            data: { isVerified: true, verificationToken: null } 
        });

        res.json({ message: 'メール認証が成功しました。' });
    } catch (error) { 
        logger.error('Verify Email Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: '認証処理中にエラーが発生しました。' }); 
    }
};

export const resendVerification = async (req, res) => {
    const { email, userType } = req.body;
    try {
        const models = { FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer', USER: 'user', ILLUSTRATOR: 'illustrator' };
        const modelName = models[userType] || 'user';
        
        const account = await prisma[modelName].findUnique({ where: { email: email.toLowerCase() } });
        if (!account) return res.status(404).json({ message: 'アカウントが見つかりません' });
        if (account.isVerified) return res.status(400).json({ message: '既に認証済みです' });
        
        const newToken = crypto.randomBytes(32).toString('hex');
        await prisma[modelName].update({ where: { id: account.id }, data: { verificationToken: newToken } });
        
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', { 
            userName: account.handleName || account.shopName || account.venueName || 'お客様', 
            verificationUrl: `${process.env.FRONTEND_URL}/verify?token=${newToken}` 
        });
        
        res.status(200).json({ message: '認証メールを再送信しました。' });
    } catch (error) { 
        logger.error('Resend Verification Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: '再送信中にエラーが発生しました。' }); 
    }
};

export const forgotPassword = async (req, res) => {
    const { email, userType } = req.body;
    try {
        // ILLUSTRATORはUserテーブルに統合されているためuserモデルを使用
        const models = { USER: 'user', FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer', ILLUSTRATOR: 'user' };
        const modelName = models[userType] || 'user';

        const user = await prisma[modelName].findUnique({ where: { email: email.toLowerCase() } });
        if (user) {
            const token = jwt.sign({ id: user.id, type: userType }, process.env.JWT_SECRET, { expiresIn: '15m' });
            const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
            await sendDynamicEmail(email, 'PASSWORD_RESET', { userName: user.handleName || user.platformName || 'お客様', resetLink });
        }
        res.status(200).json({ message: 'ご入力いただいたアドレスが登録されている場合、再設定メールを送信しました。' });
    } catch (error) { 
        logger.error('Forgot Password Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: '処理中にエラーが発生しました。' }); 
    }
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedPassword = await bcrypt.hash(password, 10);
        const models = { USER: 'user', FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer', ILLUSTRATOR: 'user' };

        await prisma[models[decoded.type]].update({
            where: { id: decoded.id }, 
            data: { password: hashedPassword } 
        });
        
        res.status(200).json({ message: 'パスワードを更新しました。新しいパスワードでログインしてください。' });
    } catch (error) {
        logger.error('Reset Password Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: 'トークンの有効期限が切れているか、無効です。' });
    }
};

export const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'リフレッシュトークンが必要です。' });
    }

    // ビジネスロール・ILLUSTRATORは7日JWTをrefreshTokenとして使用
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const businessRoles = ['FLORIST', 'VENUE', 'ORGANIZER', 'ILLUSTRATOR'];
        if (decoded && businessRoles.includes(decoded.role)) {
            const { iat, exp, ...payload } = decoded;
            const newToken = generateBusinessToken(payload);
            return res.json({ token: newToken.accessToken, refreshToken: newToken.refreshToken });
        }
    } catch (_) {
        // JWTでなければ通常のrefreshToken処理へ
    }

    try {
        const stored = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: { select: { id: true, status: true, email: true, handleName: true, role: true, roles: true } } },
        });

        if (!stored) {
            return res.status(401).json({ message: 'リフレッシュトークンが無効です。' });
        }

        if (new Date() > stored.expiresAt) {
            await prisma.refreshToken.delete({ where: { id: stored.id } });
            return res.status(401).json({ message: 'リフレッシュトークンの有効期限が切れています。再ログインしてください。' });
        }

        if (stored.user.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'このアカウントは利用停止中です。' });
        }

        await prisma.refreshToken.delete({ where: { id: stored.id } });

        const refreshedRoles = stored.user.roles?.length ? stored.user.roles : [stored.user.role];
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens({
            id: stored.user.id,
            email: stored.user.email,
            handleName: stored.user.handleName,
            role: stored.user.role,
            roles: refreshedRoles,
            status: stored.user.status,
        });

        res.json({ token: accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        logger.error('Refresh Token Error', { context: 'authController', error: error.message });
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

export const revokeRefreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
    }
    res.json({ message: 'ログアウトしました。' });
};

// ==========================================
// ★★★ 6. 管理者 (Admin) ★★★
// ==========================================

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const lowerEmail = email.toLowerCase();
        
        // 1. DBからユーザーを検索
        const adminUser = await prisma.user.findUnique({
            where: { email: lowerEmail }
        });

        // 2. 存在チェック & 権限チェック
        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(401).json({ message: '管理者権限がありません。' });
        }

        // 3. パスワード照合 (bcrypt)
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'パスワードが間違っています。' });
        }

        const { accessToken, refreshToken } = await generateTokens({
            id: adminUser.id,
            email: adminUser.email,
            role: 'ADMIN',
            status: 'APPROVED'
        });

        res.status(200).json({
            message: '管理者として認証されました。',
            token: accessToken,
            refreshToken,
        });
    } catch (error) {
        logger.error('Admin login error', { context: 'authController', error: error.message });
        res.status(500).json({ message: 'ログイン処理中にエラーが発生しました。' });
    }
};