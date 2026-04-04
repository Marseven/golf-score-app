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
  const busyRef = useRef(false);

  useEffect(() => {
    if (!tournamentId) return;

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

    intervalRef.current = window.setInterval(refresh, 5000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [tournamentId]);

  return { lastUpdate };
}
