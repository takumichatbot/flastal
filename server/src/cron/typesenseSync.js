import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export async function runTypesenseSyncJob() {
  logger.info('Typesense定期同期バッチ', { context: 'CRON' });
  try {
    // Typesense設定を読む
    const { indexProject, getTypesenseClient } = await import('../config/typesense.js').catch(() => ({ indexProject: null, getTypesenseClient: null }));
    if (!indexProject || !getTypesenseClient?.()) {
      logger.info('Typesense未設定のためスキップ', { context: 'TypesenseSync' });
      return;
    }

    // 直近24時間に更新されたプロジェクトを同期
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const projects = await prisma.project.findMany({
      where: {
        updatedAt: { gte: cutoff },
        status: { not: 'DRAFT' },
      },
      include: {
        planner: { select: { id: true, handleName: true } },
        _count: { select: { pledges: true } },
      },
    });

    let synced = 0;
    for (const project of projects) {
      await indexProject(project).catch(err =>
        logger.error('Failed to sync project', { context: 'TypesenseSync', projectId: project.id, error: err.message })
      );
      synced++;
    }

    logger.info(`${synced}件のプロジェクトを同期しました`, { context: 'TypesenseSync', synced });
  } catch (err) {
    logger.error('Error', { context: 'TypesenseSync', error: err.message });
  }
}
