import { useState, useEffect, useRef, useCallback } from 'react';
import {
    savePendingScore,
    getPendingScores,
    deletePendingScores,
    getPendingCount,
} from '@/Lib/offline-store';
import type { Player, Hole, Score, CategoryPar } from '@/types';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface UseOfflineScoresOptions {
    groupId: string;
    phase?: number;
    players: Player[];
    holes: Hole[];
    existingScores: Record<string, Score[]>;
    saveUrl: string;
    csrfRefreshUrl: string;
    categoryPars?: CategoryPar[];
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function useOfflineScores({ groupId, phase, players, holes, existingScores, saveUrl, csrfRefreshUrl, categoryPars }: UseOfflineScoresOptions) {
    // Build category par lookup for default scores
    const catParMap = new Map<string, number>();
    if (categoryPars) {
        for (const cp of categoryPars) {
            catParMap.set(`${cp.category_id}:${cp.hole_id}`, cp.par);
        }
    }

    // Build initial scores grid from server data
    const buildInitialScores = useCallback((): number[][] => {
        return players.map((player) => {
            const playerScores = existingScores[player.id] || [];
            return holes.map((hole) => {
                const existing = playerScores.find((s) => s.hole_id === hole.id);
                if (existing) return existing.strokes;
                // Use category-specific par as default if available
                if (player.category_id) {
                    const catPar = catParMap.get(`${player.category_id}:${hole.id}`);
                    if (catPar !== undefined) return catPar;
                }
                return hole.par;
            });
        });
    }, [players, holes, existingScores]);

    const [scores, setScores] = useState<number[][]>(buildInitialScores);
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true,
    );
    const [pendingCount, setPendingCount] = useState(0);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    const isSyncingRef = useRef(false);
    const syncIntervalRef = useRef<ReturnType<typeof setInterval>>();

    // Merge IndexedDB pending scores into state on mount
    useEffect(() => {
        (async () => {
            try {
                const pending = await getPendingScores(groupId);
                if (pending.length === 0) return;

                setPendingCount(pending.length);

                setScores((prev) => {
                    const next = prev.map((row) => [...row]);
                    for (const entry of pending) {
                        const pIdx = players.findIndex((p) => p.id === entry.player_id);
                        const hIdx = holes.findIndex((h) => h.id === entry.hole_id);
                        if (pIdx !== -1 && hIdx !== -1) {
                            next[pIdx][hIdx] = entry.strokes;
                        }
                    }
                    return next;
                });
            } catch {
                // IndexedDB unavailable — degrade gracefully
            }
        })();
    }, [groupId, players, holes]);

    // Sync pending scores to server
    const syncNow = useCallback(async () => {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        setSyncStatus('syncing');

        try {
            const pending = await getPendingScores(groupId);
            if (pending.length === 0) {
                setSyncStatus('idle');
                isSyncingRef.current = false;
                return;
            }

            const scoresPayload = pending.map((p) => ({
                player_id: p.player_id,
                hole_id: p.hole_id,
                strokes: p.strokes,
            }));

            const response = await fetch(saveUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ scores: scoresPayload }),
            });

            if (response.ok) {
                await deletePendingScores(pending.map((p) => p.key));
                const count = await getPendingCount(groupId);
                setPendingCount(count);
                setSyncStatus('idle');
                setLastSyncTime(new Date());
            } else if (response.status === 419) {
                // CSRF token expired — refresh page cookie silently
                await fetch(csrfRefreshUrl, { credentials: 'same-origin' }).catch(() => {});
                setSyncStatus('error');
            } else {
                setSyncStatus('error');
            }
        } catch {
            // Network error — stay in error state, retry on next cycle
            setSyncStatus('error');
        } finally {
            isSyncingRef.current = false;
        }
    }, [groupId]);

    // Update a single score in the React state
    const updateScore = useCallback(
        (playerIdx: number, holeIdx: number, delta: number) => {
            setScores((prev) => {
                const next = prev.map((row) => [...row]);
                next[playerIdx][holeIdx] = Math.max(1, next[playerIdx][holeIdx] + delta);
                return next;
            });
        },
        [],
    );

    // Persist current hole scores to IndexedDB and trigger sync
    const saveHole = useCallback(
        async (holeIdx: number) => {
            const hole = holes[holeIdx];
            if (!hole) return;

            try {
                for (let i = 0; i < players.length; i++) {
                    await savePendingScore({
                        player_id: players[i].id,
                        hole_id: hole.id,
                        strokes: scores[i][holeIdx],
                        group_id: groupId,
                    });
                }
                const count = await getPendingCount(groupId);
                setPendingCount(count);
            } catch {
                // IndexedDB write failed — scores still in React state
            }

            if (navigator.onLine) {
                syncNow();
            }
        },
        [holes, players, scores, groupId, syncNow],
    );

    const forceSyncNow = useCallback(() => {
        syncNow();
    }, [syncNow]);

    // Online/offline listeners + polling interval
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncNow();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Safety polling — navigator.onLine is unreliable on mobile
        syncIntervalRef.current = setInterval(() => {
            setIsOnline(navigator.onLine);
            if (navigator.onLine) syncNow();
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        };
    }, [syncNow]);

    // Warn before closing with pending scores
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (pendingCount > 0) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [pendingCount]);

    return {
        scores,
        updateScore,
        saveHole,
        isOnline,
        pendingCount,
        syncStatus,
        lastSyncTime,
        forceSyncNow,
    };
}
