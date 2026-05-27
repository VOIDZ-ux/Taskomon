import { useRef, useEffect } from "react";
import { IconGear, IconArrowUp, IconDragHandle } from "./Icons.jsx";

export default function PantryRow({
  item, onActivate, onConfig,
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

  return (
    <div
      data-drag-id={item.id}
      className={`pantry-row ${dragging || touchIsDragging ? "dragging" : ""} ${touchIsOver ? "touch-drop-target" : ""}`}
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
      <div className="pantry-color" style={{ background: item.color }} />
      <div className="pantry-name">{item.name}</div>
      <div className="pantry-actions">
        <button className="icon-btn" style={{ width: 24, height: 24, color: "rgba(255,255,255,0.45)" }} onClick={onConfig} title="Configure">
          <IconGear size={12} />
        </button>
        <button className="activate-btn" onClick={onActivate} title="Move to Tasks">
          <IconArrowUp size={11} />
          <span>Activate</span>
        </button>
      </div>
    </div>
  );
}
