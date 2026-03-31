import { useState, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
    show: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

const variantConfig = {
    danger: {
        icon: Trash2,
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-500 dark:text-red-400',
        confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500 dark:text-amber-400',
        confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    default: {
        icon: HelpCircle,
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        confirmBtn: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    },
};

export default function ConfirmDialog({
    show,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <Transition show={show} leave="duration-200">
            <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center px-4" onClose={onCancel}>
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-black/50" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <DialogPanel className="relative w-full max-w-sm bg-sidebar border border-border rounded-2xl shadow-xl p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center mb-4`}>
                                <Icon className={`w-6 h-6 ${config.iconColor}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                            <p className="text-sm text-muted-foreground mb-6">{message}</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${config.confirmBtn}`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}

interface ConfirmState {
    show: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'default';
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({
        show: false,
        title: '',
        message: '',
        confirmLabel: 'Confirmer',
        variant: 'default',
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback(
        (opts: { title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'warning' | 'default' }) => {
            return new Promise<boolean>((resolve) => {
                resolveRef.current = resolve;
                setState({
                    show: true,
                    title: opts.title,
                    message: opts.message,
                    confirmLabel: opts.confirmLabel ?? 'Confirmer',
                    variant: opts.variant ?? 'default',
                });
            });
        },
        []
    );

    const handleConfirm = useCallback(() => {
        setState((s) => ({ ...s, show: false }));
        resolveRef.current?.(true);
        resolveRef.current = null;
    }, []);

    const handleCancel = useCallback(() => {
        setState((s) => ({ ...s, show: false }));
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    const confirmDialog = (
        <ConfirmDialog
            show={state.show}
            title={state.title}
            message={state.message}
            confirmLabel={state.confirmLabel}
            variant={state.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );

    return { confirm, confirmDialog };
}
