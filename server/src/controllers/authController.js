import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendDynamicEmail, sendEmail } from '../utils/email.js';

// ==========================================
// ★★★ 共通ヘルパー: トークン発行 ★★★
// ==========================================
const generateToken = (payload) => {
    // ペイロード内の ID 関連をすべて文字列に強制変換（不整合防止）
    const cleanPayload = {
        ...payload,
        id: payload.id ? String(payload.id) : undefined,
        sub: payload.sub ? String(payload.sub) : (payload.id ? String(payload.id) : undefined)
    };
    return jwt.sign(cleanPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
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

        if (referralCode && referralCode.trim() !== '') {
            const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.trim() } });
            if (referrer) userData.referredById = referrer.id;
        }

        await prisma.user.create({ data: userData });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(lowerEmail, 'VERIFICATION_EMAIL', {
            userName: handleName,
            verificationUrl: verificationUrl
        });

        res.status(201).json({ message: '確認メールを送信しました。' });
    } catch (error) {
        console.error('User登録エラー:', error);
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

        let userRole = user.role;
        const ADMIN_EMAILS = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];
        if (ADMIN_EMAILS.includes(lowerEmail)) {
            userRole = 'ADMIN';
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            handleName: user.handleName,
            role: userRole,
            status: 'APPROVED'
        });

        res.status(200).json({ message: 'ログインに成功しました。', token });
    } catch (error) {
        console.error('Login Error:', error);
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
        console.error('Florist Register Error:', error);
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
        
        if (!florist.isVerified || florist.status !== 'APPROVED') {
            return res.status(403).json({ message: 'アカウントが承認されていないか、未認証です。' });
        }
        
        // ★最重要修正: ミドルウェアが迷わないよう id と role を明確にセット
        const token = generateToken({ 
            id: florist.id, 
            email: florist.email, 
            role: 'FLORIST', 
            status: florist.status, 
            shopName: florist.shopName,
            handleName: florist.platformName
        });

        const { password: _, ...data } = florist;
        res.status(200).json({ message: 'ログインに成功しました。', token, florist: data });
    } catch (error) {
        console.error('Florist Login Error:', error);
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
        console.error('Venue Register Error:', error);
        res.status(500).json({ message: '登録エラーが発生しました。' }); 
    }
};

export const loginVenue = async (req, res) => {
    try {
        const { email, password } = req.body;
        const venue = await prisma.venue.findUnique({ where: { email: email.toLowerCase() } });
        
        if (!venue || !(await bcrypt.compare(password, venue.password))) return res.status(401).json({ message: '認証失敗' });
        if (!venue.isVerified || venue.status !== 'APPROVED') return res.status(403).json({ message: 'アカウントが承認されていません。' });
        
        const token = generateToken({ 
            id: venue.id, 
            email: venue.email, 
            role: 'VENUE', 
            status: venue.status,
            venueName: venue.venueName
        });

        const { password: _, ...data } = venue;
        res.status(200).json({ message: '成功', token, venue: data });
    } catch (error) { 
        console.error('Venue Login Error:', error);
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
        console.error('Organizer Register Error:', error);
        res.status(500).json({ message: 'エラーが発生しました。' }); 
    }
};

export const loginOrganizer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const org = await prisma.organizer.findUnique({ where: { email: email.toLowerCase() } });
        
        if (!org || !(await bcrypt.compare(password, org.password))) return res.status(401).json({ message: '認証失敗' });
        if (!org.isVerified || org.status !== 'APPROVED') return res.status(403).json({ message: '未承認のアカウントです。' });
        
        const token = generateToken({ 
            id: org.id, 
            email: org.email, 
            role: 'ORGANIZER', 
            status: org.status,
            name: org.name
        });
        res.status(200).json({ message: '成功', token });
    } catch (error) { 
        console.error('Organizer Login Error:', error);
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

        if (!record) return res.status(400).json({ message: '無効または期限切れのトークンです。' });

        await prisma[userType].update({ 
            where: { id: record.id }, 
            data: { isVerified: true, verificationToken: null } 
        });

        res.json({ message: 'メール認証が成功しました。' });
    } catch (error) { 
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: '認証処理中にエラーが発生しました。' }); 
    }
};

export const resendVerification = async (req, res) => {
    const { email, userType } = req.body;
    try {
        const models = { FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer', USER: 'user' };
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
        console.error('Resend Verification Error:', error);
        res.status(500).json({ message: '再送信中にエラーが発生しました。' }); 
    }
};

export const forgotPassword = async (req, res) => {
    const { email, userType } = req.body;
    try {
        const models = { USER: 'user', FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer' };
        const modelName = models[userType] || 'user';
        
        const user = await prisma[modelName].findUnique({ where: { email: email.toLowerCase() } });
        if (user) {
            const token = jwt.sign({ id: user.id, type: userType }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
            await sendEmail(email, 'パスワード再設定', `<p>パスワード再設定の依頼を受け付けました。</p><a href="${resetLink}">こちらをクリックして再設定してください。</a>`);
        }
        res.status(200).json({ message: 'ご入力いただいたアドレスが登録されている場合、再設定メールを送信しました。' });
    } catch (error) { 
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: '処理中にエラーが発生しました。' }); 
    }
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedPassword = await bcrypt.hash(password, 10);
        const models = { USER: 'user', FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer' };
        
        await prisma[models[decoded.type]].update({ 
            where: { id: decoded.id }, 
            data: { password: hashedPassword } 
        });
        
        res.status(200).json({ message: 'パスワードを更新しました。新しいパスワードでログインしてください。' });
    } catch (error) { 
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'トークンの有効期限が切れているか、無効です。' }); 
    }
};

// ==========================================
// ★★★ 6. 管理者 (Admin) ★★★
// ==========================================

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const lowerEmail = email.toLowerCase();
        
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ message: '管理者パスワードが違います。' });
        }

        const adminUser = await prisma.user.findUnique({
            where: { email: "takuminsitou946@gmail.com" }
        });

        if (!adminUser) {
            return res.status(404).json({ message: '指定された管理者アカウントがシステムに存在しません。' });
        }

        const token = generateToken({ 
            id: adminUser.id, 
            email: adminUser.email, 
            role: 'ADMIN',
            status: 'APPROVED'
        });

        res.status(200).json({
            message: '管理者として認証されました。',
            token: token
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: 'ログイン処理中にエラーが発生しました。' });
    }
};