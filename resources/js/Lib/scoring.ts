export interface PlayerData {
  id: string;
  name: string;
  handicap: number;
  nationality?: string | null;
  is_withdrawn?: boolean;
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
  max_phases?: number | null;
  holes_per_round?: number;
}

export interface PenaltyData {
  player_id: string;
  strokes: number;
  phase: number;
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
  penaltyStrokes: number;
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
  categoryId?: string | string[],
  mode: "stroke" | "stableford" = "stroke",
  categories?: CategoryData[],
  phase?: number,
  scoreAggregation?: 'cumulative' | 'separate',
  categoryPars?: { category_id: string; hole_id: string; par: number }[],
  penalties?: PenaltyData[]
): LeaderboardEntry[] {
  const holeMap = new Map(holes.map((h) => [h.id, h]));
  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, c])
  );

  // Build category-specific par lookup
  const catParMap = new Map<string, number>();
  if (categoryPars) {
    for (const cp of categoryPars) {
      catParMap.set(`${cp.category_id}:${cp.hole_id}`, cp.par);
    }
  }
  const getEffectivePar = (holeId: string, holePar: number, playerCategoryId: string | null): number => {
    if (playerCategoryId) {
      const key = `${playerCategoryId}:${holeId}`;
      const catPar = catParMap.get(key);
      if (catPar !== undefined) return catPar;
    }
    return holePar;
  };

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
    ? Array.isArray(categoryId)
      ? players.filter((p) => categoryId.includes(p.category_id ?? ''))
      : players.filter((p) => p.category_id === categoryId)
    : players;

  // Filter out players cut before this phase if phase is specified
  if (phase !== undefined && phase > 1) {
    filtered = filtered.filter(
      (p) => p.cut_after_phase == null || p.cut_after_phase >= phase
    );
  }

  // Build penalty lookup by player
  const penaltiesByPlayer = new Map<string, number>();
  if (penalties) {
    for (const p of penalties) {
      if (phase !== undefined) {
        if (scoreAggregation === 'separate' && p.phase !== phase) continue;
        if (scoreAggregation !== 'separate' && p.phase > phase) continue;
      }
      penaltiesByPlayer.set(p.player_id, (penaltiesByPlayer.get(p.player_id) ?? 0) + p.strokes);
    }
  }

  const entries: LeaderboardEntry[] = filtered.map((player) => {
    const allPlayerScores = scoresByPlayer.get(player.id) || [];

    // Filter scores by category's max_phases
    const cat = player.category_id
      ? categoryMap.get(player.category_id)
      : undefined;
    const catMaxPhases = cat?.max_phases ?? undefined;
    const playerScores = catMaxPhases
      ? allPlayerScores.filter((s) => s.phase <= catMaxPhases)
      : allPlayerScores;

    let totalStrokes = 0;
    let totalPar = 0;
    let stablefordPoints = 0;
    let netStablefordPoints = 0;

    const coefficient = cat?.handicap_coefficient ?? player.category?.handicap_coefficient ?? 1.0;
    const playingHandicap = Math.round(player.handicap * coefficient);

    for (const s of playerScores) {
      const hole = holeMap.get(s.hole_id);
      if (!hole) continue;
      const effectivePar = getEffectivePar(s.hole_id, hole.par, player.category_id);
      totalStrokes += s.strokes;
      totalPar += effectivePar;
      stablefordPoints += calculateStablefordPoints(s.strokes, effectivePar);
      netStablefordPoints += calculateNetStablefordPoints(
        s.strokes,
        effectivePar,
        hole.hole_index,
        playingHandicap
      );
    }

    const penaltyStrokes = penaltiesByPlayer.get(player.id) ?? 0;
    totalStrokes += penaltyStrokes;

    return {
      player,
      categoryName: player.category?.name ?? "",
      categoryColor: player.category?.color ?? "",
      totalStrokes,
      totalPar,
      strokeToPar: totalStrokes - totalPar,
      stablefordPoints,
      netStablefordPoints: Math.max(0, netStablefordPoints - penaltyStrokes),
      playingHandicap,
      holesPlayed: playerScores.length,
      penaltyStrokes,
    };
  });

  entries.sort((a, b) =>
    mode === "stroke"
      ? a.strokeToPar - b.strokeToPar
      : b.netStablefordPoints - a.netStablefordPoints
  );

  return entries;
}
