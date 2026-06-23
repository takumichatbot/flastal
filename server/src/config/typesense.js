import Typesense from 'typesense';

let client = null;

export function getTypesenseClient() {
    if (client) return client;
    if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) return null;

    client = new Typesense.Client({
        nodes: [{ host: process.env.TYPESENSE_HOST, port: parseInt(process.env.TYPESENSE_PORT || '443'), protocol: process.env.TYPESENSE_PROTOCOL || 'https' }],
        apiKey: process.env.TYPESENSE_API_KEY,
        connectionTimeoutSeconds: 5,
    });
    return client;
}

export const PROJECT_SCHEMA = {
    name: 'projects',
    fields: [
        { name: 'id',               type: 'string' },
        { name: 'title',            type: 'string' },
        { name: 'description',      type: 'string' },
        { name: 'deliveryAddress',  type: 'string' },
        { name: 'collectedAmount',  type: 'int32' },
        { name: 'targetAmount',     type: 'int32' },
        { name: 'createdAt',        type: 'int64' },
        { name: 'plannerName',      type: 'string' },
    ],
    default_sorting_field: 'collectedAmount',
};

export async function indexProject(project) {
    const ts = getTypesenseClient();
    if (!ts) return;
    try {
        await ts.collections('projects').documents().upsert({
            id:              project.id,
            title:           project.title || '',
            description:     project.description || '',
            deliveryAddress: project.deliveryAddress || '',
            collectedAmount: project.collectedAmount || 0,
            targetAmount:    project.targetAmount || 0,
            createdAt:       Math.floor(new Date(project.createdAt).getTime() / 1000),
            plannerName:     project.planner?.handleName || '',
        });
    } catch (err) {
        console.warn('Typesense indexProject failed:', err.message);
    }
}

export async function deleteProjectFromIndex(projectId) {
    const ts = getTypesenseClient();
    if (!ts) return;
    try {
        await ts.collections('projects').documents(projectId).delete();
    } catch (err) {
        // 404 はすでに存在しないため無視
        if (err.httpStatus !== 404) throw err;
    }
}

export async function searchProjects(query, options = {}) {
    const ts = getTypesenseClient();
    if (!ts) return null;
    try {
        const result = await ts.collections('projects').documents().search({
            q:              query,
            query_by:       'title,description,deliveryAddress,plannerName',
            sort_by:        'collectedAmount:desc',
            num_typos:      2,
            per_page:       options.limit || 20,
            filter_by:      options.filterBy || '',
        });
        return result.hits.map(h => h.document);
    } catch (err) {
        console.warn('Typesense search failed, falling back to pg:', err.message);
        return null;
    }
}
