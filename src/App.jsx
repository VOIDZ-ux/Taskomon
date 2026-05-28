import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { sameColor } from "./utils/colorHelpers.js";
import { startOfWeekDate, dateKey } from "./utils/dateHelpers.js";
import { computeHabitWeeklyStats } from "./utils/completionHelpers.js";
import useAppState from "./hooks/useAppState.js";
import usePetHealth from "./hooks/usePetHealth.js";
import MainScreen from "./components/MainScreen.jsx";
import SettingsScreen from "./components/SettingsScreen.jsx";
import ProfileScreen from "./components/ProfileScreen.jsx";
import TaskSheet from "./components/TaskSheet.jsx";
import DeleteDialog from "./components/DeleteDialog.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import IllInfoDialog from "./components/IllInfoDialog.jsx";
import SetupDialog from "./components/SetupDialog.jsx";
import OnboardingDialog from "./components/OnboardingDialog.jsx";
import { App as CapApp } from "@capacitor/app";

export default function App() {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);
  const nowDate = new Date(now);

  const [screen, setScreen] = useState("main");
  const [range, setRange] = useState("This Week");

  // ─── Toast ────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const [toastKind, setToastKind] = useState("");
  const toastTimer = useRef();
  const backPressedOnce = useRef(false);
  const showToast = (msg, kind = "") => {
    setToast(msg); setToastKind(kind);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  // ─── App state ────────────────────────────────────────────
  const appState = useAppState(showToast);
  const {
    habits, tasks, pantry, taskHistory, ghostHabits,
    prefs, setPrefs, findItem,
    weekStats, setWeekStats, resetWeekStats,
    addItem, updateItem,
    toggleHabitToday, toggleTaskCompletion,
    sendTaskToPantry, activatePantry,
    deleteItemKeepHistory, deleteItemWipe,
    reorderHabits, reorderTasks, reorderPantry,
    doReset, importBackup, getSnapshot,
    runRollover, todayK: getTodayK,
  } = appState;

  const todayK = getTodayK(nowDate);

  // ─── Rollover ─────────────────────────────────────────────
  useEffect(() => {
    runRollover(nowDate);
  }, [todayK]);

  // ─── Pet health ───────────────────────────────────────────
  const petState = usePetHealth({ habits, weekStats, prefs, nowDate });

  // ─── Creature display state ───────────────────────────────
  // "egg" | "hatched" | "ill" | "golden" are persisted in prefs.creatureState.
  // "sleepy" / "golden-sleepy" are transient — derived from inactivity, never saved.
  const [displayState, setDisplayState] = useState(prefs.creatureState);

  // Set to true during a rollover that awards golden, so handleHatched knows to finalise as golden
  const pendingGoldenRef = useRef(false);

  // ─── Ill popup ────────────────────────────────────────────
  const [illPopupOpen, setIllPopupOpen] = useState(false);
  const illPopupShownRef = useRef(false);

  useEffect(() => {
    if (displayState === "ill" && !illPopupShownRef.current) {
      illPopupShownRef.current = true;
      setIllPopupOpen(true);
    } else if (displayState === "hatched" || displayState === "golden") {
      illPopupShownRef.current = false;
    }
  }, [displayState]);

  // lastCheckTime: updated on every task/habit completion, stored in localStorage
  const lastCheckTimeRef = useRef(() => {
    const raw = localStorage.getItem("taskomonLastCheckTime");
    return raw ? parseInt(raw, 10) : null;
  });
  // useRef with a function init isn't lazy — call it immediately
  if (typeof lastCheckTimeRef.current === "function") {
    lastCheckTimeRef.current = lastCheckTimeRef.current();
  }

  // ─── Inactivity → sleepy check (every 60 s) ──────────────
  const INACTIVITY_MS = 3 * 60 * 60 * 1000;
  useEffect(() => {
    if (prefs.creatureState !== "hatched" && prefs.creatureState !== "golden") return;
    const sleepyState = prefs.creatureState === "golden" ? "golden-sleepy" : "sleepy";
    const check = () => {
      const lct = lastCheckTimeRef.current;
      if (lct === null || Date.now() - lct >= INACTIVITY_MS) {
        setDisplayState(sleepyState);
      }
    };
    check();
    const id = setInterval(check, 60 * 1000);
    return () => clearInterval(id);
  }, [prefs.creatureState]);

  // ─── Ill → hatched recovery: same calculation as Calendar 7-day view ────────
  useEffect(() => {
    if (prefs.creatureState !== "ill") return;
    // Replicate the Calendar completionPct calculation for the last 7 days,
    // reading directly from habits/tasks/taskHistory (not weekStats).
    let earned = 0, total = 0;
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(nowDate);
      date.setDate(date.getDate() - d);
      days.push(dateKey(date));
    }
    for (const h of habits) {
      const doneThisWeek = days.reduce((acc, k) => acc + (h.completions[k] ? 1 : 0), 0);
      earned += Math.min(doneThisWeek, h.weeklyGoal);
      total += h.weeklyGoal;
    }
    for (const t of taskHistory) {
      if (days.includes(t.date)) {
        total += 1;
        if (t.status === "done") earned += 1;
      }
    }
    for (const t of tasks) {
      if (days.includes(t.dueDate)) {
        total += 1;
        if (t.completedDate === t.dueDate) earned += 1;
      }
    }
    const rate = total > 0 ? earned / total : 0;
    const thresholdNormalized = prefs.threshold > 1 ? prefs.threshold / 100 : prefs.threshold;
    console.log("[ILL RECOVERY CHECK]", {
      earned,
      total,
      rate,
      threshold: prefs.threshold,
      thresholdNormalized,
      creatureState: prefs.creatureState,
    });
    if (rate < thresholdNormalized) return;
    const now = Date.now();
    lastCheckTimeRef.current = now;
    localStorage.setItem("taskomonLastCheckTime", String(now));
    setPrefs(prev => ({ ...prev, creatureState: "hatched" }));
    setDisplayState("hatched");
  }, [habits, tasks, taskHistory, prefs.creatureState, prefs.threshold, nowDate.toDateString()]);

  // ─── Hatch progress for crack overlay (0.0 – 1.0) ───────
  const hatchProgress = useMemo(() => {
    if (prefs.creatureState !== "egg") return 0;
    if (prefs.hatchPending) return 1;
    // No cracks until the first full week has started.
    // firstFullWeekStartMs === null means an old install → always allow.
    const firstFullWeekStartMs = prefs.firstFullWeekStartMs ?? null;
    if (firstFullWeekStartMs !== null) {
      const currentWeekStart = startOfWeekDate(nowDate, prefs.weekStart);
      currentWeekStart.setHours(prefs.resetHour, 0, 0, 0);
      if (currentWeekStart.getTime() < firstFullWeekStartMs) return 0;
    }
    const { numer: hN, denom: hD } = computeHabitWeeklyStats({ habits, prefs, nowDate });
    const totalNumer = weekStats.numer + hN;
    const totalDenom = weekStats.denom + hD;
    if (totalDenom === 0) return 0;
    return Math.min(1, ((totalNumer / totalDenom) * 100) / prefs.threshold);
  }, [prefs.creatureState, prefs.hatchPending, prefs.threshold, prefs.weekStart, prefs.resetHour, prefs.firstFullWeekStartMs, habits, weekStats, nowDate.toDateString()]);

  // ─── Creature wiggle + hatch triggers ────────────────────
  const [wiggleTrigger, setWiggleTrigger] = useState(0);
  const [hatchTrigger, setHatchTrigger] = useState(0);
  const [happyTrigger, setHappyTrigger] = useState(0);

  // ─── Weekly rollover + hatch check ───────────────────────
  useEffect(() => {
    const check = () => {
      // Wait for the guided setup to be completed before doing any rollover work
      if (!prefs.setupDone) return;

      const now = new Date();
      const currentWeekStart = startOfWeekDate(now, prefs.weekStart);
      currentWeekStart.setHours(prefs.resetHour, 0, 0, 0);
      const currentWeekStartMs = currentWeekStart.getTime();

      const lastRollover = prefs.lastWeeklyRollover ?? null;

      // Not yet reached the start of current week at resetHour
      if (Date.now() < currentWeekStartMs) return;

      // Already processed this exact week's rollover
      if (lastRollover !== null && lastRollover >= currentWeekStartMs) return;

      // Should never be null after setup completes, but guard just in case
      if (lastRollover === null) return;

      // A full week has passed — evaluate the completed week
      const { numer: habitNumer, denom: habitDenom } = computeHabitWeeklyStats({
        habits, prefs, nowDate: new Date(currentWeekStartMs - 1)
      });
      const totalNumer = weekStats.numer + habitNumer;
      const totalDenom = weekStats.denom + habitDenom;
      const rate = totalDenom > 0 ? Math.round((totalNumer / totalDenom) * 100) : 0;

      console.log(`[Weekly rollover] rate=${rate}%, threshold=${prefs.threshold}%, creature=${prefs.creatureState}`);

      // lastRollover is the start of the week that just ended — only allow
      // egg hatching if that week is the first full week or later.
      // null means an old install (no firstFullWeekStartMs stored) → allow always.
      const firstFullWeekStartMs = prefs.firstFullWeekStartMs ?? null;
      const weekIsEligible = firstFullWeekStartMs === null || lastRollover >= firstFullWeekStartMs;

      if (prefs.creatureState === "egg" && rate >= prefs.threshold && weekIsEligible) {
        if (rate === 100) pendingGoldenRef.current = true;
        setPrefs(prev => ({ ...prev, hatchPending: true }));
      } else if ((prefs.creatureState === "hatched" || prefs.creatureState === "golden") && rate === 100) {
        setPrefs(prev => ({ ...prev, creatureState: "golden" }));
        setDisplayState("golden");
      } else if (prefs.creatureState === "golden" && rate >= prefs.threshold && rate < 100) {
        setPrefs(prev => ({ ...prev, creatureState: "hatched" }));
        setDisplayState("hatched");
      } else if ((prefs.creatureState === "hatched" || prefs.creatureState === "golden") && rate < prefs.threshold) {
        setPrefs(prev => ({ ...prev, creatureState: "ill" }));
        setDisplayState("ill");
      }

      // Reset weekStats for the new week
      const newWeekKey = dateKey(startOfWeekDate(now, prefs.weekStart));
      resetWeekStats(newWeekKey);
      setPrefs(prev => ({ ...prev, lastWeeklyRollover: currentWeekStartMs }));
    };

    check();
    const id = setInterval(check, 60 * 1000);
    return () => clearInterval(id);
  }, [prefs.setupDone, prefs.weekStart, prefs.resetHour, prefs.lastWeeklyRollover, prefs.threshold, prefs.creatureState, habits, weekStats, resetWeekStats]);

  const handleToggleHabit = (id) => {
    const h = habits.find(x => x.id === id);
    const wasDone = !!h?.completions[todayK];
    toggleHabitToday(id, todayK);

    if (!wasDone) {
      // Completing a habit
      if (prefs.creatureState === "egg") {
        if (prefs.hatchPending) {
          setPrefs(prev => ({ ...prev, hatchPending: false }));
          setHatchTrigger(n => n + 1);
        } else {
          setWiggleTrigger(n => n + 1);
        }
      } else if (prefs.creatureState === "hatched" || prefs.creatureState === "golden") {
        const now = Date.now();
        lastCheckTimeRef.current = now;
        localStorage.setItem("taskomonLastCheckTime", String(now));
        setDisplayState(prefs.creatureState === "golden" ? "golden-happy" : "happy");
        setHappyTrigger(n => n + 1);
      }
    } else {
      // Unchecking — let happy animation finish; only go sleepy when base/sleepy
      const isActive = prefs.creatureState === "hatched" || prefs.creatureState === "golden";
      if (isActive && displayState !== "sleepy" && displayState !== "golden-sleepy" && displayState !== "happy" && displayState !== "golden-happy") {
        const remainingHabits = habits.filter(h2 => h2.id !== id && !!h2.completions[todayK]).length;
        const completedTasks = tasks.filter(t => t.completedDate === todayK).length;
        if (remainingHabits + completedTasks === 0) {
          lastCheckTimeRef.current = null;
          localStorage.removeItem("taskomonLastCheckTime");
          setDisplayState(prefs.creatureState === "golden" ? "golden-sleepy" : "sleepy");
        }
      }
    }
  };

  const handleToggleTask = (id) => {
    const t = tasks.find(x => x.id === id);
    const wasDone = t?.completedDate === todayK;
    toggleTaskCompletion(id, todayK);

    if (!wasDone) {
      // Completing a task
      if (prefs.creatureState === "egg") {
        if (prefs.hatchPending) {
          setPrefs(prev => ({ ...prev, hatchPending: false }));
          setHatchTrigger(n => n + 1);
        } else {
          setWiggleTrigger(n => n + 1);
        }
      } else if (prefs.creatureState === "hatched" || prefs.creatureState === "golden") {
        const now = Date.now();
        lastCheckTimeRef.current = now;
        localStorage.setItem("taskomonLastCheckTime", String(now));
        setDisplayState(prefs.creatureState === "golden" ? "golden-happy" : "happy");
        setHappyTrigger(n => n + 1);
      }
    } else {
      // Unchecking — let happy animation finish; only go sleepy when base/sleepy
      const isActive = prefs.creatureState === "hatched" || prefs.creatureState === "golden";
      if (isActive && displayState !== "sleepy" && displayState !== "golden-sleepy" && displayState !== "happy" && displayState !== "golden-happy") {
        const completedHabits = habits.filter(h => !!h.completions[todayK]).length;
        const remainingTasks = tasks.filter(t2 => t2.id !== id && t2.completedDate === todayK).length;
        if (completedHabits + remainingTasks === 0) {
          lastCheckTimeRef.current = null;
          localStorage.removeItem("taskomonLastCheckTime");
          setDisplayState(prefs.creatureState === "golden" ? "golden-sleepy" : "sleepy");
        }
      }
    }
  };

  const handleHappyEnd = () => {
    const completedHabits = habits.filter(h => !!h.completions[todayK]).length;
    const completedTasks = tasks.filter(t => t.completedDate === todayK).length;
    const baseState = prefs.creatureState === "golden" ? "golden" : "hatched";
    if (completedHabits + completedTasks > 0) {
      const now = Date.now();
      lastCheckTimeRef.current = now;
      localStorage.setItem("taskomonLastCheckTime", String(now));
      setDisplayState(baseState);
    } else {
      lastCheckTimeRef.current = null;
      localStorage.removeItem("taskomonLastCheckTime");
      setDisplayState(prefs.creatureState === "golden" ? "golden-sleepy" : "sleepy");
    }
  };

  const handleDevSimulateWeek = () => {
    setWeekStats({
      numer: prefs.threshold,
      denom: 100,
      weekKey: weekStats.weekKey
    });
    const now = new Date();
    const currentWeekStart = startOfWeekDate(now, prefs.weekStart);
    currentWeekStart.setHours(prefs.resetHour, 0, 0, 0);
    const prevWeekStartMs = currentWeekStart.getTime() - 7 * 24 * 3600 * 1000;
    setPrefs(prev => ({ ...prev, lastWeeklyRollover: prevWeekStartMs }));
  };

  const handleDevForceHatch = () => {
    setHatchTrigger(n => n + 1);
  };

  // ─── First-launch setup completion ───────────────────────
  const handleSetupComplete = (selectedWeekStart, selectedResetHour) => {
    const now = new Date();
    const weekStartDate = startOfWeekDate(now, selectedWeekStart);
    weekStartDate.setHours(selectedResetHour, 0, 0, 0);
    const currentWeekStartMs = weekStartDate.getTime();

    // If today IS the week-start day → crack progress starts this week.
    // If installing mid-week → first full week begins next week.
    const todayIsWeekStart = dateKey(now) === dateKey(startOfWeekDate(now, selectedWeekStart));
    const nextWeekStart = new Date(weekStartDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const firstFullWeekStartMs = todayIsWeekStart ? currentWeekStartMs : nextWeekStart.getTime();

    const newWeekKey = dateKey(startOfWeekDate(now, selectedWeekStart));
    resetWeekStats(newWeekKey);

    setPrefs(prev => ({
      ...prev,
      weekStart: selectedWeekStart,
      resetHour: selectedResetHour,
      lastWeeklyRollover: currentWeekStartMs,
      firstFullWeekStartMs,
      setupDone: true,
    }));
  };

  const handleDevForceIll = () => {
    setPrefs(prev => ({ ...prev, creatureState: "ill" }));
    setDisplayState("ill");
  };

  const handleDevForceGolden = () => {
    setPrefs(prev => ({ ...prev, creatureState: "golden" }));
    setDisplayState("golden");
  };

  const handleHatched = () => {
    const wantGolden = pendingGoldenRef.current;
    pendingGoldenRef.current = false;
    const targetState = wantGolden ? "golden" : "hatched";
    console.log("[HATCH] creature state set to", targetState);
    const now = Date.now();
    lastCheckTimeRef.current = now;
    localStorage.setItem("taskomonLastCheckTime", String(now));
    setPrefs(prev => ({ ...prev, creatureState: targetState, hatchPending: false }));
    setDisplayState(targetState);
  };

  // ─── Sheets & dialogs ─────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDefaultKind, setSheetDefaultKind] = useState("habit");
  const [sheetToPantry, setSheetToPantry] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const editingItem = editItemId ? findItem(editItemId) : null;
  const deletingItem = deleteItemId ? findItem(deleteItemId) : null;

  const blockedColors = useMemo(() => [
    ...habits.map(h => h.color),
    ...tasks.map(t => t.color),
    ...pantry.map(p => p.color),
    ...ghostHabits.map(g => g.color),
  ], [habits, tasks, pantry, ghostHabits]);
  const reservedColors = useMemo(() => ghostHabits.map(g => g.color), [ghostHabits]);

  // ─── Android back button ──────────────────────────────────
  useEffect(() => {
    const handler = CapApp.addListener("backButton", () => {
      if (illPopupOpen) { setIllPopupOpen(false); return; }
      if (sheetOpen) { setSheetOpen(false); return; }
      if (editItemId) { setEditItemId(null); return; }
      if (deleteItemId) { setDeleteItemId(null); return; }
      if (resetOpen) { setResetOpen(false); return; }
      if (screen === "settings" || screen === "profile") {
        setScreen("main");
      } else if (screen === "main") {
        if (backPressedOnce.current) {
          CapApp.exitApp();
        } else {
          backPressedOnce.current = true;
          showToast(t("app.backToExit"));
          setTimeout(() => { backPressedOnce.current = false; }, 2000);
        }
      }
    });
    return () => handler.then(h => h.remove());
  }, [screen, sheetOpen, editItemId, deleteItemId, resetOpen, illPopupOpen]);

  const openAdd = (defKind = "habit", opts = {}) => {
    setSheetDefaultKind(defKind);
    setSheetToPantry(!!opts.toPantry);
    setSheetOpen(true);
  };

  const handleAdd = (item) => addItem(item, sheetToPantry, todayK);
  const handleUpdate = (id, patch) => updateItem(id, patch);

  const handleDeleteRequest = (id) => {
    setEditItemId(null);
    setDeleteItemId(id);
  };

  const handleKeepHistory = () => {
    if (deleteItemId) {
      deleteItemKeepHistory(deleteItemId);
      setDeleteItemId(null);
      setEditItemId(null);
    }
  };

  const handleWipeAll = () => {
    if (deleteItemId) {
      deleteItemWipe(deleteItemId);
      setDeleteItemId(null);
      setEditItemId(null);
    }
  };

  const handleReset = () => {
    doReset();
    setResetOpen(false);
  };

  return (
    <>
    <div className="app-shell">
      <div className="screen-stack">
        <MainScreen
          active={screen === "main"}
          now={now}
          prefs={prefs}
          setPrefs={setPrefs}
          habits={habits}
          tasks={tasks}
          pantry={pantry}
          taskHistory={taskHistory}
          ghostHabits={ghostHabits}
          petState={petState}
          creatureState={displayState}
          wiggleTrigger={wiggleTrigger}
          hatchTrigger={hatchTrigger}
          happyTrigger={happyTrigger}
          hatchProgress={hatchProgress}
          onHappyEnd={handleHappyEnd}
          onHatched={handleHatched}
          onGoSettings={() => setScreen("settings")}
          onGoProfile={() => setScreen("profile")}
          onOpenAdd={openAdd}
          onSetEditId={setEditItemId}
          onToggleHabit={handleToggleHabit}
          onToggleTask={handleToggleTask}
          onSendToPantry={sendTaskToPantry}
          onActivatePantry={(id) => activatePantry(id, todayK)}
          onReorderHabits={reorderHabits}
          onReorderTasks={reorderTasks}
          onReorderPantry={reorderPantry}
          range={range}
          setRange={setRange}
        />

        <SettingsScreen
          active={screen === "settings"}
          onBack={() => setScreen("main")}
          prefs={prefs}
          setPrefs={setPrefs}
          onReset={() => setResetOpen(true)}
          devMode={window.location.search.includes("dev=1")}
          onDevSimulateWeek={handleDevSimulateWeek}
          onDevForceHatch={handleDevForceHatch}
          onDevForceIll={handleDevForceIll}
          onDevForceGolden={handleDevForceGolden}
        />

        <ProfileScreen
          active={screen === "profile"}
          onBack={() => setScreen("main")}
          habits={habits}
          tasks={tasks}
          taskHistory={taskHistory}
          getSnapshot={getSnapshot}
          importBackup={importBackup}
          onToast={showToast}
          onReset={() => setResetOpen(true)}
        />
      </div>

      <div className={`toast ${toastKind} ${toast ? "show" : ""}`}>{toast || ""}</div>

      <TaskSheet
        open={sheetOpen}
        mode="add"
        defaultKind={sheetDefaultKind}
        toPantry={sheetToPantry}
        blockedColors={blockedColors}
        reservedColors={reservedColors}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAdd}
      />

      <TaskSheet
        open={editItemId !== null}
        mode="edit"
        item={editingItem}
        blockedColors={blockedColors.filter(c => editingItem ? !sameColor(c, editingItem.color) : true)}
        reservedColors={reservedColors}
        onClose={() => setEditItemId(null)}
        onUpdate={handleUpdate}
        onDelete={handleDeleteRequest}
      />

      <DeleteDialog
        open={deleteItemId !== null}
        item={deletingItem}
        onCancel={() => setDeleteItemId(null)}
        onKeepHistory={handleKeepHistory}
        onWipeAll={handleWipeAll}
      />

      <ConfirmDialog
        open={resetOpen}
        title={t("app.resetTitle")}
        message={t("app.resetMessage")}
        confirmLabel={t("app.resetBtn")}
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />

      <IllInfoDialog
        open={illPopupOpen}
        onDismiss={() => setIllPopupOpen(false)}
        onGoSettings={() => { setIllPopupOpen(false); setScreen("settings"); }}
      />

      <SetupDialog
        open={!prefs.setupDone}
        onComplete={handleSetupComplete}
      />

      <OnboardingDialog
        open={prefs.setupDone && !prefs.onboardingDone}
        onDismiss={() => setPrefs(p => ({ ...p, onboardingDone: true }))}
      />
    </div>
    <div className="page-vignette" />
    </>
  );
}
