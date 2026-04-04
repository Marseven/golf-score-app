import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";

declare global {
  interface Window {
    Echo: any;
  }
}

let globalInterval: number | null = null;

export function useRealtimeScores(tournamentId?: string) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const busyRef = useRef(false);

  useEffect(() => {
    if (!tournamentId) return;

    if (globalInterval) {
      window.clearInterval(globalInterval);
      globalInterval = null;
    }

    const refresh = () => {
      if (busyRef.current) return;
      busyRef.current = true;
      router.reload({
        onFinish: () => {
          busyRef.current = false;
          setLastUpdate(new Date());
        },
      });
    };

    if (window.Echo) {
      window.Echo.channel(`tournament.${tournamentId}`)
        .listen('.score.updated', refresh);
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
