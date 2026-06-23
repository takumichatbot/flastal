import prisma from '../config/prisma.js';

/**
 * 管理者操作の監査ログを記録する
 * @param {string} adminId - 操作した管理者のユーザーID
 * @param {string} action  - 操作の種別 ("USER_SUSPEND", "PROJECT_DELETE" など)
 * @param {string} targetType - 対象リソースの種別 ("User", "Project", "Florist" など)
 * @param {string} targetId   - 対象リソースのID
 * @param {object|null} detail    - 追加情報（理由・変更前後の値など）
 * @param {string|null} ipAddress - 操作元IPアドレス
 */
export async function createAuditLog(adminId, action, targetType, targetId, detail = null, ipAddress = null) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        detail: detail ? JSON.parse(JSON.stringify(detail)) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    // 監査ログの失敗は本体の操作をブロックしない
    console.error('[AuditLog] Failed to create audit log:', err.message);
  }
}
