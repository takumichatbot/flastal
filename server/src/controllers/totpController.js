import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from '../config/prisma.js';

// Step 1: 秘密鍵を生成してQRコードを返す
export const setupTotp = async (req, res) => {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { handleName: true, totpEnabled: true } });

    if (user.totpEnabled) {
        return res.status(400).json({ message: '2FAはすでに有効です' });
    }

    const secret = speakeasy.generateSecret({
        name: `FLASTAL (${user.handleName})`,
        issuer: 'FLASTAL',
    });

    // 秘密鍵をDBに一時保存（未確認状態）
    await prisma.user.update({
        where: { id: userId },
        data: { totpSecret: secret.base32 },
    });

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qrDataUrl, secret: secret.base32 });
};

// Step 2: TOTPトークンを検証して有効化
export const verifyTotp = async (req, res) => {
    const userId = req.user.id;
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'トークンを入力してください' });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true, totpEnabled: true } });
    if (!user?.totpSecret) return res.status(400).json({ message: '2FAセットアップが必要です' });

    const valid = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!valid) return res.status(400).json({ message: 'コードが正しくありません' });

    await prisma.user.update({
        where: { id: userId },
        data: { totpEnabled: true },
    });

    res.json({ message: '2FAを有効にしました' });
};

// 無効化
export const disableTotp = async (req, res) => {
    const userId = req.user.id;
    const { token } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true, totpEnabled: true } });
    if (!user?.totpEnabled) return res.status(400).json({ message: '2FAは有効ではありません' });

    const valid = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token,
        window: 1,
    });
    if (!valid) return res.status(400).json({ message: 'コードが正しくありません' });

    await prisma.user.update({
        where: { id: userId },
        data: { totpEnabled: false, totpSecret: null },
    });

    res.json({ message: '2FAを無効にしました' });
};

// ログイン時のTOTP検証（auth routeから呼ぶ）
export const validateTotpToken = (secret, token) => {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1,
    });
};
