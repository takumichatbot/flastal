import { Resend } from 'resend';
import prisma from '../config/prisma.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'FLASTAL <noreply@flastal.com>';

// 基本的なメール送信関数
export async function sendEmail(to, subject, htmlContent) {
    const cleanTo = to ? to.trim() : '';
    if (!cleanTo) return { error: 'No recipient email provided' };

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [cleanTo],
            subject: subject,
            html: htmlContent,
        });

        if (error) {
            console.error('[Email Error] Resend reported error:', error);
            return { data, error };
        }

        console.log(`[Email Success] Sent to ${cleanTo}: ${subject}`);
        return { data, error: null };
    } catch (err) {
        console.error('[Email Exception] sendEmail failed:', err);
        return { error: err };
    }
}

/**
 * プレースホルダー置換内部関数
 */
function applyVariables(content, variables) {
    let result = content;
    
    // 変数オブジェクトでの置換 ({{key}}形式)
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const value = variables[key] !== undefined ? variables[key] : '';
        result = result.replace(regex, value);
    });

    // 共通タグの置換
    result = result.replace(/\{current_date\}/g, new Date().toLocaleDateString('ja-JP'));

    return result;
}

// テンプレートを使用した動的メール送信
export async function sendDynamicEmail(toEmail, templateKey, variables = {}) {
    const cleanToEmail = toEmail ? toEmail.trim() : '';
    if (!cleanToEmail) {
        console.warn(`[Email Warning] Attempted to send dynamic email to empty address. Key: ${templateKey}`);
        return false;
    }

    try {
        // DBからテンプレート取得
        const template = await prisma.emailTemplate.findUnique({
            where: { key: templateKey }
        });

        // テンプレートがない場合のデフォルト設定
        let subjectTemplate = '【FLASTAL】お知らせ';
        let bodyTemplate = '<p>通知が届きました。</p><p>{{message}}</p>';

        if (template) {
            subjectTemplate = template.subject;
            bodyTemplate = template.body;
        } else {
            console.warn(`[Email Warning] Template not found for key: ${templateKey}. Using fallback.`);
        }

        // 変数置換の実行
        const finalSubject = applyVariables(subjectTemplate, variables);
        const finalBody = applyVariables(bodyTemplate, variables);
        
        // 送信実行
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [cleanToEmail],
            subject: finalSubject,
            html: finalBody,
        });

        if (error) {
            console.error(`[Email Error] sendDynamicEmail failed for ${cleanToEmail}: ${error.message}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`[Email Exception] sendDynamicEmail exception for ${cleanToEmail}:`, error);
        return false;
    }
}