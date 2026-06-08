import { dateKey, startOfWeekDate } from "./dateHelpers.js";

// Is this habit expected to be done on the given calendar day?
// Uses "first N days of the week" rule where N = effective goal.
const isHabitExpectedOnDay = (habit, dayDate, weekStart) => {
  if (habit.createdAt !== undefined) {
    if (habit.createdAt >= dayDate.getTime() + 24 * 3600 * 1000) return false;
  }
  const weekStartDate = startOfWeekDate(dayDate, weekStart);
  const diffMs = dayDate.getTime() - weekStartDate.getTime();
  const dayIdx = Math.round(diffMs / (24 * 3600 * 1000));
  let effectiveGoal = habit.weeklyGoal;
  if (habit.createdAt !== undefined) {
    const habitCreationWeekStart = startOfWeekDate(new Date(habit.createdAt), weekStart);
    if (dateKey(weekStartDate) === dateKey(habitCreationWeekStart)) {
      const creationDay = new Date(habit.createdAt).getDay();
      const creationDayIdx = weekStart === "MON" ? (creationDay + 6) % 7 : creationDay;
      const daysRemaining = 7 - creationDayIdx;
      effectiveGoal = Math.max(1, Math.round(habit.weeklyGoal * (daysRemaining / 7)));
    }
  }
  return dayIdx < effectiveGoal;
};

// Compute current week's habit contribution to numerator and denominator only.
// Task contribution is tracked separately via explicit weekStats in app state.
export const computeHabitWeeklyStats = ({ habits, prefs, nowDate }) => {
  const weekStart = startOfWeekDate(nowDate, prefs.weekStart);
  const jsDay = nowDate.getDay();
  const todayIdx = prefs.weekStart === "MON" ? (jsDay + 6) % 7 : jsDay;

  let numer = 0, denom = 0;
  for (let i = 0; i <= todayIdx; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const dayK = dateKey(dayDate);
    for (const h of habits) {
      if (isHabitExpectedOnDay(h, dayDate, prefs.weekStart)) {
        denom++;
        if (h.completions?.[dayK]) numer++;
      }
    }
  }

  return { numer, denom };
};
