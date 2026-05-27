import { useState, useEffect, useRef, useMemo } from "react";
import { MONTH_SHORT, WEEKDAY_SHORT, dateKey, startOfWeekDate } from "../utils/dateHelpers.js";
import {
  IconGear, IconUser, IconSort, IconRepeat, IconCheckCircle, IconArchive,
} from "./Icons.jsx";
import CreatureView from "./CreatureView.jsx";
import HabitRow from "./HabitRow.jsx";
import TaskRow from "./TaskRow.jsx";
import PantryRow from "./PantryRow.jsx";
import Chart from "./Chart.jsx";

export default function MainScreen({
  active,
  now,
  prefs, setPrefs,
  habits, tasks, pantry, taskHistory, ghostHabits,
  petState,
  creatureState,
  wiggleTrigger,
  hatchTrigger,
  happyTrigger,
  hatchProgress,
  onHatched,
  onHappyEnd,
  onGoSettings, onGoProfile,
  onOpenAdd, onSetEditId,
  onToggleHabit, onToggleTask, onSendToPantry, onActivatePantry,
  onReorderHabits, onReorderTasks, onReorderPantry,
  range, setRange,
}) {
  const nowDate = new Date(now);
  const todayK = (() => {
    const dd = new Date(nowDate);
    if (dd.getHours() < prefs.resetHour) dd.setDate(dd.getDate() - 1);
    return dateKey(dd);
  })();

  // ─── Clock & date display ─────────────────────────────────
  const hour24 = nowDate.getHours();
  const hour12 = ((hour24 + 11) % 12) + 1;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const displayTime = prefs.h24
    ? `${String(hour24).padStart(2, "0")}:${String(nowDate.getMinutes()).padStart(2, "0")}`
    : `${hour12}:${String(nowDate.getMinutes()).padStart(2, "0")} ${ampm}`;
  const displayDate = `${WEEKDAY_SHORT[nowDate.getDay()]} · ${String(nowDate.getDate()).padStart(2, "0")} ${MONTH_SHORT[nowDate.getMonth()]} ${nowDate.getFullYear()}`;

  // ─── Drag and drop ────────────────────────────────────────
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef({ id: null, section: null });

  // ─── Touch drag ───────────────────────────────────────────
  const [touchDraggingId, setTouchDraggingId] = useState(null);
  const [touchOverId, setTouchOverId] = useState(null);
  const touchRef = useRef({ id: null, section: null, items: null, onReorder: null, overId: null });

  const makeTouchHandlers = (id, _section, items, onReorder) => ({
    touchIsDragging: touchDraggingId === id,
    touchIsOver: touchOverId === id,
    onHandleTouchStart: (e) => {
      e.preventDefault();
      touchRef.current = { id, items, onReorder, overId: null };
      setTouchDraggingId(id);
      setTouchOverId(null);
    },
    onHandleTouchMove: (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const row = el?.closest('[data-drag-id]');
      const overId = row ? row.getAttribute('data-drag-id') : null;
      const newOver = (overId && overId !== touchRef.current.id) ? overId : null;
      if (touchRef.current.overId !== newOver) {
        touchRef.current.overId = newOver;
        setTouchOverId(newOver);
      }
    },
    onHandleTouchEnd: () => {
      const { id: fromId, items: fromItems, onReorder: fromOnReorder, overId } = touchRef.current;
      if (overId && fromId) {
        const fromIdx = fromItems.findIndex(x => x.id === fromId);
        const toIdx = fromItems.findIndex(x => x.id === overId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const next = [...fromItems];
          const [moved] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, moved);
          fromOnReorder(next);
        }
      }
      touchRef.current = { id: null, section: null, items: null, onReorder: null, overId: null };
      setTouchDraggingId(null);
      setTouchOverId(null);
    },
  });

  const makeDragHandlers = (id, section, items, onReorder) => ({
    dragging: draggingId === id,
    onDragStart: (e) => {
      dragRef.current = { id, section };
      setDraggingId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDrop: (e) => {
      e.preventDefault();
      if (dragRef.current.id === id || dragRef.current.section !== section) return;
      const fromIdx = items.findIndex(x => x.id === dragRef.current.id);
      const toIdx = items.findIndex(x => x.id === id);
      if (fromIdx === -1 || toIdx === -1) return;
      const next = [...items];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      onReorder(next);
    },
    onDragEnd: () => {
      setDraggingId(null);
      dragRef.current = { id: null, section: null };
    },
  });

  // ─── Sort dropdown ────────────────────────────────────────
  const [openSort, setOpenSort] = useState(null);

  useEffect(() => {
    if (!openSort) return;
    const handler = (e) => {
      if (!e.target.closest(".sort-drop") && !e.target.closest(".sort-btn")) {
        setOpenSort(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openSort]);

  const sortSection = (section, mode) => {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const byDate = (a, b) => (a.createdAt || 0) - (b.createdAt || 0);
    const cmp = mode === "az" ? byName : byDate;
    if (section === "habits") onReorderHabits([...habits].sort(cmp));
    else if (section === "tasks") onReorderTasks([...tasks].sort(cmp));
    else if (section === "pantry") onReorderPantry([...pantry].sort(cmp));
    setOpenSort(null);
  };

  const SortDrop = ({ section }) => (
    <div style={{ position: "relative" }}>
      <button
        className="sort-btn"
        title="Sort"
        onClick={() => setOpenSort(openSort === section ? null : section)}
      >
        <IconSort size={11} />
      </button>
      {openSort === section && (
        <div className="sort-drop">
          <button onClick={() => sortSection(section, "az")}>A→Z</button>
          <button onClick={() => sortSection(section, "date")}>By date</button>
        </div>
      )}
    </div>
  );

  // ─── Registry items (for chart) ───────────────────────────
  const registryItems = useMemo(() => {
    const items = [];
    for (const h of habits) items.push({ id: h.id, name: h.name, color: h.color, kind: "habit" });
    for (const g of ghostHabits) items.push({ id: g.id, name: g.name, color: g.color, kind: "habit", ghost: true });
    const taskColorMap = new Map();
    for (const t of taskHistory) {
      const key = "tcol:" + t.color;
      if (!taskColorMap.has(key)) taskColorMap.set(key, { id: key, name: t.name, color: t.color, kind: "task" });
    }
    for (const t of tasks) {
      const key = "tcol:" + t.color;
      if (!taskColorMap.has(key)) taskColorMap.set(key, { id: key, name: t.name, color: t.color, kind: "task" });
    }
    return [...items, ...taskColorMap.values()];
  }, [habits, ghostHabits, taskHistory, tasks]);

  // ─── Status on date ───────────────────────────────────────
  const statusOnDate = (itemId, dateK) => {
    const h = habits.find(x => x.id === itemId);
    if (h) return h.completions[dateK] ? "done" : null;
    const gh = ghostHabits.find(x => x.id === itemId);
    if (gh) return gh.completions[dateK] ? "done" : null;
    if (itemId.startsWith("tcol:")) {
      const color = itemId.slice(5);
      for (const t of taskHistory) {
        if (t.color === color && t.date === dateK) return t.status;
      }
      return null;
    }
    return null;
  };

  // ─── Chart view ───────────────────────────────────────────
  const ranges = ["This Week", "30 Days", "1 Year", "All Time"];

  const chartView = useMemo(() => {
    if (range === "This Week") {
      // Days from the start of the current week up to today
      const weekStartDate = startOfWeekDate(nowDate, prefs.weekStart);
      const cells = [];
      const d = new Date(weekStartDate);
      while (dateKey(d) <= todayK) {
        const k = dateKey(d);
        const statuses = {};
        for (const it of registryItems) statuses[it.id] = statusOnDate(it.id, k);
        cells.push({ label: String(d.getDate()).padStart(2, "0"), isToday: k === todayK, statuses });
        d.setDate(d.getDate() + 1);
      }
      return { mode: "daily", cells, xAxis: "perCol" };
    }
    if (range === "30 Days") {
      const numDays = 30;
      const cells = [];
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(nowDate);
        d.setDate(d.getDate() - i);
        const k = dateKey(d);
        const statuses = {};
        for (const it of registryItems) statuses[it.id] = statusOnDate(it.id, k);
        const showLabel = (numDays - 1 - i) % 5 === 0 || i === 0;
        cells.push({ label: showLabel ? String(d.getDate()).padStart(2, "0") : "", isToday: i === 0, statuses });
      }
      return { mode: "daily", cells, xAxis: "perCol" };
    }
    const numWeeks = 52;
    const cells = [];
    for (let w = numWeeks - 1; w >= 0; w--) {
      const intensity = {};
      for (const it of registryItems) {
        let done = 0;
        for (let d = 0; d < 7; d++) {
          const date = new Date(nowDate);
          date.setDate(date.getDate() - (w * 7 + d));
          if (statusOnDate(it.id, dateKey(date)) === "done") done++;
        }
        intensity[it.id] = done / 7;
      }
      cells.push({ isToday: w === 0, intensity });
    }
    const startDate = new Date(nowDate);
    startDate.setDate(startDate.getDate() - (numWeeks * 7 - 1));
    const midDate = new Date(nowDate);
    midDate.setDate(midDate.getDate() - Math.floor((numWeeks * 7) / 2));
    const fmt = (d) => `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear() % 100}`;
    return { mode: "weekly", cells, xAxis: "range", startLabel: fmt(startDate), midLabel: fmt(midDate), endLabel: "NOW" };
  }, [range, prefs.weekStart, registryItems, todayK, nowDate.toDateString()]);

  // ─── Stats ────────────────────────────────────────────────
  const completionPct = useMemo(() => {
    let earned = 0, total = 0;

    if (range === "This Week") {
      // Only count days from the start of the current week up to today —
      // the same window that drives Mon's health score.
      const weekStartDate = startOfWeekDate(nowDate, prefs.weekStart);
      const days = [];
      const d = new Date(weekStartDate);
      while (dateKey(d) <= todayK) { days.push(dateKey(d)); d.setDate(d.getDate() + 1); }
      for (const h of habits) {
        const doneThisWeek = days.reduce((acc, k) => acc + (h.completions[k] ? 1 : 0), 0);
        earned += Math.min(doneThisWeek, h.weeklyGoal);
        total += h.weeklyGoal;
      }
      for (const t of taskHistory) {
        if (days.includes(t.date)) { total += 1; if (t.status === "done") earned += 1; }
      }
      for (const t of tasks) {
        if (days.includes(t.dueDate)) { total += 1; if (t.completedDate === t.dueDate) earned += 1; }
      }
      return total ? Math.round((earned / total) * 100) : 0;
    }

    const numWeeks = range === "30 Days" ? 5 : 52;
    for (let w = 0; w < numWeeks; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(nowDate);
        date.setDate(date.getDate() - (w * 7 + d));
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
      // Include active tasks whose dueDate falls in this period
      for (const t of tasks) {
        if (days.includes(t.dueDate)) {
          total += 1;
          if (t.completedDate === t.dueDate) earned += 1;
        }
      }
    }
    return total ? Math.round((earned / total) * 100) : 0;
  }, [habits, tasks, taskHistory, range, prefs.weekStart, todayK, nowDate.toDateString()]);

  const bestStreak = useMemo(() => {
    let best = 0;
    for (const h of habits) {
      let cur = 0, max = 0;
      for (let i = 120; i >= 0; i--) {
        const d = new Date(nowDate);
        d.setDate(d.getDate() - i);
        if (h.completions[dateKey(d)]) { cur++; if (cur > max) max = cur; }
        else cur = 0;
      }
      if (max > best) best = max;
    }
    return best;
  }, [habits, nowDate.toDateString()]);

  // ─── Habit week progress ──────────────────────────────────
  const weekStart = startOfWeekDate(nowDate, prefs.weekStart);
  const habitWeekProgress = (h) => {
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      if (h.completions[dateKey(d)]) done++;
    }
    return { done };
  };

  const habitDoneTodayCount = habits.filter(h => h.completions[todayK]).length;

  return (
    <div className={`main-screen ${!active ? "pushed" : ""}`}>
      <div className="header">
        <img className="logo" src="/TaskomonLogo.png" alt="Taskomon" />
        <div className="icon-row">
          <button className="icon-btn" title="Settings" onClick={onGoSettings}><IconGear /></button>
          <button className="icon-btn" title="Profile" onClick={onGoProfile}><IconUser /></button>
        </div>
      </div>

      {prefs.showClock && (
        <div className="clock-wrap">
          <div className="clock">{displayTime}</div>
          <div className="date">{displayDate}</div>
        </div>
      )}

      <CreatureView
        creatureState={creatureState}
        wiggleTrigger={wiggleTrigger}
        hatchTrigger={hatchTrigger}
        happyTrigger={happyTrigger}
        hatchProgress={hatchProgress}
        onHatched={onHatched}
        onHappyEnd={onHappyEnd}
      />

      {/* HABITS */}
      <div className="section-label">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconRepeat size={10} />
          <span>Habits</span>
          <button
            className={`collapse-btn ${prefs.habitsCollapsed ? "collapsed" : ""}`}
            onClick={() => setPrefs(p => ({ ...p, habitsCollapsed: !p.habitsCollapsed }))}
            title={prefs.habitsCollapsed ? "Expand habits" : "Collapse habits"}
            aria-expanded={!prefs.habitsCollapsed}
          >
            <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className="count">{habitDoneTodayCount}/{habits.length} today</span>
          <SortDrop section="habits" />
          <button className="section-add" title="New habit" onClick={() => onOpenAdd("habit")}>+</button>
        </span>
      </div>
      {prefs.habitsCollapsed ? (
        <div className="pantry-collapsed-strip" onClick={() => setPrefs(p => ({ ...p, habitsCollapsed: false }))}>
          {habits.length > 0 ? (
            <>
              <div className="swatch-stack">
                {habits.slice(0, 5).map(h => (
                  <div key={h.id} style={{ background: h.color }} />
                ))}
              </div>
              <span>{habits.length} habits · tap to expand</span>
            </>
          ) : (
            <span style={{ textAlign: "center", flex: 1 }}>No habits yet</span>
          )}
        </div>
      ) : habits.length === 0 ? (
        <div className="card"><div className="empty-row">No habits yet</div></div>
      ) : (
        <div className="task-list">
          {habits.map(h => (
            <HabitRow
              key={h.id}
              habit={h}
              doneToday={!!h.completions[todayK]}
              weekProgress={habitWeekProgress(h)}
              onToggle={() => onToggleHabit(h.id)}
              onConfig={() => onSetEditId(h.id)}
              {...makeDragHandlers(h.id, "habits", habits, onReorderHabits)}
              {...makeTouchHandlers(h.id, "habits", habits, onReorderHabits)}
            />
          ))}
        </div>
      )}

      {/* TASKS */}
      <div className="section-label">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconCheckCircle size={10} />
          <span>Tasks</span>
          <button
            className={`collapse-btn ${prefs.tasksCollapsed ? "collapsed" : ""}`}
            onClick={() => setPrefs(p => ({ ...p, tasksCollapsed: !p.tasksCollapsed }))}
            title={prefs.tasksCollapsed ? "Expand tasks" : "Collapse tasks"}
            aria-expanded={!prefs.tasksCollapsed}
          >
            <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className="count">{tasks.length} active</span>
          <SortDrop section="tasks" />
          <button className="section-add" title="New task" onClick={() => onOpenAdd("task")}>+</button>
        </span>
      </div>
      {prefs.tasksCollapsed ? (
        <div className="pantry-collapsed-strip" onClick={() => setPrefs(p => ({ ...p, tasksCollapsed: false }))}>
          {tasks.length > 0 ? (
            <>
              <div className="swatch-stack">
                {tasks.slice(0, 5).map(t => (
                  <div key={t.id} style={{ background: t.color }} />
                ))}
              </div>
              <span>{tasks.length} tasks · tap to expand</span>
            </>
          ) : (
            <span style={{ textAlign: "center", flex: 1 }}>No active tasks</span>
          )}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card"><div className="empty-row">No active tasks · tap + to commit</div></div>
      ) : (
        <div className="task-list">
          {tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              now={now}
              todayK={todayK}
              onToggle={() => onToggleTask(t.id)}
              onConfig={() => onSetEditId(t.id)}
              onSendToPantry={() => onSendToPantry(t.id)}
              {...makeDragHandlers(t.id, "tasks", tasks, onReorderTasks)}
              {...makeTouchHandlers(t.id, "tasks", tasks, onReorderTasks)}
            />
          ))}
        </div>
      )}

      {/* PANTRY */}
      <div className="section-label">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconArchive size={10} />
          <span>Pantry</span>
          <button
            className={`collapse-btn ${prefs.pantryCollapsed ? "collapsed" : ""}`}
            onClick={() => setPrefs(p => ({ ...p, pantryCollapsed: !p.pantryCollapsed }))}
            title={prefs.pantryCollapsed ? "Expand pantry" : "Collapse pantry"}
            aria-expanded={!prefs.pantryCollapsed}
          >
            <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className="count">{pantry.length} dormant</span>
          <SortDrop section="pantry" />
          <button className="section-add" title="Add to pantry" onClick={() => onOpenAdd("task", { toPantry: true })}>+</button>
        </span>
      </div>
      {prefs.pantryCollapsed ? (
        <div className="pantry-collapsed-strip" onClick={() => setPrefs(p => ({ ...p, pantryCollapsed: false }))}>
          {pantry.length > 0 ? (
            <>
              <div className="swatch-stack">
                {pantry.slice(0, 5).map(p => (
                  <div key={p.id} style={{ background: p.color }} />
                ))}
              </div>
              <span>{pantry.length} dormant · tap to expand</span>
            </>
          ) : (
            <span style={{ textAlign: "center", flex: 1 }}>Pantry is empty</span>
          )}
        </div>
      ) : pantry.length === 0 ? (
        <div className="card"><div className="empty-row">Pantry is empty</div></div>
      ) : (
        <div className={`task-list pantry-card ${pantry.length > 4 ? "scroll" : ""}`}>
          {pantry.map(p => (
            <PantryRow
              key={p.id}
              item={p}
              onActivate={() => onActivatePantry(p.id)}
              onConfig={() => onSetEditId(p.id)}
              {...makeDragHandlers(p.id, "pantry", pantry, onReorderPantry)}
              {...makeTouchHandlers(p.id, "pantry", pantry, onReorderPantry)}
            />
          ))}
        </div>
      )}

      {/* CALENDAR */}
      <div className="section-label">
        <span>Calendar</span>
        <span className="count">{range.toUpperCase()}</span>
      </div>
      <div className="chips">
        {ranges.map(r => (
          <button key={r} className={`chip ${range === r ? "active" : ""}`} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>
      <div className="card stats-card">
        <div className="stats-top">
          <div>
            <div className="pct">{completionPct}%</div>
            <div className="pct-label">Completion Rate</div>
          </div>
          <div className="streak-mini">
            <div className="val">🔥 {bestStreak}d</div>
            <div className="lbl">Best Streak</div>
          </div>
        </div>
        <Chart view={chartView} registryItems={registryItems} />
        <div className="legend">
          {registryItems.map(t => (
            <div className={`legend-item ${t.ghost ? "ghost" : ""}`} key={t.id}>
              <div className="legend-dot" style={{ background: t.color }} />
              <span>{t.name}</span>
            </div>
          ))}
          <div className="legend-item" style={{ marginLeft: "auto" }}>
            <div className="legend-dot" style={{ background: "#EF4444", backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px)" }} />
            <span>missed</span>
          </div>
        </div>
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}
