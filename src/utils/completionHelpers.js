import { dateKey, startOfWeekDate } from "./dateHelpers.js";

// Returns the effective weekly goal for a habit, prorated if the habit was
// created mid-week during the given week.
const effectiveWeeklyGoal = (habit, weekStartDate, weekStart) => {
  let goal = habit.weeklyGoal;
  if (habit.createdAt !== undefined) {
    const habitCreationWeekStart = startOfWeekDate(new Date(habit.createdAt), weekStart);
    if (dateKey(weekStartDate) === dateKey(habitCreationWeekStart)) {
      const creationDay = new Date(habit.createdAt).getDay();
      const creationDayIdx = weekStart === "MON" ? (creationDay + 6) % 7 : creationDay;
      const daysRemaining = 7 - creationDayIdx;
      goal = Math.max(1, Math.round(habit.weeklyGoal * (daysRemaining / 7)));
    }
  }
  return goal;
};

// Full-week denominator: uses the full weekly goal as denom, credits any
// completions up to today (on any day of the week, capped at goal).
// Used for display and crack progress so the % reflects true weekly progress.
export const computeHabitProgressStats = ({ habits, prefs, nowDate }) => {
  const weekStart = startOfWeekDate(nowDate, prefs.weekStart);
  const jsDay = nowDate.getDay();
  const todayIdx = prefs.weekStart === "MON" ? (jsDay + 6) % 7 : jsDay;

  let numer = 0, denom = 0;
  for (const h of habits) {
    const goal = effectiveWeeklyGoal(h, weekStart, prefs.weekStart);
    denom += goal;
    let done = 0;
    for (let i = 0; i <= todayIdx; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      if (h.completions?.[dateKey(dayDate)]) done++;
    }
    numer += Math.min(done, goal);
  }

  return { numer, denom };
};

// Used for rollover evaluation (called at end of week = all days elapsed anyway)
// and for health checks. Counts completions on any day, capped at goal.
export const computeHabitWeeklyStats = ({ habits, prefs, nowDate }) => {
  const weekStart = startOfWeekDate(nowDate, prefs.weekStart);
  const jsDay = nowDate.getDay();
  const todayIdx = prefs.weekStart === "MON" ? (jsDay + 6) % 7 : jsDay;

  let numer = 0, denom = 0;
  for (const h of habits) {
    const goal = effectiveWeeklyGoal(h, weekStart, prefs.weekStart);
    denom += goal;
    let done = 0;
    for (let i = 0; i <= todayIdx; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      if (h.completions?.[dateKey(dayDate)]) done++;
    }
    numer += Math.min(done, goal);
  }

  return { numer, denom };
};
