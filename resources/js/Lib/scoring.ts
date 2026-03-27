export interface PlayerData {
  id: string;
  name: string;
  handicap: number;
  category_id: string | null;
  cut_after_phase?: number | null;
  category?: {
    name: string;
    color: string;
    short_name: string;
    course_id?: string | null;
    handicap_coefficient?: number;
  } | null;
}

export interface HoleData {
  id: string;
  number: number;
  par: number;
  distance: number;
  hole_index: number;
  course_id?: string | null;
}

export interface ScoreData {
  id: string;
  player_id: string;
  hole_id: string;
  strokes: number;
  phase: number;
  synced: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  course_id?: string | null;
  handicap_coefficient?: number;
}

export interface LeaderboardEntry {
  player: PlayerData;
  categoryName: string;
  categoryColor: string;
  totalStrokes: number;
  totalPar: number;
  strokeToPar: number;
  stablefordPoints: number;
  netStablefordPoints: number;
  playingHandicap: number;
  holesPlayed: number;
}

export function calculateStablefordPoints(strokes: number, par: number): number {
  return Math.max(0, par - strokes + 2);
}

export function calculateNetStablefordPoints(
  strokes: number,
  par: number,
  holeIndex: number,
  playingHandicap: number
): number {
  let allowance = holeIndex <= playingHandicap ? 1 : 0;
  if (playingHandicap > 18) {
    allowance += holeIndex <= playingHandicap - 18 ? 1 : 0;
  }
  return Math.max(0, par + allowance - strokes + 2);
}

export function buildLeaderboard(
  players: PlayerData[],
  scores: ScoreData[],
  holes: HoleData[],
  categoryId?: string,
  mode: "stroke" | "stableford" = "stroke",
  categories?: CategoryData[],
  phase?: number,
  scoreAggregation?: 'cumulative' | 'separate'
): LeaderboardEntry[] {
  const holeMap = new Map(holes.map((h) => [h.id, h]));
  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, c])
  );

  // Filter scores by phase if specified
  let filteredScores = scores;
  if (phase !== undefined) {
    if (scoreAggregation === 'separate') {
      filteredScores = scores.filter((s) => s.phase === phase);
    } else {
      // cumulative: include scores from phase 1 up to the selected phase
      filteredScores = scores.filter((s) => s.phase <= phase);
    }
  }

  const scoresByPlayer = new Map<string, ScoreData[]>();
  for (const s of filteredScores) {
    const arr = scoresByPlayer.get(s.player_id) || [];
    arr.push(s);
    scoresByPlayer.set(s.player_id, arr);
  }

  let filtered = categoryId
    ? players.filter((p) => p.category_id === categoryId)
    : players;

  // Filter out players cut before this phase if phase is specified
  if (phase !== undefined && phase > 1) {
    filtered = filtered.filter(
      (p) => p.cut_after_phase == null || p.cut_after_phase >= phase
    );
  }

  const entries: LeaderboardEntry[] = filtered.map((player) => {
    const playerScores = scoresByPlayer.get(player.id) || [];
    let totalStrokes = 0;
    let totalPar = 0;
    let stablefordPoints = 0;
    let netStablefordPoints = 0;

    // Resolve handicap coefficient from category
    const cat = player.category_id
      ? categoryMap.get(player.category_id)
      : undefined;
    const coefficient = cat?.handicap_coefficient ?? player.category?.handicap_coefficient ?? 1.0;
    const playingHandicap = Math.round(player.handicap * coefficient);

    for (const s of playerScores) {
      const hole = holeMap.get(s.hole_id);
      if (!hole) continue;
      totalStrokes += s.strokes;
      totalPar += hole.par;
      stablefordPoints += calculateStablefordPoints(s.strokes, hole.par);
      netStablefordPoints += calculateNetStablefordPoints(
        s.strokes,
        hole.par,
        hole.hole_index,
        playingHandicap
      );
    }

    return {
      player,
      categoryName: player.category?.name ?? "",
      categoryColor: player.category?.color ?? "",
      totalStrokes,
      totalPar,
      strokeToPar: totalStrokes - totalPar,
      stablefordPoints,
      netStablefordPoints,
      playingHandicap,
      holesPlayed: playerScores.length,
    };
  });

  entries.sort((a, b) =>
    mode === "stroke"
      ? a.strokeToPar - b.strokeToPar
      : b.netStablefordPoints - a.netStablefordPoints
  );

  return entries;
}
