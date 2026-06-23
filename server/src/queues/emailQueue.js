import { Queue, Worker } from 'bullmq';
import { getRedis } from '../config/redis.js';
import { sendDynamicEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';

const QUEUE_NAME = 'email';
let queue = null;
let worker = null;

export function getEmailQueue() {
    const connection = getRedis();
    if (!connection) return null;
    if (!queue) {
        queue = new Queue(QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: { count: 100 },
                removeOnFail: { count: 200 },
            },
        });
    }
    return queue;
}

export function startEmailWorker() {
    const connection = getRedis();
    if (!connection) {
        console.log('[EmailQueue] REDIS_URL not set — using in-process fallback');
        return;
    }
    worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { toEmail, templateKey, variables } = job.data;
            await sendDynamicEmail(toEmail, templateKey, variables);
        },
        {
            connection,
            concurrency: 5,
        }
    );
    worker.on('completed', (job) => {
        console.log(`[EmailQueue] Job ${job.id} (${job.data.templateKey}) completed`);
    });
    worker.on('failed', (job, err) => {
        logger.error('email_job_failed', {
            event: 'email_job_failed',
            jobId: job?.id,
            jobName: job?.name,
            attemptsMade: job?.attemptsMade,
            toEmail: job?.data?.toEmail,
            templateKey: job?.data?.templateKey,
            error: err.message,
        });
        // 最大試行回数に達した場合（デッドレター）
        if (job?.attemptsMade >= (job?.opts?.attempts ?? 3)) {
            logger.error('email_job_dead', {
                event: 'email_job_dead',
                jobId: job?.id,
                toEmail: job?.data?.toEmail,
                templateKey: job?.data?.templateKey,
                error: err.message,
            });
        }
    });
    console.log('[EmailQueue] Worker started');
}
