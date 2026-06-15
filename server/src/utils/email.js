import { Resend } from 'resend';
import prisma from '../config/prisma.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'FLASTAL <noreply@flastal.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.flastal.com';

// ── Branded HTML wrapper ──────────────────────────────────────
function createBaseHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#F7F7FA; font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif; color:#1e293b; }
    .wrap { max-width:580px; margin:0 auto; padding:32px 16px; }
    .card { background:#fff; border-radius:24px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
    .header { background:linear-gradient(135deg,#ec4899,#f43f5e); padding:28px 32px; text-align:center; }
    .header-logo { display:inline-block; font-size:13px; font-weight:900; letter-spacing:.25em; color:rgba(255,255,255,0.7); text-transform:uppercase; margin-bottom:4px; }
    .header-title { font-size:22px; font-weight:900; color:#fff; letter-spacing:-.02em; margin:0; }
    .body { padding:32px; }
    .greeting { font-size:15px; font-weight:700; color:#334155; margin-bottom:20px; }
    .message { font-size:14px; line-height:1.85; color:#475569; margin-bottom:24px; }
    .highlight { background:#fdf2f8; border:1px solid #fce7f3; border-radius:16px; padding:20px 24px; margin-bottom:24px; }
    .highlight-label { font-size:10px; font-weight:900; letter-spacing:.15em; text-transform:uppercase; color:#ec4899; margin-bottom:6px; }
    .highlight-value { font-size:18px; font-weight:900; color:#1e293b; }
    .cta { text-align:center; margin:28px 0; }
    .btn { display:inline-block; background:linear-gradient(135deg,#ec4899,#f43f5e); color:#fff!important; text-decoration:none!important; font-size:14px; font-weight:900; padding:14px 32px; border-radius:100px; box-shadow:0 4px 12px rgba(236,72,153,0.3); }
    .divider { height:1px; background:#f1f5f9; margin:24px 0; }
    .footer { padding:20px 32px; background:#f8fafc; text-align:center; border-top:1px solid #f1f5f9; }
    .footer-text { font-size:11px; color:#94a3b8; line-height:1.7; }
    .footer-link { color:#ec4899!important; text-decoration:none; font-weight:700; }
    @media (max-width:480px) {
      .body { padding:20px; }
      .header { padding:20px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <div class="header-logo">FLASTAL</div>
        <h1 class="header-title">${title}</h1>
      </div>
      <div class="body">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p class="footer-text">
          このメールは <a href="${APP_URL}" class="footer-link">FLASTAL</a> から自動送信されています。<br/>
          心当たりがない場合はこのメールを無視してください。<br/>
          © ${new Date().getFullYear()} FLASTAL. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Default templates (DB優先、fallback) ──────────────────────
const DEFAULT_TEMPLATES = {
  'VERIFICATION_EMAIL': {
    subject: '【FLASTAL】メールアドレスの確認',
    body: createBaseHtml('メールアドレスの確認', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">FLASTALにご登録ありがとうございます。<br/>以下のボタンをクリックして、メールアドレスの認証を完了してください。</p>
      <div class="cta"><a href="{{verificationUrl}}" class="btn">メールアドレスを確認する</a></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">リンクの有効期限は1時間です。</p>
    `),
  },
  'WELCOME': {
    subject: '【FLASTAL】ようこそ！登録が完了しました',
    body: createBaseHtml('ようこそ、FLASTALへ 🌸', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">会員登録が完了しました！<br/>推しへのフラスタ企画を始めましょう。</p>
      <div class="cta"><a href="${APP_URL}/projects" class="btn">企画を探す</a></div>
    `),
  },
  'PROJECT_SUBMITTED': {
    subject: '【FLASTAL】企画申請を受け付けました',
    body: createBaseHtml('企画申請を受け付けました ✅', `
      <p class="greeting">{{plannerName}} 様</p>
      <p class="message">企画の申請を受け付けました。運営チームが審査を行います。通常1〜2営業日以内に結果をお知らせします。</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}" class="btn">企画ページを確認する</a></div>
    `),
  },
  'PLEDGE_RECEIVED': {
    subject: '【FLASTAL】{{projectTitle}} に支援が届きました！',
    body: createBaseHtml('支援が届きました 💖', `
      <p class="greeting">{{plannerName}} 様</p>
      <p class="message">あなたの企画に新しい支援が届きました！</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">支援金額</div>
        <div class="highlight-value">¥{{amount}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}" class="btn">企画ページを確認する</a></div>
    `),
  },
  'PLEDGE_COMPLETED': {
    subject: '【FLASTAL】{{projectTitle}} への支援が完了しました',
    body: createBaseHtml('支援ありがとうございます 🌸', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">以下の企画への支援が完了しました。ありがとうございます！</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">支援金額</div>
        <div class="highlight-value">¥{{amount}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}" class="btn">企画の進捗を見る</a></div>
    `),
  },
  'PROJECT_FUNDED': {
    subject: '🎉 【FLASTAL】{{projectTitle}} が目標達成しました！',
    body: createBaseHtml('目標達成おめでとうございます 🎉', `
      <p class="greeting">{{plannerName}} 様</p>
      <p class="message">企画が目標金額を達成しました！お花屋さんへのオファーを出して、フラスタ制作を進めましょう。</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">達成金額</div>
        <div class="highlight-value">¥{{collectedAmount}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/florists?projectId={{projectId}}" class="btn">お花屋さんを探す</a></div>
    `),
  },
  'OFFER_RECEIVED': {
    subject: '【FLASTAL】新しい制作オファーが届きました',
    body: createBaseHtml('新着オファー 🌷', `
      <p class="greeting">{{floristName}} 様</p>
      <p class="message">新しいフラスタ制作オファーが届いています。ダッシュボードから確認してください。</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">イベント日</div>
        <div class="highlight-value">{{eventDate}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/florists/dashboard" class="btn">ダッシュボードで確認する</a></div>
    `),
  },
  'OFFER_ACCEPTED': {
    subject: '【FLASTAL】オファーが受諾されました！',
    body: createBaseHtml('オファー受諾のお知らせ 🌸', `
      <p class="greeting">{{plannerName}} 様</p>
      <p class="message">お花屋さんがオファーを受諾しました！チャットで制作の詳細を相談しましょう。</p>
      <div class="highlight">
        <div class="highlight-label">お花屋さん</div>
        <div class="highlight-value">{{floristName}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/chat" class="btn">チャットを開く</a></div>
    `),
  },
  'OFFER_DECLINED': {
    subject: '【FLASTAL】オファーが辞退されました',
    body: createBaseHtml('オファー辞退のお知らせ', `
      <p class="greeting">{{plannerName}} 様</p>
      <p class="message">残念ながら、お花屋さんがオファーを辞退しました。他のお花屋さんへオファーを出してみましょう。</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/florists" class="btn">他のお花屋さんを探す</a></div>
    `),
  },
  'PROJECT_COMPLETED': {
    subject: '【FLASTAL】企画が完了しました！',
    body: createBaseHtml('企画完了のご報告 🌺', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">あなたが支援した企画が無事に完了しました。ご協力ありがとうございました！</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}" class="btn">完了レポートを見る</a></div>
    `),
  },
  'PASSWORD_RESET': {
    subject: '【FLASTAL】パスワードの再設定',
    body: createBaseHtml('パスワード再設定', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">パスワード再設定のリクエストを受け付けました。以下のボタンをクリックして新しいパスワードを設定してください。</p>
      <div class="cta"><a href="{{resetLink}}" class="btn">パスワードを再設定する</a></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">リンクの有効期限は24時間です。このリクエストに心当たりがない場合は無視してください。</p>
    `),
  },
};

// ── Core send functions ───────────────────────────────────────
export async function sendEmail(to, subject, htmlContent) {
  const cleanTo = to?.trim();
  if (!cleanTo) return { error: 'No recipient email provided' };
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [cleanTo],
      subject,
      html: htmlContent,
    });
    if (error) console.error('[Email Error]', error);
    else console.log(`[Email] Sent to ${cleanTo}: ${subject}`);
    return { data, error };
  } catch (err) {
    console.error('[Email Exception]', err);
    return { error: err };
  }
}

function applyVariables(content, variables) {
  let result = content;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] !== undefined ? variables[key] : '');
  });
  result = result.replace(/\{current_date\}/g, new Date().toLocaleDateString('ja-JP'));
  return result;
}

export async function sendDynamicEmail(toEmail, templateKey, variables = {}) {
  const cleanTo = toEmail?.trim();
  if (!cleanTo) {
    console.warn(`[Email] Empty address for template: ${templateKey}`);
    return false;
  }
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { key: templateKey } });
    const tpl = template || DEFAULT_TEMPLATES[templateKey];

    if (!tpl) {
      console.warn(`[Email] No template found for key: ${templateKey}`);
      return false;
    }

    const finalSubject = applyVariables(tpl.subject, variables);
    const finalBody = applyVariables(tpl.body, variables);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [cleanTo],
      subject: finalSubject,
      html: finalBody,
    });

    if (error) {
      console.error(`[Email Error] ${templateKey} → ${cleanTo}:`, error);
      return false;
    }
    console.log(`[Email] ${templateKey} → ${cleanTo}`);
    return true;
  } catch (err) {
    console.error(`[Email Exception] ${templateKey} → ${cleanTo}:`, err);
    return false;
  }
}

// ── Convenience wrappers ──────────────────────────────────────
export const sendBrandedEmail = (to, title, bodyHtml) =>
  sendEmail(to, title, createBaseHtml(title, bodyHtml));
