import { useRef, useEffect } from "react";
import { GRACE_MS, formatGrace } from "../utils/dateHelpers.js";
import { IconGear, IconDragHandle, PhysicalSwitch } from "./Icons.jsx";

export default function TaskRow({
  task, now, todayK, onToggle, onConfig, onSendToPantry,
  dragging, onDragStart, onDragOver, onDrop, onDragEnd,
  touchIsDragging, touchIsOver, onHandleTouchStart, onHandleTouchMove, onHandleTouchEnd,
}) {
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

  const msLeft = task.createdAt + GRACE_MS - now;
  const inGrace = msLeft > 0;
  const isCompleted = task.completedDate === todayK;

  return (
    <div
      data-drag-id={task.id}
      className={`task ${isCompleted ? "completed" : ""} ${dragging || touchIsDragging ? "dragging" : ""} ${touchIsOver ? "touch-drop-target" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div
        ref={handleRef}
        className="drag-handle"
        title="Drag to reorder"
      ><IconDragHandle size={12} /></div>
      <div className="task-color" style={{ background: task.color, boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 10px ${task.color}55` }} />
      <div className="task-stack">
        <div className="task-name">{task.name}</div>
        <div className="task-meta">
          {isCompleted ? (
            <span className="done-pill" title="Will be filed in Calendar at midnight">
              <span className="check" />
              <span>done · files at midnight</span>
            </span>
          ) : inGrace ? (
            <button className="grace-pill" onClick={onSendToPantry} title="Move back to Pantry">
              <span className="dot" />
              <span>↩ pantry · {formatGrace(msLeft)}</span>
            </button>
          ) : task.missedDays > 0 ? (
            <span className="missed-pill">
              <span className="missed-dot" />
              <span>missed {task.missedDays}d</span>
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(245,158,11,0.8)", boxShadow: "0 0 6px rgba(245,158,11,0.4)" }} />
              <span>due today</span>
            </span>
          )}
        </div>
      </div>
      <div className="task-actions">
        <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={onConfig} title="Configure">
          <IconGear size={13} />
        </button>
        <PhysicalSwitch on={isCompleted} onClick={onToggle} />
      </div>
    </div>
  );
}
