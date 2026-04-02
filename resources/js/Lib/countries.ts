// Country code to flag emoji converter
// Uses regional indicator symbols to render flag emojis from ISO 3166-1 alpha-2 codes
export function countryCodeToFlag(code: string): string {
    if (!code || code.length < 2) return '';
    const upper = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(
        ...upper.split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
    );
}

// Common African + international countries for golf tournaments
// Format: [alpha-2 code, label]
export const countries: [string, string][] = [
    ['GA', 'Gabon'],
    ['CM', 'Cameroun'],
    ['CG', 'Congo'],
    ['CD', 'RD Congo'],
    ['CI', "Côte d'Ivoire"],
    ['SN', 'Sénégal'],
    ['ML', 'Mali'],
    ['BF', 'Burkina Faso'],
    ['BJ', 'Bénin'],
    ['TG', 'Togo'],
    ['GH', 'Ghana'],
    ['NG', 'Nigeria'],
    ['GN', 'Guinée'],
    ['GQ', 'Guinée Équatoriale'],
    ['TD', 'Tchad'],
    ['CF', 'Centrafrique'],
    ['MA', 'Maroc'],
    ['DZ', 'Algérie'],
    ['TN', 'Tunisie'],
    ['EG', 'Égypte'],
    ['ZA', 'Afrique du Sud'],
    ['KE', 'Kenya'],
    ['MG', 'Madagascar'],
    ['MU', 'Maurice'],
    ['FR', 'France'],
    ['BE', 'Belgique'],
    ['CH', 'Suisse'],
    ['CA', 'Canada'],
    ['US', 'États-Unis'],
    ['GB', 'Royaume-Uni'],
    ['DE', 'Allemagne'],
    ['ES', 'Espagne'],
    ['PT', 'Portugal'],
    ['IT', 'Italie'],
    ['NL', 'Pays-Bas'],
    ['BR', 'Brésil'],
    ['CN', 'Chine'],
    ['JP', 'Japon'],
    ['IN', 'Inde'],
    ['LB', 'Liban'],
];
