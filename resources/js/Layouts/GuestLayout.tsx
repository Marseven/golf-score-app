import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import logo from '@/assets/logo.png';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-block">
                        <img src={logo} alt="MGC Score" className="mx-auto w-16 h-16 object-contain" />
                    </Link>
                </div>
                <div className="glass-card">
                    {children}
                </div>
            </div>
        </div>
    );
}
