import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

declare global {
  interface Window {
    Echo: any;
  }
}

let globalInterval: number | null = null;
let lastScoreCount = -1;

export function useRealtimeScores(tournamentId?: string) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!tournamentId) return;

    // Clear any existing global interval to prevent duplicates
    if (globalInterval) {
      window.clearInterval(globalInterval);
      globalInterval = null;
    }

    const refresh = () => {
      // Fetch score count to check if data changed
      fetch(`/api/score-count/${tournamentId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && data.count !== lastScoreCount) {
            lastScoreCount = data.count;
            router.reload();
            setLastUpdate(new Date());
          }
        })
        .catch(() => {
          // Fallback: just reload
          router.reload();
          setLastUpdate(new Date());
        });
    };

    if (window.Echo) {
      window.Echo.channel(`tournament.${tournamentId}`)
        .listen('.score.updated', () => {
          router.reload();
          setLastUpdate(new Date());
        });
      return () => {
        window.Echo.leave(`tournament.${tournamentId}`);
      };
    }

    globalInterval = window.setInterval(refresh, 5000);

    return () => {
      if (globalInterval) {
        window.clearInterval(globalInterval);
        globalInterval = null;
      }
    };
  }, [tournamentId]);

  return { lastUpdate };
}
