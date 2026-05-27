export default function OnboardingDialog({ open, onDismiss }) {
  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`}>
      <div className="dialog onboarding-dialog" onClick={e => e.stopPropagation()}>

        <h4>HOW IT WORKS</h4>
        <p style={{ marginBottom: 18 }}>
          There are three types of items. Each one affects Mon differently.
        </p>

        {/* ── Habits ─────────────────────────────────── */}
        <div className="ob-block">
          <div className="ob-label" style={{ background: "rgba(127,232,23,0.12)", color: "#7FE817", borderColor: "rgba(127,232,23,0.3)" }}>
            Habits
          </div>
          <p className="ob-desc">
            Recurring goals you want to hit a set number of times per week — "run 3×", "meditate daily". They make up Mon's weekly health score. Fall short of your threshold and Mon gets sick.
          </p>
        </div>

        {/* ── Tasks ──────────────────────────────────── */}
        <div className="ob-block">
          <div className="ob-label" style={{ background: "rgba(251,146,60,0.12)", color: "#FB923C", borderColor: "rgba(251,146,60,0.3)" }}>
            Tasks
          </div>
          <p className="ob-desc">
            Daily commitments. Anything left incomplete when the day resets counts against Mon's health. Only add things you genuinely intend to finish today.
          </p>
        </div>

        {/* ── Pantry ─────────────────────────────────── */}
        <div className="ob-block" style={{ marginBottom: 0 }}>
          <div className="ob-label" style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", borderColor: "rgba(167,139,250,0.3)" }}>
            Pantry
          </div>
          <p className="ob-desc" style={{ marginBottom: 0 }}>
            A no-pressure holding area for things on your radar. Activate an item when you're ready to own it — it becomes a Task for the day. You have 3 hours to change your mind and return it to the Pantry. After that, it stays as a Task.
          </p>
        </div>

        <div className="dialog-actions" style={{ marginTop: 20 }}>
          <button className="btn-keep" style={{ flex: 1 }} onClick={onDismiss}>
            Got it!
          </button>
        </div>

      </div>
    </div>
  );
}
