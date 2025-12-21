import { Resend } from 'resend';
import prisma from '../config/prisma.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// 基本的なメール送信関数
export async function sendEmail(to, subject, htmlContent) {
    if (!to) return;
    try {
        const { data, error } = await resend.emails.send({
            from: 'FLASTAL <noreply@flastal.com>', // ★本番用に変更してください
            to: [to],
            subject: subject,
            html: htmlContent,
        });
        if (error) {
            console.error('Email send error:', error);
        } else {
            console.log(`Email sent to ${to}: ${subject}`);
        }
        return { data, error };
    } catch (err) {
        console.error('Email send exception:', err);
        return { error: err };
    }
}

// プレースホルダー置換関数
function replacePlaceholders(templateContent, data) {
    let replacedContent = templateContent;
    if (data.user) {
        replacedContent = replacedContent.replace(/\{user_name\}/g, data.user.handleName || 'ユーザー様');
        replacedContent = replacedContent.replace(/\{user_email\}/g, data.user.email || '');
    }
    if (data.florist) {
        replacedContent = replacedContent.replace(/\{florist_shop_name\}/g, data.florist.platformName || 'お花屋さん');
    }
    replacedContent = replacedContent.replace(/\{current_date\}/g, new Date().toLocaleDateString('ja-JP'));
    
    // 変数オブジェクトでの置換 ({{key}}形式対応)
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const value = data[key] !== undefined ? data[key] : '';
        replacedContent = replacedContent.replace(regex, value);
    });

    return replacedContent;
}

// テンプレートを使用した動的メール送信
export async function sendDynamicEmail(toEmail, templateKey, variables = {}) {
    const cleanToEmail = toEmail ? toEmail.trim() : '';
    if (!cleanToEmail) return false;

    try {
        const template = await prisma.emailTemplate.findUnique({
            where: { key: templateKey }
        });

        let subject = '【FLASTAL】お知らせ';
        let body = '<p>通知が届きました。</p>';

        if (template) {
            subject = template.subject;
            body = template.body;
        }

        // 変数置換
        // replacePlaceholders を拡張して使うか、ここ簡易的に置換
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const value = variables[key] !== undefined ? variables[key] : '';
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
        });
        
        // 既存の関数再利用も可だが、ここでは直接Resendを呼ぶ
         const { data, error } = await resend.emails.send({
            from: 'FLASTAL <noreply@flastal.com>',
            to: [cleanToEmail],
            subject: subject,
            html: body,
        });

        if (error) {
            console.error(`[Email Error] ${error.message}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error(`[Email Exception]`, error);
        return false;
    }
}