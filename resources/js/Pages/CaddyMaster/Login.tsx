import { useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Shield, Loader2 } from 'lucide-react';

function PinInput({ value, onChange }: { value: string; onChange: (pin: string) => void }) {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const digits = value.padEnd(6, '').split('').slice(0, 6);

    const handleChange = (index: number, char: string) => {
        if (char && !/^\d$/.test(char)) return;
        const newDigits = [...digits];
        newDigits[index] = char;
        const newPin = newDigits.join('');
        onChange(newPin.replace(/\s/g, ''));
        if (char && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted);
        const nextIndex = Math.min(pasted.length, 5);
        inputsRef.current[nextIndex]?.focus();
    };

    return (
        <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[i]?.trim() || ''}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-foreground text-2xl font-bold text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                />
            ))}
        </div>
    );
}

export default function CaddyMasterLogin() {
    const form = useForm({ pin: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('caddie-master.authenticate'));
    };

    return (
        <>
            <Head title="Connexion Caddie Master" />
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="w-full max-w-sm space-y-8 text-center">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Caddie Master</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Entrez le PIN à 6 chiffres du tournoi
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div>
                            <PinInput
                                value={form.data.pin}
                                onChange={(pin) => form.setData('pin', pin)}
                            />
                            {form.errors.pin && (
                                <p className="mt-3 text-sm text-destructive">{form.errors.pin}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={form.processing || form.data.pin.length < 6}
                            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-14 text-base font-semibold rounded-xl flex items-center justify-center disabled:opacity-50"
                        >
                            {form.processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accéder au tableau de bord'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
