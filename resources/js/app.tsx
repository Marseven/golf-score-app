import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { FlashMessages } from '@/Components/FlashMessages';

const appName = import.meta.env.VITE_APP_NAME || 'MGC Score';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <FlashMessages />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        className: '!bg-surface !border-border !text-foreground',
                    }}
                />
            </>
        );
    },
    progress: {
        color: '#10b981',
    },
});
