import { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Target, Loader2, Hash, FileText } from 'lucide-react';

function PinInput({ value, onChange }: { value: string; onChange: (pin: string) => void }) {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const digits = value.padEnd(4, '').split('').slice(0, 4);

    const handleChange = (index: number, char: string) => {
        if (char && !/^\d$/.test(char)) return;
        const newDigits = [...digits];
        newDigits[index] = char;
        const newPin = newDigits.join('');
        onChange(newPin.replace(/\s/g, ''));
        if (char && index < 3) {
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
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        onChange(pasted);
        const nextIndex = Math.min(pasted.length, 3);
        inputsRef.current[nextIndex]?.focus();
    };

    return (
        <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
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
                    className="w-14 h-16 bg-white/5 border border-white/10 rounded-xl text-foreground text-2xl font-bold text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
                />
            ))}
        </div>
    );
}

export default function MarkerLogin() {
    const [mode, setMode] = useState<'pin' | 'code'>('pin');
    const form = useForm({ pin: '', code: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('marqueur.authenticate'));
    };

    return (
        <>
            <Head title="Connexion Marqueur" />
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="w-full max-w-sm space-y-8 text-center">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Target className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Connexion Marqueur</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            {mode === 'pin' ? 'Entrez le PIN fourni par l\'organisateur' : 'Entrez le code fourni par l\'organisateur'}
                        </p>
                    </div>

                    {/* Toggle tabs */}
                    <div className="flex bg-white/5 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => setMode('pin')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'pin' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Hash className="w-4 h-4" />
                            PIN
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('code')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'code' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <FileText className="w-4 h-4" />
                            Code de groupe
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {mode === 'pin' ? (
                            <div>
                                <PinInput
                                    value={form.data.pin}
                                    onChange={(pin) => form.setData('pin', pin)}
                                />
                                {form.errors.pin && (
                                    <p className="mt-3 text-sm text-destructive">{form.errors.pin}</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                    placeholder="GOLF-2026-G1"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-foreground text-xl font-mono text-center uppercase tracking-widest focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                                />
                                {form.errors.code && (
                                    <p className="mt-2 text-sm text-destructive">{form.errors.code}</p>
                                )}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={form.processing || (mode === 'pin' ? form.data.pin.length < 4 : !form.data.code.trim())}
                            className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-14 text-base font-semibold rounded-xl flex items-center justify-center disabled:opacity-50"
                        >
                            {form.processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acceder au groupe'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
