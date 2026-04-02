import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (!tournamentId) return;

    const refresh = () => {
      router.reload();
      setLastUpdate(new Date());
    };

    // Try WebSocket via Echo
    if (window.Echo) {
      window.Echo.channel(`tournament.${tournamentId}`)
        .listen('.score.updated', refresh);

      return () => {
        window.Echo.leave(`tournament.${tournamentId}`);
      };
    }

    // Fallback: polling when Echo is not available
    pollRef.current = setInterval(refresh, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [tournamentId]);

  return { lastUpdate };
}
