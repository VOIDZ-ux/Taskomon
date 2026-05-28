import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IconGear, IconRepeat, IconDragHandle, PhysicalSwitch } from "./Icons.jsx";

export default function HabitRow({
  habit, doneToday, weekProgress, onToggle, onConfig,
  dragging, onDragStart, onDragOver, onDrop, onDragEnd,
  touchIsDragging, touchIsOver, onHandleTouchStart, onHandleTouchMove, onHandleTouchEnd,
}) {
  const { t } = useTranslation();
  const handleRef = useRef(null);
  const startRef = useRef(onHandleTouchStart);
  const moveRef = useRef(onHandleTouchMove);
  const endRef = useRef(onHandleTouchEnd);

  useEffect(() => {
    startRef.current = onHandleTouchStart;
    moveRef.current = onHandleTouchMove;
    endRef.current = onHandleTouchEnd;
  });

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    const start = (e) => startRef.current(e);
    const move = (e) => moveRef.current(e);
    const end = (e) => endRef.current(e);
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
    };
  }, []);

  return (
    <div
      data-drag-id={habit.id}
      className={`task ${dragging || touchIsDragging ? "dragging" : ""} ${touchIsOver ? "touch-drop-target" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div ref={handleRef} className="drag-handle" title={t("row.dragToReorder")}>
        <IconDragHandle size={12} />
      </div>
      <div className="task-color" style={{ background: habit.color, boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 10px ${habit.color}55` }} />
      <div className="task-stack">
        <div className="task-name">{habit.name}</div>
        <div className="task-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            <IconRepeat size={9} />
            <span>{t("row.weekProgress", { done: weekProgress.done, goal: habit.weeklyGoal })}</span>
          </span>
        </div>
      </div>
      <div className="task-actions">
        <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={onConfig} title={t("row.configure")}>
          <IconGear size={13} />
        </button>
        <PhysicalSwitch on={doneToday} onClick={onToggle} />
      </div>
    </div>
  );
}
