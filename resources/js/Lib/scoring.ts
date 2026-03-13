export interface PlayerData {
  id: string;
  name: string;
  handicap: number;
  category_id: string | null;
  category?: { name: string; color: string; short_name: string } | null;
}

export interface HoleData {
  id: string;
  number: number;
  par: number;
  distance: number;
  hole_index: number;
}

export interface ScoreData {
  id: string;
  player_id: string;
  hole_id: string;
  strokes: number;
  synced: boolean;
}

export interface LeaderboardEntry {
  player: PlayerData;
  categoryName: string;
  categoryColor: string;
  totalStrokes: number;
  totalPar: number;
  strokeToPar: number;
  stablefordPoints: number;
  holesPlayed: number;
}

export function calculateStablefordPoints(strokes: number, par: number): number {
  return Math.max(0, par - strokes + 2);
}

export function buildLeaderboard(
  players: PlayerData[],
  scores: ScoreData[],
  holes: HoleData[],
  categoryId?: string,
  mode: "stroke" | "stableford" = "stroke"
): LeaderboardEntry[] {
  const holeMap = new Map(holes.map((h) => [h.id, h]));
  const scoresByPlayer = new Map<string, ScoreData[]>();
  for (const s of scores) {
    const arr = scoresByPlayer.get(s.player_id) || [];
    arr.push(s);
    scoresByPlayer.set(s.player_id, arr);
  }

  const filtered = categoryId
    ? players.filter((p) => p.category_id === categoryId)
    : players;

  const entries: LeaderboardEntry[] = filtered.map((player) => {
    const playerScores = scoresByPlayer.get(player.id) || [];
    let totalStrokes = 0;
    let totalPar = 0;
    let stablefordPoints = 0;

    for (const s of playerScores) {
      const hole = holeMap.get(s.hole_id);
      if (!hole) continue;
      totalStrokes += s.strokes;
      totalPar += hole.par;
      stablefordPoints += calculateStablefordPoints(s.strokes, hole.par);
    }

    return {
      player,
      categoryName: player.category?.name ?? "",
      categoryColor: player.category?.color ?? "",
      totalStrokes,
      totalPar,
      strokeToPar: totalStrokes - totalPar,
      stablefordPoints,
      holesPlayed: playerScores.length,
    };
  });

  entries.sort((a, b) =>
    mode === "stroke"
      ? a.strokeToPar - b.strokeToPar
      : b.stablefordPoints - a.stablefordPoints
  );

  return entries;
}
