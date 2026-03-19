export interface User {
    id: string;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        roles: string[];
    };
};

// MGC Score - Domain Types

export interface Tournament {
    id: string;
    name: string;
    start_date: string;
    end_date: string | null;
    club: string;
    status: 'draft' | 'published' | 'active' | 'finished';
    scoring_mode: 'stroke_play' | 'stableford' | 'both';
    rules: string | null;
    registration_open: boolean;
    registration_fee: number;
    registration_currency: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    players_count?: number;
    groups_count?: number;
    categories?: Category[];
    players?: Player[];
    groups?: Group[];
    holes?: Hole[];
}

export interface Category {
    id: string;
    tournament_id: string;
    name: string;
    short_name: string;
    color: string;
    registration_fee: number;
}

export interface Hole {
    id: string;
    tournament_id: string;
    number: number;
    par: number;
    distance: number;
    hole_index: number;
}

export interface Group {
    id: string;
    tournament_id: string;
    code: string;
    tee_time: string;
    tee_date: string | null;
    marker_id: string | null;
    marker_token: string | null;
    marker_pin: string | null;
    marker?: User | null;
    players?: Player[];
}

export interface UserRole {
    id: string;
    user_id: string;
    tournament_id: string | null;
    role: string;
}

export interface Player {
    id: string;
    tournament_id: string;
    category_id: string | null;
    group_id: string | null;
    user_id: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    handicap: number;
    registration_status: 'pending' | 'approved' | 'rejected';
    category?: Category | null;
    group?: Group | null;
    scores?: Score[];
}

export interface Score {
    id: string;
    player_id: string;
    hole_id: string;
    strokes: number;
    synced: boolean;
}

export interface Payment {
    id: string;
    player_id: string;
    tournament_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    ebilling_reference: string | null;
    metadata: Record<string, any> | null;
    created_at?: string;
    player?: Player;
}
