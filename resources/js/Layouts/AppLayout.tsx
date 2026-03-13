import { PropsWithChildren, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Settings, Wifi, WifiOff, Menu, LogOut, X, User, ExternalLink, Sun, Moon, Monitor, Cog, Users } from 'lucide-react';
import { useTheme, type Theme } from '@/Hooks/useTheme';
import logo from '@/assets/logo.png';

interface NavItem {
    title: string;
    routeName: string;
    routeParams?: any;
    icon: any;
    adminOnly?: boolean;
}

const adminNavItems: NavItem[] = [
    { title: 'Mes tournois', routeName: 'admin.dashboard', icon: Settings },
    { title: 'Utilisateurs', routeName: 'admin.users', icon: Users, adminOnly: true },
    { title: 'Paramètres', routeName: 'admin.settings', icon: Cog, adminOnly: true },
    { title: 'Mon profil', routeName: 'profile.edit', icon: User },
];

const themeIcon: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const themeLabel: Record<Theme, string> = { light: 'Clair', dark: 'Sombre', system: 'Système' };

function SidebarContent({ tournament, user, roles, onNavClick }: {
    tournament?: any;
    user?: any;
    roles?: string[];
    onNavClick?: () => void;
}) {
    const { url } = usePage();
    const visibleNavItems = adminNavItems.filter((item) => !item.adminOnly || roles?.includes('admin'));
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const { theme, cycleTheme } = useTheme();
    const ThemeIcon = themeIcon[theme];

    return (
        <div className="flex flex-col h-full">
            <div className="p-6">
                <Link href={route('admin.dashboard')} className="flex items-center gap-3">
                    <img src={logo} alt="MGC Score" className="w-10 h-10 object-contain" />
                    <h1 className="text-lg font-bold text-foreground tracking-tight">MGC Score</h1>
                </Link>
            </div>

            {tournament && (
                <div className="px-4 mb-6">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-medium text-primary">Tournoi en cours</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{tournament.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tournament.club}</p>
                    </div>
                </div>
            )}

            <nav className="flex-1 px-3">
                <ul className="space-y-1">
                    {visibleNavItems.map((item) => {
                        const itemUrl = route(item.routeName, item.routeParams);
                        const isActive = url.startsWith(new URL(itemUrl).pathname);
                        return (
                            <li key={item.routeName}>
                                <Link
                                    href={itemUrl}
                                    onClick={onNavClick}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.title}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-3">
                <Link
                    href={route('home')}
                    onClick={onNavClick}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Retour au site
                </Link>
                <button
                    onClick={cycleTheme}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                >
                    <ThemeIcon className="w-4 h-4" />
                    {themeLabel[theme]}
                </button>
                <div className="flex items-center gap-2">
                    {isOnline ? <Wifi className="w-4 h-4 text-primary" /> : <WifiOff className="w-4 h-4 text-destructive" />}
                    <span className="text-xs text-muted-foreground">{isOnline ? 'Connecté' : 'Hors ligne'}</span>
                </div>
                {user && (
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function AppLayout({ children, tournament }: PropsWithChildren<{ tournament?: any }>) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const roles = auth?.roles ?? [];
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
                <SidebarContent tournament={tournament} user={user} roles={roles} />
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4">
                <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-foreground hover:bg-surface-hover">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 ml-3">
                    <img src={logo} alt="MGC Score" className="w-7 h-7 object-contain" />
                    <span className="text-sm font-bold text-foreground">MGC Score</span>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <SidebarContent
                            tournament={tournament}
                            user={user}
                            roles={roles}
                            onNavClick={() => setMobileOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="lg:pl-72 pt-14 lg:pt-0 min-h-screen">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
