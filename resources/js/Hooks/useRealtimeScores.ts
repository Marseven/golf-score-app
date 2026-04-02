import { useEffect, useRef, useState, useCallback } from "react";
import { router } from "@inertiajs/react";

declare global {
  interface Window {
    Echo: any;
  }
}

const POLL_INTERVAL = 5_000; // 5 seconds

export function useRealtimeScores(tournamentId?: string) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReloading = useRef(false);

  const refresh = useCallback(() => {
    if (isReloading.current) return;
    isReloading.current = true;
    router.reload({
      onFinish: () => {
        isReloading.current = false;
        setLastUpdate(new Date());
      },
    });
  }, []);

  useEffect(() => {
    if (!tournamentId) return;

    // Try WebSocket via Echo
    if (window.Echo) {
      window.Echo.channel(`tournament.${tournamentId}`)
        .listen('.score.updated', refresh);

      return () => {
        window.Echo.leave(`tournament.${tournamentId}`);
      };
    }

    // Fallback: polling
    pollRef.current = setInterval(refresh, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [tournamentId, refresh]);

  return { lastUpdate };
}
