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
    // Afrique Centrale
    ['GA', 'Gabon'],
    ['CM', 'Cameroun'],
    ['CG', 'Congo-Brazzaville'],
    ['CD', 'RD Congo'],
    ['GQ', 'Guinée Équatoriale'],
    ['TD', 'Tchad'],
    ['CF', 'Centrafrique'],
    ['ST', 'São Tomé-et-Príncipe'],
    // Afrique de l'Ouest
    ['CI', "Côte d'Ivoire"],
    ['SN', 'Sénégal'],
    ['ML', 'Mali'],
    ['BF', 'Burkina Faso'],
    ['BJ', 'Bénin'],
    ['TG', 'Togo'],
    ['GH', 'Ghana'],
    ['NG', 'Nigeria'],
    ['GN', 'Guinée'],
    ['GW', 'Guinée-Bissau'],
    ['NE', 'Niger'],
    ['SL', 'Sierra Leone'],
    ['LR', 'Liberia'],
    ['MR', 'Mauritanie'],
    ['CV', 'Cap-Vert'],
    ['GM', 'Gambie'],
    // Afrique de l'Est
    ['KE', 'Kenya'],
    ['TZ', 'Tanzanie'],
    ['UG', 'Ouganda'],
    ['RW', 'Rwanda'],
    ['BI', 'Burundi'],
    ['ET', 'Éthiopie'],
    ['DJ', 'Djibouti'],
    ['SO', 'Somalie'],
    ['ER', 'Érythrée'],
    ['SS', 'Soudan du Sud'],
    ['SD', 'Soudan'],
    ['KM', 'Comores'],
    ['SC', 'Seychelles'],
    // Afrique Australe
    ['ZA', 'Afrique du Sud'],
    ['MG', 'Madagascar'],
    ['MU', 'Maurice'],
    ['MZ', 'Mozambique'],
    ['ZW', 'Zimbabwe'],
    ['ZM', 'Zambie'],
    ['BW', 'Botswana'],
    ['NA', 'Namibie'],
    ['AO', 'Angola'],
    ['MW', 'Malawi'],
    ['SZ', 'Eswatini'],
    ['LS', 'Lesotho'],
    // Afrique du Nord
    ['MA', 'Maroc'],
    ['DZ', 'Algérie'],
    ['TN', 'Tunisie'],
    ['EG', 'Égypte'],
    ['LY', 'Libye'],
    // Europe
    ['FR', 'France'],
    ['BE', 'Belgique'],
    ['CH', 'Suisse'],
    ['GB', 'Royaume-Uni'],
    ['DE', 'Allemagne'],
    ['ES', 'Espagne'],
    ['PT', 'Portugal'],
    ['IT', 'Italie'],
    ['NL', 'Pays-Bas'],
    // Amériques
    ['US', 'États-Unis'],
    ['CA', 'Canada'],
    ['BR', 'Brésil'],
    // Asie & Moyen-Orient
    ['CN', 'Chine'],
    ['JP', 'Japon'],
    ['IN', 'Inde'],
    ['LB', 'Liban'],
    ['AE', 'Émirats Arabes Unis'],
    ['SA', 'Arabie Saoudite'],
];
