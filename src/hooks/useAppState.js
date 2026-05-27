import { useState, useEffect, useRef } from "react";
import { adjustedDateKey, dateKey, startOfWeekDate } from "../utils/dateHelpers.js";
import { sameColor } from "../utils/colorHelpers.js";

const LS_KEY = "taskomon_state";

const DEFAULT_PREFS = {
  weekStart: "MON",
  threshold: 65,
  showClock: true,
  h24: true,
  resetHour: 0,
  habitsCollapsed: false,
  tasksCollapsed: false,
  pantryCollapsed: false,
  creatureState: "egg",
  lastWeeklyRollover: null,
  firstFullWeekStartMs: null,
  hatchPending: false,
  setupDone: false,
  onboardingDone: false,
};

const DEFAULT_WEEK_STATS = { numer: 0, denom: 0, weekKey: "" };

const buildEmptyState = () => ({
  habits: [],
  tasks: [],
  pantry: [],
  taskHistory: [],
  ghostHabits: [],
  prefs: { ...DEFAULT_PREFS },
  weekStats: { ...DEFAULT_WEEK_STATS },
});

const loadState = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return buildEmptyState();
    const parsed = JSON.parse(raw);
    const savedPrefs = parsed.prefs || {};
    // If this is an existing user (rollover was already initialised before
    // this version introduced setupDone/onboardingDone), skip both popups
    // so the update never nukes their progress.
    const isExistingUser = savedPrefs.lastWeeklyRollover != null;
    return {
      habits: parsed.habits || [],
      tasks: parsed.tasks || [],
      pantry: parsed.pantry || [],
      taskHistory: parsed.taskHistory || [],
      ghostHabits: parsed.ghostHabits || [],
      prefs: {
        ...DEFAULT_PREFS,
        ...savedPrefs,
        ...(isExistingUser ? { setupDone: true, onboardingDone: true } : {}),
      },
      weekStats: { ...DEFAULT_WEEK_STATS, ...(parsed.weekStats || {}) },
    };
  } catch {
    return buildEmptyState();
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      habits: state.habits,
      tasks: state.tasks,
      pantry: state.pantry,
      taskHistory: state.taskHistory,
      ghostHabits: state.ghostHabits,
      prefs: state.prefs,
      weekStats: state.weekStats,
    }));
  } catch {}
};

export default function useAppState(showToast) {
  const initial = loadState();
  const [habits, setHabits] = useState(initial.habits);
  const [tasks, setTasks] = useState(initial.tasks);
  const [pantry, setPantry] = useState(initial.pantry);
  const [taskHistory, setTaskHistory] = useState(initial.taskHistory);
  const [ghostHabits, setGhostHabits] = useState(initial.ghostHabits);
  const [prefs, setPrefs] = useState(initial.prefs);
  const [weekStats, setWeekStats] = useState(initial.weekStats);

  const saveTimer = useRef();

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState({ habits, tasks, pantry, taskHistory, ghostHabits, prefs, weekStats });
    }, 300);
  }, [habits, tasks, pantry, taskHistory, ghostHabits, prefs, weekStats]);

  const todayK = (nowDate) => adjustedDateKey(nowDate, prefs.resetHour);

  // ─── Rollover ─────────────────────────────────────────────
  const runRollover = (nowDate) => {
    const currentDay = todayK(nowDate);
    const currentWeekKey = dateKey(startOfWeekDate(nowDate, prefs.weekStart));

    const isNewWeek = weekStats.weekKey !== "" && weekStats.weekKey !== currentWeekKey;
    const needsInit = weekStats.weekKey === "";

    // Base weekStats for this rollover
    let ws = isNewWeek
      ? { numer: 0, denom: 0, weekKey: currentWeekKey }
      : { ...weekStats, weekKey: needsInit ? currentWeekKey : weekStats.weekKey };

    const expired = tasks.filter(t => t.dueDate !== currentDay);

    if (expired.length === 0) {
      if (ws.weekKey !== weekStats.weekKey) setWeekStats(ws);
      return;
    }

    let doneCount = 0, missedCount = 0;
    const historyEntries = [];
    const removeIds = new Set();
    const updatedMissed = new Map();

    for (const t of expired) {
      const wasDone = t.completedDate === t.dueDate;
      historyEntries.push({
        id: `h-${t.id}-${Date.now()}`, name: t.name, color: t.color,
        date: t.dueDate, status: wasDone ? "done" : "missed",
      });
      if (wasDone) {
        doneCount++;
        removeIds.add(t.id);
        // denom/numer for completed tasks stay as-is
      } else {
        missedCount++;
        ws = { ...ws, denom: ws.denom + 1 }; // new day slot for missed task
        updatedMissed.set(t.id, {
          ...t, dueDate: currentDay, completedDate: null,
          missedDays: (t.missedDays || 0) + 1,
        });
      }
    }

    setTaskHistory(prev => [...prev, ...historyEntries]);
    setTasks(prev => prev
      .filter(t => !removeIds.has(t.id))
      .map(t => updatedMissed.has(t.id) ? updatedMissed.get(t.id) : t)
    );
    setWeekStats(ws);

    const parts = [];
    if (doneCount) parts.push(`✓ ${doneCount} done`);
    if (missedCount) parts.push(`✗ ${missedCount} missed`);
    showToast(`day rolled · ${parts.join(" · ")}`, missedCount > 0 ? "" : "lime");
  };

  // ─── Item lookup ──────────────────────────────────────────
  const findItem = (id) =>
    habits.find(x => x.id === id) ||
    tasks.find(x => x.id === id) ||
    pantry.find(x => x.id === id);

  // ─── Handlers ─────────────────────────────────────────────
  const GRACE_MS = 3 * 60 * 60 * 1000;

  const addItem = ({ kind, name, color, weeklyGoal }, toPantryFlag, currentTodayK) => {
    if (kind === "habit") {
      setHabits(prev => [...prev, {
        id: `h-${name}-${Date.now()}`, name, color, kind: "habit",
        weeklyGoal: weeklyGoal || 5, completions: {}, createdAt: Date.now(),
      }]);
      showToast(`+ ${name} (habit)`, "lime");
    } else if (toPantryFlag) {
      setPantry(prev => [...prev, { id: `p-${name}-${Date.now()}`, name, color, kind: "pantry" }]);
      showToast(`+ ${name} → pantry`, "lime");
    } else {
      setTasks(prev => [...prev, {
        id: `t-${name}-${Date.now()}`, name, color, kind: "task",
        createdAt: Date.now(), dueDate: currentTodayK, completedDate: null, missedDays: 0,
      }]);
      // Task creation immediately adds 1 to denominator (even during grace period)
      setWeekStats(prev => ({ ...prev, denom: prev.denom + 1 }));
      showToast(`+ ${name} (task)`, "lime");
    }
  };

  const updateItem = (id, patch) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h));
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    setPantry(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    showToast(`${patch.name || "item"} updated`, "lime");
  };

  const toggleHabitToday = (id, currentTodayK) => {
    const h = habits.find(x => x.id === id);
    const wasDone = !!h?.completions[currentTodayK];
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const c = { ...h.completions };
      if (c[currentTodayK]) delete c[currentTodayK]; else c[currentTodayK] = true;
      return { ...h, completions: c };
    }));
    showToast(wasDone ? `${h?.name} unchecked` : `✓ ${h?.name}`, wasDone ? "" : "lime");
  };

  const toggleTaskCompletion = (id, currentTodayK) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const isDone = t.completedDate === currentTodayK;
    setTasks(prev => prev.map(x =>
      x.id === id ? { ...x, completedDate: isDone ? null : currentTodayK } : x
    ));
    // Completing adds to numer; uncompleting removes from numer
    setWeekStats(prev => ({
      ...prev,
      numer: Math.max(0, prev.numer + (isDone ? -1 : 1)),
    }));
    showToast(isDone ? `${t.name} unchecked` : `✓ ${t.name}`, isDone ? "" : "lime");
  };

  const sendTaskToPantry = (id) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    if ((t.createdAt + GRACE_MS) <= Date.now()) {
      showToast("grace expired");
      return;
    }
    setPantry(prev => [...prev, { id: `p-${t.name}-${Date.now()}`, name: t.name, color: t.color, kind: "pantry" }]);
    setTasks(prev => prev.filter(x => x.id !== id));
    // Returning to pantry during grace removes the creation slot
    setWeekStats(prev => ({ ...prev, denom: Math.max(0, prev.denom - 1) }));
    showToast(`${t.name} → pantry`);
  };

  const activatePantry = (id, currentTodayK) => {
    const p = pantry.find(x => x.id === id);
    if (!p) return;
    setTasks(prev => [...prev, {
      id: `t-${p.name}-${Date.now()}`, name: p.name, color: p.color, kind: "task",
      createdAt: Date.now(), dueDate: currentTodayK, completedDate: null, missedDays: 0,
    }]);
    setPantry(prev => prev.filter(x => x.id !== id));
    // Activating from pantry adds 1 to denominator
    setWeekStats(prev => ({ ...prev, denom: prev.denom + 1 }));
    showToast(`↑ ${p.name} activated`, "lime");
  };

  const deleteItemKeepHistory = (id) => {
    const item = findItem(id);
    if (!item) return;
    if (item.kind === "habit") {
      setGhostHabits(prev => [...prev, item]);
      setHabits(prev => prev.filter(x => x.id !== id));
    } else if (item.kind === "task") {
      setTasks(prev => prev.filter(x => x.id !== id));
      // Spec: completed tasks keep their contribution; uncompleted removes today's slot only
      if (!item.completedDate) {
        setWeekStats(prev => ({ ...prev, denom: Math.max(0, prev.denom - 1) }));
      }
    } else if (item.kind === "pantry") {
      setPantry(prev => prev.filter(x => x.id !== id));
    }
    showToast(`${item.name} archived`);
    return true;
  };

  const deleteItemWipe = (id) => {
    const item = findItem(id);
    if (!item) return;
    if (item.kind === "habit") {
      setHabits(prev => prev.filter(x => x.id !== id));
    } else if (item.kind === "task") {
      setTasks(prev => prev.filter(x => x.id !== id));
      // Full wipe: remove all of this task's weekStats contributions
      setWeekStats(prev => ({
        ...prev,
        numer: Math.max(0, prev.numer - (item.completedDate ? 1 : 0)),
        denom: Math.max(0, prev.denom - 1 - (item.missedDays || 0)),
      }));
    } else if (item.kind === "pantry") {
      setPantry(prev => prev.filter(x => x.id !== id));
    }
    if (item.kind !== "habit") {
      setTaskHistory(prev => prev.filter(h => !sameColor(h.color, item.color)));
    }
    showToast(`${item.name} wiped`);
    return true;
  };

  const resetWeekStats = (newWeekKey) => {
    setWeekStats({ numer: 0, denom: 0, weekKey: newWeekKey });
  };

  const doReset = () => {
    localStorage.clear();
    setHabits([]);
    setTasks([]);
    setPantry([]);
    setTaskHistory([]);
    setGhostHabits([]);
    setPrefs({ ...DEFAULT_PREFS });
    setWeekStats({ ...DEFAULT_WEEK_STATS });
    showToast("Progress reset");
  };

  const importBackup = (data) => {
    setHabits(data.habits || []);
    setTasks(data.tasks || []);
    setPantry(data.pantry || []);
    setTaskHistory(data.taskHistory || []);
    setGhostHabits(data.ghostHabits || []);
    setPrefs(prev => ({ ...DEFAULT_PREFS, ...prev, ...(data.prefs || {}) }));
    setWeekStats({ ...DEFAULT_WEEK_STATS, ...(data.weekStats || {}) });
    showToast("Backup imported!", "lime");
  };

  const reorderHabits = (newOrder) => setHabits(newOrder);
  const reorderTasks = (newOrder) => setTasks(newOrder);
  const reorderPantry = (newOrder) => setPantry(newOrder);

  const getSnapshot = () => ({ habits, tasks, pantry, taskHistory, ghostHabits, prefs, weekStats });

  return {
    habits, tasks, pantry, taskHistory, ghostHabits, prefs, setPrefs,
    weekStats, setWeekStats, resetWeekStats,
    findItem, runRollover, todayK,
    addItem, updateItem,
    toggleHabitToday, toggleTaskCompletion,
    sendTaskToPantry, activatePantry,
    deleteItemKeepHistory, deleteItemWipe,
    reorderHabits, reorderTasks, reorderPantry,
    doReset, importBackup, getSnapshot,
  };
}
