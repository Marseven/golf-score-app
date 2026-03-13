import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Trophy, Wifi, Smartphone, BarChart3, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.png';

const features = [
    {
        icon: Trophy,
        title: 'Classement en direct',
        description: 'Résultats mis à jour automatiquement, trou par trou.',
        accent: 'from-amber-500/20 to-amber-600/5',
        iconColor: 'text-amber-400',
        delay: 'stagger-1',
    },
    {
        icon: Wifi,
        title: 'Scores temps réel',
        description: 'Saisie terrain instantanément visible par tous.',
        accent: 'from-emerald-500/20 to-emerald-600/5',
        iconColor: 'text-emerald-400',
        delay: 'stagger-2',
    },
    {
        icon: Smartphone,
        title: 'Mobile first',
        description: 'Optimisé pour tous les appareils, sans installation.',
        accent: 'from-blue-500/20 to-blue-600/5',
        iconColor: 'text-blue-400',
        delay: 'stagger-3',
    },
    {
        icon: BarChart3,
        title: 'Multi-format',
        description: 'Stroke Play et Stableford avec calcul automatique.',
        accent: 'from-violet-500/20 to-violet-600/5',
        iconColor: 'text-violet-400',
        delay: 'stagger-4',
    },
];

export default function Home() {
    return (
        <PublicLayout transparentHeader>
            <Head title="Accueil" />

            {/* Hero */}
            <section className="grain relative -mt-16 pt-16 min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/10 to-background" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(160_84%_39%/0.12),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(38_92%_50%/0.04),transparent)]" />

                {/* Decorative grid lines */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(hsl(160 84% 39% / 0.5) 1px, transparent 1px),
                                      linear-gradient(90deg, hsl(160 84% 39% / 0.5) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }} />

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border mb-8" style={{ animation: 'fadeSlideIn 0.6s ease-out both' }}>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground tracking-wide">Suivi de scores professionnel</span>
                    </div>

                    {/* Logo */}
                    <div className="mb-6" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.1s both' }}>
                        <img src={logo} alt="Manga Golf Club" className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto mb-4" />
                        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-foreground leading-[1.1]">
                            MGC <span className="text-primary">Score</span>
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.2s both' }}>
                        Le classement de votre tournoi, en direct, trou par trou.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.3s both' }}>
                        <Link
                            href={route('tournois')}
                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:bg-primary/90 glow-emerald transition-all duration-300 hover:scale-[1.02]"
                        >
                            Voir les tournois
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            href={route('login')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-foreground/80 bg-surface border border-border hover:bg-surface-hover hover:border-border transition-all duration-300"
                        >
                            Espace organisateur
                        </Link>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </section>

            {/* Features */}
            <section className="relative py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary/60 mb-4">Fonctionnalités</p>
                        <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-4">
                            Tout pour vos tournois
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            De la saisie terrain au classement diffusé sur écran TV, une solution complète.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className={`glass-card group hover:border-border transition-all duration-500 hover:scale-[1.02] ${feature.delay}`}
                                style={{ animation: 'fadeSlideIn 0.5s ease-out both' }}
                            >
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className="relative">
                                    <feature.icon className={`w-6 h-6 ${feature.iconColor} mb-5`} />
                                    <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="relative py-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(160_84%_39%/0.06),transparent_70%)]" />
                <div className="relative max-w-2xl mx-auto text-center">
                    <img src={logo} alt="MGC Score" className="w-12 h-12 object-contain mx-auto mb-6 opacity-40" />
                    <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-4">
                        Prêt à commencer ?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Créez votre compte et lancez votre premier tournoi en quelques minutes.
                    </p>
                    <Link
                        href={route('register')}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-surface border border-border text-foreground rounded-2xl text-sm font-semibold hover:bg-surface-hover transition-all duration-300"
                    >
                        Créer un compte gratuitement
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8 px-4">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="MGC Score" className="w-5 h-5 object-contain opacity-50" />
                        <span className="text-xs text-muted-foreground">MGC Score</span>
                    </div>
                    <p className="text-xs text-muted-foreground/50">&copy; {new Date().getFullYear()}</p>
                </div>
            </footer>
        </PublicLayout>
    );
}
