import { useMemo } from "react";
import { computeHabitWeeklyStats } from "../utils/completionHelpers.js";

export default function usePetHealth({ habits, weekStats, prefs, nowDate }) {
  return useMemo(() => {
    const { numer: habitNumer, denom: habitDenom } = computeHabitWeeklyStats({ habits, prefs, nowDate });
    const totalNumer = weekStats.numer + habitNumer;
    const totalDenom = weekStats.denom + habitDenom;
    if (totalDenom === 0) return "egg";
    const weeklyPct = Math.round((totalNumer / totalDenom) * 100);
    return weeklyPct >= prefs.threshold ? "healthy" : "sick";
  }, [habits, weekStats, prefs, nowDate.toDateString()]);
}
