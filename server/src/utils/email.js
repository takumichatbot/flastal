import { Resend } from 'resend';
import prisma from '../config/prisma.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'FLASTAL <noreply@flastal.com>';

// ★追加: データベースにない場合のデフォルトテンプレート定義
const DEFAULT_TEMPLATES = {
    'VERIFICATION_EMAIL': {
        subject: '【FLASTAL】メールアドレスの確認',
        body: '<p>{{userName}} 様</p><p>FLASTALにご登録ありがとうございます。</p><p>以下のリンクをクリックして、メールアドレスの認証を完了してください。</p><p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p><p>※このリンクの有効期限は1時間です。</p>'
    },
    'WELCOME': {
        subject: '【FLASTAL】登録完了のお知らせ',
        body: '<p>{{userName}} 様</p><p>会員登録が完了しました。これからFLASTALで推し活をお楽しみください！</p>'
    }
};

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
        // 1. DBからテンプレート取得を試みる
        const template = await prisma.emailTemplate.findUnique({
            where: { key: templateKey }
        });

        let subjectTemplate = '';
        let bodyTemplate = '';

        if (template) {
            // DBにあればそれを使う
            subjectTemplate = template.subject;
            bodyTemplate = template.body;
        } else {
            // 2. DBになければコード内のデフォルトを使う (ここが修正ポイント)
            const defaultTpl = DEFAULT_TEMPLATES[templateKey];
            if (defaultTpl) {
                console.log(`[Email Info] Using default template for key: ${templateKey}`);
                subjectTemplate = defaultTpl.subject;
                bodyTemplate = defaultTpl.body;
            } else {
                // デフォルトもなければ汎用メッセージ (最終手段)
                console.warn(`[Email Warning] Template not found for key: ${templateKey}. Using fallback.`);
                subjectTemplate = '【FLASTAL】お知らせ';
                // 変数がある場合はそれを表示するように変更
                bodyTemplate = '<p>通知が届きました。</p>';
                if (variables.message) {
                    bodyTemplate += '<p>{{message}}</p>';
                } else {
                    bodyTemplate += '<p>詳細をご確認ください。</p>';
                }
            }
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