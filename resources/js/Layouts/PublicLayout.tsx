import { PropsWithChildren, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, LogOut, LogIn, LayoutDashboard, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/Hooks/useTheme';
import logo from '@/assets/logo.png';

interface Props {
    transparentHeader?: boolean;
}

const themeIcon: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export default function PublicLayout({ children, transparentHeader = false }: PropsWithChildren<Props>) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const roles: string[] = auth?.roles ?? [];
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, cycleTheme } = useTheme();

    const isAdminOrCaptain = roles.includes('admin') || roles.includes('captain');

    const headerBg = transparentHeader
        ? 'bg-transparent'
        : 'bg-sidebar border-b border-sidebar-border';

    const ThemeIcon = themeIcon[theme];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 h-16 ${headerBg}`}>
                <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    {/* Left: Logo */}
                    <Link href={route('home')} className="flex items-center gap-2.5">
                        <img src={logo} alt="MGC Score" className="w-9 h-9 object-contain" />
                        <span className="text-base font-bold text-foreground tracking-tight">MGC Score</span>
                    </Link>

                    {/* Center: Nav links (desktop) */}
                    <nav className="hidden sm:flex items-center gap-1">
                        <Link
                            href={route('tournois')}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                        >
                            Tournois
                        </Link>
                        <Link
                            href={route('classement')}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                        >
                            Classement
                        </Link>
                    </nav>

                    {/* Right: Theme + Auth (desktop) */}
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={cycleTheme}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                            title={`Thème : ${theme}`}
                        >
                            <ThemeIcon className="w-4 h-4" />
                        </button>
                        {user ? (
                            <>
                                {isAdminOrCaptain && (
                                    <Link
                                        href={route('admin.dashboard')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-foreground bg-surface border border-border hover:bg-surface-hover transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Espace Admin
                                    </Link>
                                )}
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Déconnexion
                                </Link>
                            </>
                        ) : (
                            <Link
                                href={route('login')}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                Connexion
                            </Link>
                        )}
                    </div>

                    {/* Mobile: Hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="sm:hidden p-2 rounded-lg text-foreground hover:bg-surface-hover"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Mobile menu overlay */}
            {mobileOpen && (
                <div className="sm:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <div className="absolute inset-y-0 right-0 w-72 bg-sidebar border-l border-sidebar-border flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                            <span className="text-sm font-bold text-foreground">Menu</span>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1">
                            <Link
                                href={route('tournois')}
                                onClick={() => setMobileOpen(false)}
                                className="block px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                            >
                                Tournois
                            </Link>
                            <Link
                                href={route('classement')}
                                onClick={() => setMobileOpen(false)}
                                className="block px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                            >
                                Classement
                            </Link>
                            {user && isAdminOrCaptain && (
                                <Link
                                    href={route('admin.dashboard')}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-foreground bg-surface hover:bg-surface-hover transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Espace Admin
                                </Link>
                            )}
                        </nav>
                        <div className="p-4 border-t border-sidebar-border space-y-2">
                            <button
                                onClick={cycleTheme}
                                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                            >
                                <ThemeIcon className="w-4 h-4" />
                                {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Système'}
                            </button>
                            {user ? (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Déconnexion
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Connexion
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="pt-16">
                {children}
            </main>
        </div>
    );
}
