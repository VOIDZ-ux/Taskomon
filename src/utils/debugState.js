const LS_KEY = "taskomon_state";
const LAST_CHECK_KEY = "taskomonLastCheckTime";

const dk = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const monday = (d) => {
  const dd = new Date(d);
  const offset = (dd.getDay() + 6) % 7;
  dd.setDate(dd.getDate() - offset);
  dd.setHours(0, 0, 0, 0);
  return dd;
};

// ?debug=sleep — hatched pet, last activity 4 hours ago → starts sleepy immediately.
// Complete the active task to test wake-from-sleep flow.
export function initSleepDebug() {
  console.log("[DEBUG] initSleepDebug() fired");
  const now = Date.now();
  const today = new Date(now);

  const currentWeekStart = monday(today);
  const todayKey = dk(today);
  const currentWeekKey = dk(currentWeekStart);

  const state = {
    habits: [],
    tasks: [
      {
        id: "debug-task-1",
        name: "Complete me to wake the pet! 🌟",
        color: "#a78bfa",
        kind: "task",
        createdAt: now - 4 * 3600 * 1000,
        dueDate: todayKey,
        completedDate: null,
        missedDays: 0,
      },
    ],
    pantry: [],
    taskHistory: [],
    ghostHabits: [],
    prefs: {
      weekStart: "MON",
      threshold: 65,
      showClock: true,
      h24: true,
      resetHour: 0,
      pantryCollapsed: false,
      creatureState: "hatched",
      lastWeeklyRollover: currentWeekStart.getTime(), // already rolled over → no rollover on load
    },
    weekStats: {
      numer: 0,
      denom: 1,
      weekKey: currentWeekKey, // matches current week → no reset on load
    },
  };

  localStorage.setItem(LS_KEY, JSON.stringify(state));
  // 4 hours ago → inactivity check fires immediately → pet starts sleepy
  localStorage.setItem(LAST_CHECK_KEY, String(now - 4 * 3600 * 1000));
}
