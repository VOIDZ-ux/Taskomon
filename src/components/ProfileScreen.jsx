import { useState, useRef, useMemo } from "react";
import { IconBack, IconDown, IconUp } from "./Icons.jsx";
import { buildBackupData, exportBackupData, validateBackup, readJSONFile } from "../utils/backupHelpers.js";
import { dateKey } from "../utils/dateHelpers.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function ProfileScreen({
  active, onBack,
  habits, tasks, taskHistory,
  getSnapshot, importBackup, onToast, onReset,
}) {
  const [importDialog, setImportDialog] = useState(null);
  const fileInputRef = useRef(null);

  // ─── Stats ────────────────────────────────────────────────
  const totalHabits = habits.length;
  const totalTasksDone = taskHistory.filter(t => t.status === "done").length;

  const streak = useMemo(() => {
    const today = new Date();
    const todayK = dateKey(today);
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dateKey(d);
      const done =
        habits.some(h => h.completions?.[k]) ||
        (i === 0 && tasks.some(t => t.completedDate === todayK)) ||
        taskHistory.some(t => t.date === k && t.status === "done");
      if (done) s++;
      else break;
    }
    return s;
  }, [habits, tasks, taskHistory]);

  // ─── Export ───────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const data = buildBackupData(getSnapshot());
      await exportBackupData(data);
      onToast("Backup exported!", "lime");
    } catch (e) {
      console.error("Export error:", e);
      onToast("Export failed");
    }
  };

  // ─── Import ───────────────────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const data = await readJSONFile(file);
      validateBackup(data);
      const exportedDate = data.exportedAt
        ? new Date(data.exportedAt).toLocaleDateString("it-IT")
        : "unknown date";
      setImportDialog({
        data,
        message: `Import ${data.habits?.length || 0} habits, ${data.tasks?.length || 0} tasks from backup of ${exportedDate}? This will overwrite your current data.`,
      });
    } catch (err) {
      onToast("Invalid backup: " + err.message);
    }
  };

  const confirmImport = () => {
    if (!importDialog) return;
    importBackup(importDialog.data);
    setImportDialog(null);
  };

  return (
    <div className={`sub-screen ${active ? "active" : ""}`}>
      <div className="sub-header">
        <button className="back-btn" onClick={onBack} title="Back"><IconBack /></button>
        <div className="title">Profile</div>
        <div />
      </div>

      {/* Logo + name */}
      <div className="profile-logo-section">
        <img src={import.meta.env.BASE_URL + "TaskomonLogo.png"} alt="Taskomon" className="profile-logo-img" />
        <div className="profile-tagline">your data lives here, on this device. nowhere else.</div>
      </div>

      {/* Stats */}
      <div className="profile-stats-row">
        <div className="profile-stat">
          <div className="profile-stat-val">{totalHabits}</div>
          <div className="profile-stat-lbl">habits</div>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <div className="profile-stat-val">{totalTasksDone}</div>
          <div className="profile-stat-lbl">tasks done</div>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <div className="profile-stat-val">{streak}d</div>
          <div className="profile-stat-lbl">streak</div>
        </div>
      </div>

      <div className="profile-divider" />

      {/* Backup buttons */}
      <div className="profile-action">
        <button className="btn-block lime" onClick={handleExport}>
          <IconDown /> Export Backup
        </button>
        <div className="profile-action-sub">save a .json file you can restore anytime</div>
      </div>

      <div className="profile-action" style={{ marginTop: 10 }}>
        <button className="btn-block ghost" onClick={handleImportClick}>
          <IconUp /> Import Backup
        </button>
        <div className="profile-action-sub">restore from a previously exported file</div>
      </div>

      <div className="profile-divider" />

      {/* Reset */}
      <div className="profile-action">
        <button className="btn-block danger-outline" onClick={onReset}>
          Reset All Data
        </button>
        <div className="profile-action-sub">wipe everything and start fresh</div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="profile-footer-text">
        no accounts · no cloud · no ads · open on any device with your backup file
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <ConfirmDialog
        open={!!importDialog}
        title="Import backup?"
        message={importDialog?.message || ""}
        confirmLabel="Import"
        onCancel={() => setImportDialog(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}
