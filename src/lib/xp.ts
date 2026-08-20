export interface XpAward {
  category: string;
  xpGained: number;
  newTotalXp: number;
  level: number;
}

export function buildXpAward(category: string, oldScore: number, newScore: number): XpAward {
  const delta = Math.max(0, newScore - oldScore);
  return {
    category,
    xpGained: Math.round(delta * 10),
    newTotalXp: Math.round(newScore * 10),
    level: Math.floor((newScore * 10) / 100) + 1,
  };
}
