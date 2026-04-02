import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

declare global {
  interface Window {
    Echo: any;
  }
}

export function useRealtimeScores(tournamentId?: string) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<number | null>(null);

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

    // Fallback: polling every 5 seconds
    intervalRef.current = window.setInterval(refresh, 5000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [tournamentId]);

  return { lastUpdate };
}
