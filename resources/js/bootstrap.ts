import axios from 'axios';

declare global {
    interface Window {
        axios: typeof axios;
        Pusher: any;
        Echo: any;
    }
}

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Echo / Reverb - only initialize when VITE_REVERB_APP_KEY is configured.
 * When Reverb is not running, Echo simply won't be available
 * and useRealtimeScores will gracefully skip subscription.
 */

if (import.meta.env.VITE_REVERB_APP_KEY) {
    import('pusher-js').then((Pusher) => {
        window.Pusher = Pusher.default;

        import('laravel-echo').then((EchoModule) => {
            try {
                window.Echo = new EchoModule.default({
                    broadcaster: 'reverb',
                    key: import.meta.env.VITE_REVERB_APP_KEY,
                    wsHost: import.meta.env.VITE_REVERB_HOST,
                    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
                    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
                    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
                    enabledTransports: ['ws', 'wss'],
                });
            } catch {
                // Reverb not available - real-time disabled
            }
        });
    });
}
