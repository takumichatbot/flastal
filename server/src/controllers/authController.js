import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendDynamicEmail, sendEmail } from '../utils/email.js';

// ==========================================
// ★★★ 共通ヘルパー: トークン発行 ★★★
// ==========================================
const generateToken = (payload) => {
    // 管理者などの場合は長めに持たせる（1週間）
    const expiry = payload.role === 'ADMIN' ? '7d' : '1d';
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiry });
};

// ==========================================
// ★★★ 1. 一般ユーザー (User) ★★★
// ==========================================

export const registerUser = async (req, res) => {
    try {
        const { email, password, handleName, referralCode } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const userData = {
            email,
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
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', {
            userName: handleName,
            verificationUrl: verificationUrl
        });

        res.status(201).json({ message: '確認メールを送信しました。' });
    } catch (error) {
        console.error('User登録エラー:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません。' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'パスワードが間違っています。' });

        if (user.isVerified === false) {
            return res.status(403).json({ message: 'メールアドレスの認証が完了していません。' });
        }

        let userRole = user.role;
        
        // ★ 管理者メールアドレスの判定を強化
        const ADMIN_EMAILS = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];
        if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            userRole = 'ADMIN';
            console.log(`[ADMIN LOGIN] ${user.email} logged in with ADMIN privileges.`);
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            handleName: user.handleName,
            role: userRole,
            sub: user.id
        };

        const token = generateToken(tokenPayload);
        res.status(200).json({ message: 'ログインに成功しました。', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 2. お花屋さん (Florist) ★★★
// ==========================================

export const registerFlorist = async (req, res) => {
    try {
        const { email, password, shopName, contactName, platformName } = req.body;
        const existing = await prisma.florist.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: '既に使用されています。' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.florist.create({
            data: { email, password: hashedPassword, shopName, platformName, contactName, status: 'PENDING', isVerified: false, verificationToken },
        });
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', { userName: platformName, verificationUrl });
        res.status(201).json({ message: '確認メールを送信しました。' });
    } catch (error) {
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

export const loginFlorist = async (req, res) => {
    try {
        const { email, password } = req.body;
        const florist = await prisma.florist.findUnique({ where: { email } });
        if (!florist || !(await bcrypt.compare(password, florist.password))) {
            return res.status(401).json({ message: '認証に失敗しました。' });
        }
        if (!florist.isVerified || florist.status !== 'APPROVED') {
            return res.status(403).json({ message: '審査中または未認証です。' });
        }
        const token = generateToken({ id: florist.id, email: florist.email, role: 'FLORIST', sub: florist.id });
        const { password: _, ...data } = florist;
        res.status(200).json({ message: '成功', token, florist: data });
    } catch (error) {
        res.status(500).json({ message: 'エラー' });
    }
};

// ==========================================
// ★★★ 3. 会場 (Venue) / 4. 主催者 (Organizer) は省略なしで維持 ★★★
// ==========================================

export const registerVenue = async (req, res) => {
    try {
        const { email, password, venueName } = req.body;
        const existing = await prisma.venue.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: '既に使用されています。' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.venue.create({ data: { email, password: hashedPassword, venueName, status: 'PENDING', isVerified: false, verificationToken } });
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', { userName: venueName, verificationUrl });
        res.status(201).json({ message: 'メールを送信しました。' });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

export const loginVenue = async (req, res) => {
    try {
        const { email, password } = req.body;
        const venue = await prisma.venue.findUnique({ where: { email } });
        if (!venue || !(await bcrypt.compare(password, venue.password))) return res.status(401).json({ message: '認証失敗' });
        if (!venue.isVerified || venue.status !== 'APPROVED') return res.status(403).json({ message: '未承認' });
        const token = generateToken({ id: venue.id, email: venue.email, role: 'VENUE', sub: venue.id });
        const { password: _, ...data } = venue;
        res.status(200).json({ message: '成功', token, venue: data });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

export const registerOrganizer = async (req, res) => {
    try {
        const { email, password, name, website } = req.body;
        const existing = await prisma.organizer.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: '使用済み' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.organizer.create({ data: { email, password: hashedPassword, name, website, status: 'PENDING', isVerified: false, verificationToken } });
        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', { userName: name, verificationUrl });
        res.status(201).json({ message: '送信完了' });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

export const loginOrganizer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const org = await prisma.organizer.findUnique({ where: { email } });
        if (!org || !(await bcrypt.compare(password, org.password))) return res.status(401).json({ message: '認証失敗' });
        if (!org.isVerified || org.status !== 'APPROVED') return res.status(403).json({ message: '未承認' });
        const token = generateToken({ id: org.id, email: org.email, role: 'ORGANIZER', sub: org.id });
        res.status(200).json({ message: '成功', token });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

// ==========================================
// ★★★ 5. 共通認証機能 (Verify, Reset) ★★★
// ==========================================

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        let userType = null; let record = null;
        record = await prisma.user.findFirst({ where: { verificationToken: token } });
        if (record) userType = 'user';
        if (!record) { record = await prisma.florist.findFirst({ where: { verificationToken: token } }); if (record) userType = 'florist'; }
        if (!record) { record = await prisma.venue.findFirst({ where: { verificationToken: token } }); if (record) userType = 'venue'; }
        if (!record) { record = await prisma.organizer.findFirst({ where: { verificationToken: token } }); if (record) userType = 'organizer'; }
        if (!record) return res.status(400).json({ message: '無効なトークン' });
        await prisma[userType].update({ where: { id: record.id }, data: { isVerified: true, verificationToken: null } });
        res.json({ message: '認証成功' });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

export const resendVerification = async (req, res) => {
    const { email, userType } = req.body;
    try {
        const models = { FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer', USER: 'user' };
        const modelName = models[userType] || 'user';
        const account = await prisma[modelName].findUnique({ where: { email } });
        if (!account || account.isVerified) return res.status(400).json({ message: '不要です' });
        const newToken = crypto.randomBytes(32).toString('hex');
        await prisma[modelName].update({ where: { id: account.id }, data: { verificationToken: newToken } });
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', { userName: 'お客様', verificationUrl: `${process.env.FRONTEND_URL}/verify?token=${newToken}` });
        res.status(200).json({ message: '再送信完了' });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

export const forgotPassword = async (req, res) => {
    const { email, userType } = req.body;
    try {
        const modelMap = { USER: prisma.user, FLORIST: prisma.florist, VENUE: prisma.venue, ORGANIZER: prisma.organizer };
        const user = await modelMap[userType].findUnique({ where: { email } });
        if (user) {
            const token = jwt.sign({ id: user.id, type: userType }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
            await sendEmail(email, 'パスワード再設定', `<a href="${resetLink}">こちらをクリック</a>`);
        }
        res.status(200).json({ message: 'メールを送信しました' });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedPassword = await bcrypt.hash(password, 10);
        const modelMap = { USER: 'user', FLORIST: 'florist', VENUE: 'venue', ORGANIZER: 'organizer' };
        await prisma[modelMap[decoded.type]].update({ where: { id: decoded.id }, data: { password: hashedPassword } });
        res.status(200).json({ message: '更新完了' });
    } catch (error) { res.status(500).json({ message: 'エラー' }); }
};

// ==========================================
// ★★★ 6. 管理者 (Admin) ★★★
// ==========================================

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // パスワードが環境変数と一致するか確認
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ message: '管理者パスワードが違います。' });
        }

        // DBから管理者ユーザー（あなたのメール）を探す
        const adminUser = await prisma.user.findUnique({
            where: { email: "takuminsitou946@gmail.com" }
        });

        if (!adminUser) {
            return res.status(404).json({ message: '管理者アカウントがシステムに見つかりません。' });
        }

        // あなたのIDを紐づけたADMINトークンを発行
        const token = jwt.sign(
            { 
                id: adminUser.id, 
                email: adminUser.email, 
                role: 'ADMIN',
                sub: adminUser.id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: '管理者として認証されました。',
            token: token
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: 'ログイン処理中にエラーが発生しました。' });
    }
};