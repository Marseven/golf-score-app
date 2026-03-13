import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export function FlashMessages() {
    useEffect(() => {
        return router.on('success', (event) => {
            const flash = (event.detail.page.props as any)?.flash;
            if (flash?.success) {
                toast.success(flash.success);
            }
            if (flash?.error) {
                toast.error(flash.error);
            }
        });
    }, []);

    return null;
}
