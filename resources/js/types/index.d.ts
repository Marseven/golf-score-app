export interface User {
    id: string;
    name: string;
    email: string;
    email_verified_at?: string;
    avatar_path?: string | null;
    avatar_url?: string | null;
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
    phase_count: number;
    score_aggregation: 'cumulative' | 'separate';
    rules: string | null;
    registration_open: boolean;
    registration_fee: number;
    registration_currency: string;
    caddie_master_pin: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    players_count?: number;
    groups_count?: number;
    courses?: Course[];
    categories?: Category[];
    players?: Player[];
    groups?: Group[];
    holes?: Hole[];
    cuts?: Cut[];
}

export interface Course {
    id: string;
    tournament_id: string;
    name: string;
}

export interface Category {
    id: string;
    tournament_id: string;
    course_id?: string | null;
    course?: Course | null;
    name: string;
    short_name: string;
    color: string;
    registration_fee: number;
    handicap_coefficient?: number;
    max_phases?: number | null;
}

export interface Hole {
    id: string;
    tournament_id: string;
    course_id?: string | null;
    course?: Course | null;
    number: number;
    par: number;
    distance: number;
    hole_index: number;
}

export interface Group {
    id: string;
    tournament_id: string;
    phase: number;
    category_id: string | null;
    course_id: string | null;
    category?: Category | null;
    course?: Course | null;
    code: string;
    tee_time: string;
    tee_date: string | null;
    hole_start: number;
    hole_end: number;
    marker_id: string | null;
    marker_phone: string | null;
    marker_token: string | null;
    marker_pin: string | null;
    scores_confirmed_at: string | null;
    confirmed_by_name: string | null;
    marker?: User | null;
    markers?: (User & { pivot?: { marker_pin?: string } })[];
    players?: Player[];
}

export interface Cut {
    id: string;
    tournament_id: string;
    category_id: string;
    after_phase: number;
    qualified_count: number | null;
    applied_at: string | null;
    category?: Category;
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
    gender: 'M' | 'F' | null;
    nationality: string | null;
    email: string | null;
    phone: string | null;
    handicap: number;
    registration_status: 'pending' | 'approved' | 'rejected';
    cut_after_phase: number | null;
    category?: Category | null;
    group?: Group | null;
    scores?: Score[];
}

export interface Score {
    id: string;
    player_id: string;
    hole_id: string;
    strokes: number;
    phase: number;
    synced: boolean;
}

export interface Member {
    id: string;
    member_code: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    handicap_index: number;
    category_type: 'professional' | 'amateur';
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface CategoryPar {
    category_id: string;
    hole_id: string;
    par: number;
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

export interface Penalty {
    id: string;
    tournament_id: string;
    player_id: string;
    strokes: number;
    reason: string;
    phase: number;
    created_by: string | null;
    created_at?: string;
    player?: Player;
    creator?: User;
}
