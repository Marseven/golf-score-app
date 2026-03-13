export interface PendingScore {
    key: string;        // "player_id:hole_id"
    player_id: string;
    hole_id: string;
    strokes: number;
    group_id: string;
    updated_at: string; // ISO 8601
}

const DB_NAME = 'golf_scores_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_scores';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                store.createIndex('by_group', 'group_id', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function savePendingScore(score: Omit<PendingScore, 'key' | 'updated_at'>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const entry: PendingScore = {
            ...score,
            key: `${score.player_id}:${score.hole_id}`,
            updated_at: new Date().toISOString(),
        };
        store.put(entry);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

export async function getPendingScores(groupId: string): Promise<PendingScore[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('by_group');
        const request = index.getAll(groupId);
        request.onsuccess = () => { db.close(); resolve(request.result); };
        request.onerror = () => { db.close(); reject(request.error); };
    });
}

export async function deletePendingScores(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const key of keys) {
            store.delete(key);
        }
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

export async function getPendingCount(groupId: string): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('by_group');
        const request = index.count(groupId);
        request.onsuccess = () => { db.close(); resolve(request.result); };
        request.onerror = () => { db.close(); reject(request.error); };
    });
}

export async function clearPendingScores(groupId: string): Promise<void> {
    const pending = await getPendingScores(groupId);
    await deletePendingScores(pending.map((p) => p.key));
}
