import { Resend } from 'resend';
import prisma from '../config/prisma.js';
import { logger } from './logger.js';

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
    subject: '【FLASTAL】✉️ メールアドレスの確認',
    body: createBaseHtml('メールアドレスの確認', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">FLASTALにご登録ありがとうございます。<br/>以下のボタンをクリックして、メールアドレスの認証を完了してください。</p>
      <div class="cta"><a href="{{verificationUrl}}" class="btn">メールアドレスを確認する</a></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">リンクの有効期限は1時間です。</p>
    `),
  },
  'WELCOME': {
    subject: '【FLASTAL】🌸 ようこそ！登録が完了しました',
    body: createBaseHtml('ようこそ、FLASTALへ 🌸', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">会員登録が完了しました！<br/>推しへのフラスタ企画を始めましょう。</p>
      <div class="cta"><a href="${APP_URL}/projects" class="btn">企画を探す</a></div>
    `),
  },
  'PROJECT_SUBMITTED': {
    subject: '【FLASTAL】✅ 企画申請を受け付けました',
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
    subject: '【FLASTAL】💖 {{projectTitle}} に支援が届きました！',
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
    subject: '【FLASTAL】🌸 {{projectTitle}} への支援が完了しました',
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
    subject: '【FLASTAL】🌷 新しい制作オファーが届きました',
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
    subject: '【FLASTAL】🌸 オファーが受諾されました！',
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
    subject: '【FLASTAL】😔 オファーが辞退されました',
    body: createBaseHtml('オファー辞退のお知らせ', `
      <p class="greeting">{{plannerName}} 様</p>
      <p class="message">残念ながら、<strong>{{floristName}}</strong>がオファーを辞退しました。他のお花屋さんへオファーを出してみましょう。</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      {{declinationReasonBlock}}
      <div class="cta"><a href="{{searchUrl}}" class="btn">他のお花屋さんを探す</a></div>
    `),
  },
  'PROJECT_COMPLETED': {
    subject: '【FLASTAL】🌺 企画が完了しました！',
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
  'PROJECT_COMPLETED_BACKER': {
    subject: '🌸【FLASTAL】フラスタが完成しました！参加証明書のご案内',
    body: createBaseHtml('フラスタが完成しました！ 🌸', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">あなたが支援してくださったフラスタ企画が、無事に完成しました！<br>温かいご支援、本当にありがとうございました。</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <p class="message">完成写真や企画者からのメッセージは、企画ページよりご確認いただけます。<br>また、あなたの参加を証明する<strong>「参加証明書」</strong>をダウンロードすることができます。</p>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}?completed=1&pledgeId={{pledgeId}}" class="btn">参加証明書をダウンロード</a></div>
      <div class="divider"></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">このメールはFLASTALから自動送信されています。</p>
    `),
  },
  'POINTS_CHARGED': {
    subject: '【FLASTAL】💎 ポイントチャージが完了しました',
    body: createBaseHtml('ポイントチャージ完了 💎', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">ポイントチャージが完了しました。さっそく気になる企画を支援してみましょう！</p>
      <div class="highlight">
        <div class="highlight-label">チャージポイント</div>
        <div class="highlight-value">{{points}} pt</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects" class="btn">企画一覧を見る</a></div>
    `),
  },
  'PASSWORD_RESET': {
    subject: '【FLASTAL】🔑 パスワードの再設定',
    body: createBaseHtml('パスワード再設定', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">パスワード再設定のリクエストを受け付けました。以下のボタンをクリックして新しいパスワードを設定してください。</p>
      <div class="cta"><a href="{{resetLink}}" class="btn">パスワードを再設定する</a></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">リンクの有効期限は24時間です。このリクエストに心当たりがない場合は無視してください。</p>
    `),
  },
  'GROUP_BUY_REFUNDED': {
    subject: '【FLASTAL】グループ購入が成立しませんでした（返金のお知らせ）',
    body: createBaseHtml('グループ購入 返金のお知らせ', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">参加いただいたグループ購入が、締切までに目標口数に達しなかったため不成立となりました。</p>
      <div class="highlight">
        <div class="highlight-label">グループ購入</div>
        <div class="highlight-value">{{groupBuyTitle}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">対象企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">返金金額</div>
        <div class="highlight-value">¥{{amount}}</div>
      </div>
      <p class="message">ご参加の決済分は全額返金いたします。通常2〜5営業日以内にカード会社を通じて返金されますので、今しばらくお待ちください。</p>
      <p class="message">ご不明な点はFLASTALサポートまでお問い合わせください。引き続きFLASTALをよろしくお願いいたします。</p>
      <div class="cta"><a href="${APP_URL}/projects" class="btn">他の企画を見る</a></div>
    `),
  },
  'FRAUD_ALERT': {
    subject: '【FLASTAL緊急】不正検出アラート',
    body: createBaseHtml('不正検出アラート', `
      <p class="greeting">FLASTAL 管理者様</p>
      <p class="message" style="color:#dc2626;font-weight:700;">不正行為の疑いがある支援が検出されました。管理画面で確認してください。</p>
      <div class="highlight">
        <div class="highlight-label">検出タイプ</div>
        <div class="highlight-value">{{type}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">詳細</div>
        <div class="highlight-value">{{description}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">ユーザーID</div>
        <div class="highlight-value">{{userId}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">企画ID</div>
        <div class="highlight-value">{{projectId}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/admin/fraud" class="btn">管理画面で確認する</a></div>
    `),
  },
  'SHOP_ORDER_CONFIRMED': {
    subject: '【FLASTAL Shop】ご注文を受け付けました（注文番号: {{orderId}}）',
    body: createBaseHtml('ご注文を受け付けました', `
      <p class="greeting">{{shopName}} 様</p>
      <p class="message">FLASTAL Shopにてご注文を受け付けました。内容をご確認ください。</p>
      <div class="highlight">
        <div class="highlight-label">注文番号</div>
        <div class="highlight-value">#{{orderId}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">合計金額（税・送料込）</div>
        <div class="highlight-value">¥{{total}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">商品点数</div>
        <div class="highlight-value">{{itemCount}} 点</div>
      </div>
      <p class="message">発送準備が整い次第、発送通知をお送りします。ご不明な点はFLASTALサポートまでお問い合わせください。</p>
      <div class="cta"><a href="${APP_URL}/shop/orders" class="btn">注文履歴を確認する</a></div>
    `),
  },
  'EMAIL_CHANGE_CONFIRM': {
    subject: '【FLASTAL】メールアドレス変更の確認',
    body: createBaseHtml('メールアドレス変更の確認', `
      <p class="greeting">FLASTALをご利用いただきありがとうございます。</p>
      <p class="message">以下のメールアドレスへの変更リクエストを受け付けました。</p>
      <div class="highlight">
        <div class="highlight-label">新しいメールアドレス</div>
        <div class="highlight-value">{{newEmail}}</div>
      </div>
      <p class="message">以下のボタンをクリックして、メールアドレスの変更を確定してください。</p>
      <div class="cta"><a href="{{confirmUrl}}" class="btn">メールアドレスを確認する</a></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">このリンクの有効期限は24時間です。心当たりがない場合はこのメールを無視してください。</p>
    `),
  },
  'PROJECT_UPDATE_POSTED': {
    subject: '【FLASTAL】「{{projectTitle}}」に新しい制作レポートが届きました',
    body: createBaseHtml('新着制作レポート 📣', `
      <p class="greeting">{{handleName}} さん</p>
      <p class="message">あなたが支援している企画に新しいアップデートが投稿されました！</p>
      <div class="highlight">
        <div class="highlight-label">企画</div>
        <div class="highlight-value">{{projectTitle}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">アップデート</div>
        <div class="highlight-value">{{updateTitle}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}?tab=updates" class="btn">詳細を見る</a></div>
      <div class="divider"></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">このメールはFLASTALから自動送信されています。</p>
    `),
  },
  'NOTIFICATION_DIGEST': {
    subject: '【FLASTAL】昨日の未読通知まとめ ({{count}}件)',
    body: createBaseHtml('未読通知ダイジェスト', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">昨日の未読通知が <strong>{{count}}件</strong> あります。以下をご確認ください。</p>
      {{notificationList}}
      <div class="divider"></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">
        通知設定は <a href="${APP_URL}/mypage/settings" style="color:#ec4899;text-decoration:none;font-weight:700;">こちらから変更できます</a>
      </p>
      <div class="cta"><a href="${APP_URL}/notifications" class="btn">全ての通知を見る</a></div>
    `),
  },
  'PROJECT_STATUS_UPDATE': {
    subject: '【FLASTAL】「{{projectTitle}}」の制作進捗が更新されました',
    body: createBaseHtml('制作進捗アップデート 📣', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">あなたが支援したプロジェクト「<strong>{{projectTitle}}</strong>」の制作進捗が更新されました。</p>
      <div class="highlight">
        <div class="highlight-label">現在の状況</div>
        <div class="highlight-value">{{statusLabel}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}" class="btn">詳細を確認する</a></div>
      <div class="divider"></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">このメールはFLASTALから自動送信されています。</p>
    `),
  },
  'PAYOUT_APPROVED': {
    subject: '【FLASTAL】出金申請が承認されました',
    body: createBaseHtml('出金申請 承認のお知らせ 💰', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">出金申請が承認されました。振込は3〜5営業日以内に処理されます。</p>
      <div class="highlight">
        <div class="highlight-label">承認金額</div>
        <div class="highlight-value">¥{{amount}}</div>
      </div>
      <p class="message">ご不明な点はFLASTALサポートまでお問い合わせください。</p>
      <div class="cta"><a href="${APP_URL}/florists/dashboard" class="btn">ダッシュボードを確認する</a></div>
    `),
  },
  'PAYOUT_REJECTED': {
    subject: '【FLASTAL】出金申請が却下されました',
    body: createBaseHtml('出金申請 却下のお知らせ', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">出金申請が却下されました。内容をご確認ください。</p>
      <div class="highlight">
        <div class="highlight-label">対象金額</div>
        <div class="highlight-value">¥{{amount}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">却下理由</div>
        <div class="highlight-value">{{reason}}</div>
      </div>
      <p class="message">ご不明な点はFLASTALサポートまでお問い合わせください。</p>
      <div class="cta"><a href="${APP_URL}/florists/dashboard" class="btn">ダッシュボードを確認する</a></div>
    `),
  },
  'BROADCAST_MESSAGE': {
    subject: '【{{projectTitle}}】{{subject}}',
    body: createBaseHtml('{{subject}}', `
      <p class="greeting">{{userName}} 様</p>
      <p class="message">支援いただいている企画「{{projectTitle}}」の企画者からメッセージが届いています。</p>
      <div class="highlight">
        <div class="highlight-label">メッセージ</div>
        <div style="font-size:14px;line-height:1.85;color:#374151;margin-top:8px;">{{message}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/projects/{{projectId}}" class="btn">企画ページを見る</a></div>
      <div class="divider"></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">
        このメールは「{{projectTitle}}」の支援者向けにお送りしています。
      </p>
    `),
  },
  'PLEDGE_COMPLETED_GUEST': {
    subject: '【FLASTAL】🌸 {{projectTitle}} への支援ありがとうございます！',
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
      <div class="divider"></div>
      <div style="background:#fff0f6;border-radius:12px;padding:20px;margin-top:8px;">
        <h3 style="color:#e05080;font-size:15px;margin:0 0 8px;">アカウント登録でもっとお得に！</h3>
        <ul style="color:#555;font-size:13px;margin:0;padding-left:18px;line-height:2;">
          <li>支援するたびにポイントが貯まる</li>
          <li>お気に入りのプロジェクトをフォロー</li>
          <li>新着プロジェクトを通知で受け取る</li>
        </ul>
        <div style="text-align:center;margin-top:14px;">
          <a href="{{registerUrl}}" style="display:inline-block;background:#e05080;color:#fff;padding:10px 24px;border-radius:24px;font-weight:bold;text-decoration:none;font-size:13px;">
            無料でアカウント作成 →
          </a>
        </div>
      </div>
    `),
  },
  'WEBHOOK_DLQ_ALERT': {
    subject: '【FLASTAL緊急】Webhookの処理に繰り返し失敗しています',
    body: createBaseHtml('Webhook DLQ アラート', `
      <p class="greeting">FLASTAL 管理者様</p>
      <p class="message" style="color:#dc2626;font-weight:700;">Webhookイベントが最大リトライ回数に達し、デッドレターキュー（DLQ）に移行されました。手動での確認・対応が必要です。</p>
      <div class="highlight">
        <div class="highlight-label">イベントID</div>
        <div class="highlight-value">{{eventId}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">イベントタイプ</div>
        <div class="highlight-value">{{eventType}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">エラー内容</div>
        <div class="highlight-value" style="font-size:13px;word-break:break-all;">{{error}}</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">リトライ回数</div>
        <div class="highlight-value">{{retryCount}} 回</div>
      </div>
      <div class="highlight">
        <div class="highlight-label">発生日時</div>
        <div class="highlight-value">{{createdAt}}</div>
      </div>
      <div class="cta"><a href="${APP_URL}/admin" class="btn">管理画面で確認する</a></div>
      <div class="divider"></div>
      <p class="message" style="font-size:12px;color:#94a3b8;text-align:center;">
        このアラートはFLASTALシステムから自動送信されています。
      </p>
    `),
  },
};

// ── Core send functions ───────────────────────────────────────

/**
 * 指数バックオフ付きリトライでメール送信する内部ヘルパー。
 * 最大 retries 回までリトライし、全試行失敗時は err を throw する。
 * @param {string} cleanTo   - 送信先アドレス（trim済み）
 * @param {string} subject   - 件名
 * @param {string} html      - HTML本文
 * @param {number} retries   - 最大リトライ回数（デフォルト: 2）
 */
async function sendEmailWithRetry(cleanTo, subject, html, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [cleanTo],
        subject,
        html,
      });
      if (error) {
        // Resend が API エラーを例外ではなくエラーオブジェクトで返す場合
        throw Object.assign(new Error(JSON.stringify(error)), { resendError: error });
      }
      return { data, error: null };
    } catch (err) {
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        logger.error('Email send failed after retries', {
          to: cleanTo,
          subject,
          attempt: attempt + 1,
          error: err.message,
        });
        throw err;
      }
      // 指数バックオフ: 1s → 2s
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn('Email send failed, retrying', {
        to: cleanTo,
        attempt: attempt + 1,
        delay,
        error: err.message,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function sendEmail(to, subject, htmlContent) {
  const cleanTo = to?.trim();
  if (!cleanTo) return { error: 'No recipient email provided' };
  try {
    const result = await sendEmailWithRetry(cleanTo, subject, htmlContent);
    logger.info(`[Email] Sent to ${cleanTo}: ${subject}`);
    return result;
  } catch (err) {
    return { error: err };
  }
}

// HTMLエスケープ関数（XSS対策）
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// URLを含む変数名のパターン（href属性に埋め込まれるため、エスケープ不要）
const URL_VAR_PATTERN = /url|link|href/i;

function applyVariables(content, variables) {
  let result = content;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const rawValue = variables[key] !== undefined ? variables[key] : '';
    // URL系変数はエスケープしない（href属性を破壊しないため）
    const value = URL_VAR_PATTERN.test(key) ? rawValue : escapeHtml(String(rawValue));
    result = result.replace(regex, value);
  });
  result = result.replace(/\{current_date\}/g, new Date().toLocaleDateString('ja-JP'));
  return result;
}

export async function sendDynamicEmail(toEmail, templateKey, variables = {}) {
  const cleanTo = toEmail?.trim();
  if (!cleanTo) {
    logger.warn('[Email] Empty address for template', { templateKey });
    return false;
  }

  // 送信前に queued レコードを作成
  const emailLog = await prisma.emailLog.create({
    data: { to: cleanTo, template: templateKey, status: 'queued' },
  }).catch(() => null);

  try {
    const template = await prisma.emailTemplate.findUnique({ where: { key: templateKey } });
    const tpl = template || DEFAULT_TEMPLATES[templateKey];

    if (!tpl) {
      logger.warn('[Email] No template found', { templateKey });
      if (emailLog) {
        prisma.emailLog.update({
          where: { id: emailLog.id },
          data: { status: 'failed', error: `No template found for key: ${templateKey}` },
        }).catch(() => {});
      }
      return false;
    }

    const finalSubject = applyVariables(tpl.subject, variables);
    const finalBody = applyVariables(tpl.body, variables);

    try {
      const { data } = await sendEmailWithRetry(cleanTo, finalSubject, finalBody);
      logger.info('[Email] Sent via sendDynamicEmail', { templateKey, to: cleanTo });
      if (emailLog) {
        prisma.emailLog.update({
          where: { id: emailLog.id },
          data: { status: 'sent', messageId: data?.id ?? null, sentAt: new Date() },
        }).catch(() => {});
      }
      return true;
    } catch (sendErr) {
      logger.error('[Email] sendDynamicEmail failed after retries', {
        templateKey,
        to: cleanTo,
        error: sendErr.message,
      });
      if (emailLog) {
        prisma.emailLog.update({
          where: { id: emailLog.id },
          data: { status: 'failed', error: sendErr.message || String(sendErr) },
        }).catch(() => {});
      }
      return false;
    }
  } catch (err) {
    logger.error('[Email Exception] sendDynamicEmail unexpected error', {
      templateKey,
      to: cleanTo,
      error: err?.message || String(err),
    });
    if (emailLog) {
      prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'failed', error: err?.message || String(err) },
      }).catch(() => {});
    }
    return false;
  }
}

// ── Convenience wrappers ──────────────────────────────────────
export const sendBrandedEmail = (to, title, bodyHtml) =>
  sendEmail(to, title, createBaseHtml(title, bodyHtml));

/**
 * 支援完了メール（支援者向け）
 * 支援が確定した直後に呼び出す。
 */
export async function sendPledgeConfirmationEmail(userEmail, userName, projectTitle, amount) {
  const bodyHtml = `
    <p class="greeting">こんにちは、${userName}さん 🌸</p>
    <p class="message">「${projectTitle}」への支援が完了しました。ありがとうございます！</p>
    <div class="highlight">
      <div class="highlight-label">支援金額</div>
      <div class="highlight-value">¥${Number(amount).toLocaleString()}</div>
    </div>
    <p class="message">企画の進捗はFLASTALでいつでもご確認いただけます。</p>
    <div class="cta"><a href="${APP_URL}/mypage" class="btn">マイページを開く</a></div>
  `;
  return sendEmail(
    userEmail,
    `【FLASTAL】🌸「${projectTitle}」への支援が完了しました`,
    createBaseHtml('支援完了のお知らせ 💖', bodyHtml)
  );
}

/**
 * 企画目標達成メール（企画者向け）
 * 企画が目標金額を達成した際に呼び出す。
 */
export async function sendGoalAchievedEmail(plannerEmail, plannerName, projectTitle, totalAmount) {
  const bodyHtml = `
    <p class="greeting">おめでとうございます、${plannerName}さん！🎉</p>
    <p class="message">「${projectTitle}」が目標金額を達成しました！</p>
    <div class="highlight">
      <div class="highlight-label">総支援金額</div>
      <div class="highlight-value">¥${Number(totalAmount).toLocaleString()}</div>
    </div>
    <p class="message">ダッシュボードで詳細を確認し、お花屋さんとの交渉を進めましょう。</p>
    <div class="cta"><a href="${APP_URL}/dashboard" class="btn">ダッシュボードを開く</a></div>
  `;
  return sendEmail(
    plannerEmail,
    `【FLASTAL】🎉「${projectTitle}」が目標達成しました！`,
    createBaseHtml('🌸 目標達成おめでとうございます！', bodyHtml)
  );
}

/**
 * fire-and-forget メール送信。
 * 呼び出し元をブロックせず、失敗してもリクエストに影響しない。
 * Webhook・通知など副次的なメール全般に使用する。
 */
export async function queueEmail(toEmail, templateKey, variables = {}) {
  // BullMQ キューが利用可能なら永続キューに追加（リトライ・耐障害性あり）
  try {
    const { getEmailQueue } = await import('../queues/emailQueue.js');
    const q = getEmailQueue();
    if (q) {
      await q.add(templateKey, { toEmail, templateKey, variables });
      return;
    }
  } catch {
    // Redis 未設定 or 接続失敗 → フォールバック
  }
  setImmediate(() => {
    sendDynamicEmail(toEmail, templateKey, variables).catch(err => {
      logger.error('[Email Queue Error] in-process fallback failed', {
        templateKey,
        to: toEmail,
        error: err?.message || String(err),
      });
    });
  });
}
