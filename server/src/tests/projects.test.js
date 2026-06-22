import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { default: app } = await import('../app.js');
const { default: prisma } = await import('../config/prisma.js');

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── getProjects ────────────────────────────────────────────────

describe('GET /api/projects', () => {
    it('公開プロジェクト一覧を返す', async () => {
        const projects = [
            { id: 'p1', title: 'バラのプロジェクト', status: 'FUNDRAISING', planner: { handleName: 'Taro', iconUrl: null } },
        ];
        prisma.project.findMany.mockResolvedValue(projects);

        const res = await request(app).get('/api/projects');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].title).toBe('バラのプロジェクト');
    });

    it('キーワードフィルタでDB検索を呼び出す', async () => {
        prisma.project.findMany.mockResolvedValue([]);

        const res = await request(app).get('/api/projects?keyword=バラ');

        expect(res.status).toBe(200);
        expect(prisma.project.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([
                        expect.objectContaining({ title: expect.objectContaining({ contains: 'バラ' }) }),
                    ]),
                }),
            })
        );
    });

    it('都道府県フィルタで絞り込み検索する', async () => {
        prisma.project.findMany.mockResolvedValue([]);

        await request(app).get('/api/projects?prefecture=東京');

        expect(prisma.project.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    deliveryAddress: expect.objectContaining({ contains: '東京' }),
                }),
            })
        );
    });
});

// ─── getProject (single) ────────────────────────────────────────

describe('GET /api/projects/:id', () => {
    it('存在しないIDで404を返す', async () => {
        prisma.project.findUnique.mockResolvedValue(null);

        const res = await request(app).get('/api/projects/nonexistent-id');

        expect(res.status).toBe(404);
    });

    it('存在するプロジェクトを返す', async () => {
        prisma.project.findUnique.mockResolvedValue({
            id: 'p1',
            title: 'テストプロジェクト',
            status: 'FUNDRAISING',
            planner: { handleName: 'Taro', iconUrl: null },
            pledgeTiers: [],
            pledges: [],
        });

        const res = await request(app).get('/api/projects/p1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('p1');
    });
});
