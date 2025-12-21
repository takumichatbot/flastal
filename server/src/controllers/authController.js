import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendDynamicEmail, sendEmail } from '../utils/email.js'; // utilsからインポート

// ==========================================
// ★★★ 共通ヘルパー: トークン発行 ★★★
// ==========================================
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// ==========================================
// ★★★ 1. 一般ユーザー (User) ★★★
// ==========================================

// ユーザー登録
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

        // 紹介コード処理
        if (referralCode && referralCode.trim() !== '') {
            const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.trim() } });
            if (referrer) {
                userData.referredById = referrer.id;
            }
        }

        await prisma.user.create({ data: userData });

        // メール送信
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

// ユーザーログイン
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(404).json({ message: 'ユーザーが見つかりません。' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'パスワードが間違っています。' });

        if (user.isVerified === false) {
            return res.status(403).json({ message: 'メールアドレスの認証が完了していません。届いたメールを確認してください。' });
        }

        let userRole = user.role;
        
        // ★ デバッグ用管理者昇格ロジック (運用時は注意)
        const ADMIN_EMAILS = ["takuminsitou946@gmail.com", "hana87kaori@gmail.com"];
        if (ADMIN_EMAILS.includes(user.email)) {
            userRole = 'ADMIN';
            console.log(`[ADMIN DEBUG] User ${user.email} forcefully assigned ADMIN role.`);
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            handleName: user.handleName,
            role: userRole,
            iconUrl: user.iconUrl,
            referralCode: user.referralCode,
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

// 花屋登録
export const registerFlorist = async (req, res) => {
    try {
        const { email, password, shopName, contactName, platformName } = req.body;

        const existing = await prisma.florist.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: '既に使用されています。' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await prisma.florist.create({
            data: {
                email,
                password: hashedPassword,
                shopName,
                platformName,
                contactName,
                status: 'PENDING', // 運営承認待ち
                isVerified: false, // メール認証待ち
                verificationToken,
            },
        });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', {
            userName: platformName,
            verificationUrl: verificationUrl
        });

        res.status(201).json({ message: '確認メールを送信しました。リンクをクリックして申請を完了させてください。' });
    } catch (error) {
        console.error('Florist登録エラー:', error);
        res.status(500).json({ message: 'エラーが発生しました。' });
    }
};

// 花屋ログイン
export const loginFlorist = async (req, res) => {
    try {
        const { email, password } = req.body;
        const florist = await prisma.florist.findUnique({ where: { email } });

        if (!florist) return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います。' });

        const isPasswordValid = await bcrypt.compare(password, florist.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います。' });

        if (!florist.isVerified) {
            return res.status(403).json({ message: 'メールアドレスの認証が完了していません。' });
        }

        if (florist.status !== 'APPROVED') {
            return res.status(403).json({
                message: florist.status === 'REJECTED'
                    ? 'このアカウントは利用が許可されませんでした。'
                    : '現在、運営による審査中です。承認をお待ちください。'
            });
        }

        const tokenPayload = {
            id: florist.id,
            email: florist.email,
            role: 'FLORIST',
            shopName: florist.shopName,
            iconUrl: florist.iconUrl,
            sub: florist.id
        };

        const token = generateToken(tokenPayload);

        // パスワードを除外して返す
        const { password: _, ...floristWithoutPassword } = florist;
        res.status(200).json({
            message: 'ログインに成功しました。',
            token: token,
            florist: floristWithoutPassword,
        });

    } catch (error) {
        console.error('お花屋さんログインエラー:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 3. 会場 (Venue) ★★★
// ==========================================

// 会場登録
export const registerVenue = async (req, res) => {
    try {
        const { email, password, venueName } = req.body;

        const existing = await prisma.venue.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await prisma.venue.create({
            data: {
                email,
                password: hashedPassword,
                venueName,
                status: 'PENDING',
                isVerified: false,
                verificationToken: verificationToken,
            },
        });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', {
            userName: venueName,
            verificationUrl: verificationUrl
        });

        res.status(201).json({ message: '確認メールを送信しました。リンクをクリックして申請を完了させてください。' });

    } catch (error) {
        console.error('Venue登録エラー:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// 会場ログイン
export const loginVenue = async (req, res) => {
    try {
        const { email, password } = req.body;
        const venue = await prisma.venue.findUnique({ where: { email } });

        if (!venue) return res.status(404).json({ message: '会場が見つかりません。' });
        
        const isPasswordValid = await bcrypt.compare(password, venue.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'パスワードが間違っています。' });
        
        if (!venue.isVerified) {
            return res.status(403).json({ message: 'メールアドレスの認証が完了していません。' });
        }

        if (venue.status !== 'APPROVED') {
            return res.status(403).json({ message: '現在、運営による審査中です。' });
        }

        const tokenPayload = {
            id: venue.id,
            email: venue.email,
            role: 'VENUE',
            venueName: venue.venueName,
            status: venue.status,
            sub: venue.id
        };

        const token = generateToken(tokenPayload);

        const { password: _, ...venueWithoutPassword } = venue;
        res.status(200).json({
            message: 'ログインに成功しました。',
            token: token,
            venue: venueWithoutPassword,
        });
    } catch (error) {
        console.error('会場ログインエラー:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 4. 主催者 (Organizer) ★★★
// ==========================================

// 主催者登録
export const registerOrganizer = async (req, res) => {
    try {
        const { email, password, name, website } = req.body;

        const existing = await prisma.organizer.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: 'このメールアドレスは既に使用されています。' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await prisma.organizer.create({
            data: {
                email,
                password: hashedPassword,
                name,
                website,
                status: 'PENDING',
                isVerified: false,
                verificationToken: verificationToken,
            },
        });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', {
            userName: name,
            verificationUrl: verificationUrl
        });

        res.status(201).json({ message: '確認メールを送信しました。リンクをクリックして申請を完了させてください。' });

    } catch (error) {
        console.error('Organizer登録エラー:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました。' });
    }
};

// 主催者ログイン
export const loginOrganizer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const organizer = await prisma.organizer.findUnique({ where: { email } });

        if (!organizer) return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います。' });

        const isValid = await bcrypt.compare(password, organizer.password);
        if (!isValid) return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います。' });

        if (!organizer.isVerified) {
            return res.status(403).json({ message: 'メールアドレスの認証が完了していません。' });
        }

        if (organizer.status !== 'APPROVED') {
            return res.status(403).json({
                message: organizer.status === 'REJECTED'
                    ? 'このアカウントは利用が許可されませんでした。'
                    : 'アカウントは現在審査中です。運営による承認をお待ちください。'
            });
        }

        const token = jwt.sign(
            {
                id: organizer.id,
                email: organizer.email,
                role: 'ORGANIZER',
                name: organizer.name,
                handleName: organizer.name,
                status: organizer.status,
                sub: organizer.id
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ message: 'ログイン成功', token });
    } catch (error) {
        console.error("Organizer login error:", error);
        res.status(500).json({ message: 'ログイン処理中にエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 5. 共通認証機能 (Verify, Resend, Reset) ★★★
// ==========================================

// メール認証完了 (全ロール共通)
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'トークンがありません' });

        let userType = null;
        let record = null;

        // Userを探す
        record = await prisma.user.findFirst({ where: { verificationToken: token } });
        if (record) userType = 'user';

        // いなければFloristを探す
        if (!record) {
            record = await prisma.florist.findFirst({ where: { verificationToken: token } });
            if (record) userType = 'florist';
        }

        // いなければVenueを探す
        if (!record) {
            record = await prisma.venue.findFirst({ where: { verificationToken: token } });
            if (record) userType = 'venue';
        }

        // いなければOrganizerを探す
        if (!record) {
            record = await prisma.organizer.findFirst({ where: { verificationToken: token } });
            if (record) userType = 'organizer';
        }

        if (!record) {
            return res.status(400).json({ message: '無効なトークンか、既に期限切れです' });
        }

        // 動的にテーブルを指定して更新
        await prisma[userType].update({
            where: { id: record.id },
            data: {
                isVerified: true,
                verificationToken: null,
            },
        });

        res.json({ message: '認証成功！登録が完了しました。' });

    } catch (error) {
        console.error("認証エラー:", error);
        res.status(500).json({ message: '認証処理に失敗しました' });
    }
};

// 認証メール再送信
export const resendVerification = async (req, res) => {
    const { email, userType } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'メールアドレスが必要です。' });
    }

    try {
        let targetModel = null;
        let account = null;

        if (userType === 'FLORIST') {
            account = await prisma.florist.findUnique({ where: { email } });
            targetModel = 'florist';
        } else if (userType === 'VENUE') {
            account = await prisma.venue.findUnique({ where: { email } });
            targetModel = 'venue';
        } else if (userType === 'ORGANIZER') {
            account = await prisma.organizer.findUnique({ where: { email } });
            targetModel = 'organizer';
        } else {
            account = await prisma.user.findUnique({ where: { email } });
            targetModel = 'user';
        }

        if (!account) {
            return res.status(404).json({ message: 'そのメールアドレスの登録が見つかりません。' });
        }
        if (account.isVerified) {
            return res.status(400).json({ message: 'このアカウントは既に認証済みです。' });
        }

        const newToken = crypto.randomBytes(32).toString('hex');

        await prisma[targetModel].update({
            where: { id: account.id },
            data: { verificationToken: newToken }
        });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${newToken}`;
        const userName = account.handleName || account.platformName || account.venueName || account.name || 'お客様';

        await sendDynamicEmail(email, 'VERIFICATION_EMAIL', {
            userName: userName,
            verificationUrl: verificationUrl
        });

        res.status(200).json({ message: '認証メールを再送信しました。' });

    } catch (error) {
        console.error("再送信エラー:", error);
        res.status(500).json({ message: 'メールの再送信に失敗しました。' });
    }
};

// パスワード再設定リクエスト (Forgot Password)
export const forgotPassword = async (req, res) => {
    const { email, userType } = req.body;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
        let user = null;
        if (userType === 'USER') {
            user = await prisma.user.findUnique({ where: { email } });
        } else if (userType === 'FLORIST') {
            user = await prisma.florist.findUnique({ where: { email } });
        } else if (userType === 'VENUE') {
            user = await prisma.venue.findUnique({ where: { email } });
        } else if (userType === 'ORGANIZER') {
            user = await prisma.organizer.findUnique({ where: { email } });
        }

        if (user) {
            const token = jwt.sign(
                { id: user.id, type: userType },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const resetLink = `${frontendUrl}/reset-password/${token}`;

            // 本文はutils/email.jsにある sendDynamicEmail を使っても良いが、
            // 元コードがHTML直書きだったので、sendEmailを直接使用
            await sendEmail(email, '【FLASTAL】パスワード再設定のご案内', `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0ea5e9;">FLASTAL パスワード再設定</h2>
                <p>以下のボタンをクリックして、新しいパスワードを設定してください。このリンクは1時間有効です。</p>
                <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; font-size: 16px; color: white; background-color: #0ea5e9; text-decoration: none; border-radius: 8px;">パスワードを再設定する</a>
            </div>
            `);
            
            console.log(`パスワード再設定メールを ${email} に送信しました。`);
        } else {
            console.log(`パスワード再設定リクエスト受信（未登録）: ${email}`);
        }

        res.status(200).json({ message: 'ご入力いただいたメールアドレスに、パスワード再設定用のリンクを送信しました。' });

    } catch (error) {
        console.error("パスワード再設定リクエストAPIで予期せぬエラー:", error);
        res.status(500).json({ message: '処理中にエラーが発生しました。' });
    }
};

// パスワードリセット実行
export const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, type } = decoded;

        const hashedPassword = await bcrypt.hash(password, 10);

        if (type === 'USER') {
            await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
        } else if (type === 'FLORIST') {
            await prisma.florist.update({ where: { id }, data: { password: hashedPassword } });
        } else if (type === 'VENUE') {
            await prisma.venue.update({ where: { id }, data: { password: hashedPassword } });
        } else if (type === 'ORGANIZER') {
            await prisma.organizer.update({ where: { id }, data: { password: hashedPassword } });
        } else {
            throw new Error('無効なユーザータイプです。');
        }

        res.status(200).json({ message: 'パスワードが正常に更新されました。' });
    } catch (error) {
        console.error("パスワードリセットエラー:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'このリンクは有効期限が切れています。もう一度やり直してください。' });
        }
        res.status(500).json({ message: 'パスワードの更新中にエラーが発生しました。' });
    }
};

// ==========================================
// ★★★ 6. 管理者 (Admin) ★★★
// ==========================================

// 管理者ログイン
export const loginAdmin = (req, res) => {
    const { password } = req.body;
    
    // 環境変数のパスワードと一致するか確認
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { role: 'ADMIN', sub: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: '管理者として認証されました。',
            token: token
        });
    } else {
        res.status(401).json({ message: 'パスワードが違います。' });
    }
};