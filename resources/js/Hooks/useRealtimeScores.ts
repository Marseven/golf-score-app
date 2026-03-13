import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";

declare global {
  interface Window {
    Echo: any;
  }
}

export function useRealtimeScores(tournamentId?: string) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!tournamentId || !window.Echo) return;

    const channel = window.Echo.channel(`tournament.${tournamentId}`)
      .listen('.score.updated', () => {
        router.reload({ only: ['scores', 'players'] });
        setLastUpdate(new Date());
      });

    return () => {
      window.Echo.leave(`tournament.${tournamentId}`);
    };
  }, [tournamentId]);

  return { lastUpdate };
}
