import { useEffect, useRef, useState, useCallback } from "react";
import { router } from "@inertiajs/react";

declare global {
  interface Window {
    Echo: any;
  }
}

export function useRealtimeScores(tournamentId?: string) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<number | null>(null);
  const isFetching = useRef(false);

  const refresh = useCallback(() => {
    if (isFetching.current) return;
    isFetching.current = true;
    router.reload({
      only: ['scores', 'players', 'penalties'],
      onFinish: () => {
        isFetching.current = false;
        setLastUpdate(new Date());
      },
    });
  }, []);

  useEffect(() => {
    if (!tournamentId) return;

    if (window.Echo) {
      window.Echo.channel(`tournament.${tournamentId}`)
        .listen('.score.updated', refresh);
      return () => {
        window.Echo.leave(`tournament.${tournamentId}`);
      };
    }

    intervalRef.current = window.setInterval(refresh, 5000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [tournamentId, refresh]);

  return { lastUpdate };
}
