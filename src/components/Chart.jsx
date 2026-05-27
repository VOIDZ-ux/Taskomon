export default function Chart({ view, registryItems }) {
  const cols = view.cells.length;
  const gap = view.mode === "daily" ? (cols <= 7 ? 8 : 2) : 1;

  return (
    <>
      <div className="chart" style={{ "--cols": cols, "--bar-gap": gap + "px" }}>
        {view.cells.map((cell, i) => (
          <div className="col" key={i}>
            {view.mode === "daily"
              ? registryItems.map(t => {
                  const status = cell.statuses?.[t.id];
                  const did = status === "done";
                  const missed = status === "missed";
                  const fullSlot = `${100 / Math.max(registryItems.length, 1)}%`;
                  return (
                    <div
                      key={t.id}
                      className="bar"
                      style={{
                        height: did ? fullSlot : missed ? fullSlot : "3px",
                        background: did ? t.color : missed ? "#EF4444" : "rgba(255,255,255,0.06)",
                        boxShadow: did && cols <= 30 ? `0 0 6px ${t.color}40`
                          : missed && cols <= 30 ? "0 0 6px rgba(239,68,68,0.45)"
                          : "none",
                        backgroundImage: missed
                          ? "repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px)"
                          : "none",
                        animationDelay: `${i * (cols > 7 ? 10 : 60)}ms`,
                        opacity: did ? 1 : missed ? 0.85 : 0.6,
                      }}
                    />
                  );
                })
              : registryItems.map(t => {
                  const intensity = cell.intensity?.[t.id] || 0;
                  return (
                    <div
                      key={t.id}
                      className="bar"
                      style={{
                        height: intensity > 0
                          ? `${(100 / Math.max(registryItems.length, 1)) * intensity}%`
                          : "2px",
                        background: intensity > 0 ? t.color : "rgba(255,255,255,0.04)",
                        opacity: intensity > 0 ? 0.4 + intensity * 0.6 : 0.5,
                        animationDelay: `${i * 8}ms`,
                      }}
                    />
                  );
                })
            }
          </div>
        ))}
      </div>

      {view.xAxis === "perCol" ? (
        <div className="x-axis" style={{ "--cols": cols, "--bar-gap": gap + "px" }}>
          {view.cells.map((cell, i) => (
            <div key={i} className={cell.isToday ? "today" : ""}>{cell.label || ""}</div>
          ))}
        </div>
      ) : (
        <div className="x-axis-range">
          <span>{view.startLabel}</span>
          {view.midLabel && <span>{view.midLabel}</span>}
          <span className="today">{view.endLabel}</span>
        </div>
      )}
    </>
  );
}
