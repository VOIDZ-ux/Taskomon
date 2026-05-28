import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IconBack, IconDown, IconUp } from "./Icons.jsx";
import { buildBackupData, exportBackupData, validateBackup, readJSONFile } from "../utils/backupHelpers.js";
import { dateKey } from "../utils/dateHelpers.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function ProfileScreen({
  active, onBack,
  habits, tasks, taskHistory,
  getSnapshot, importBackup, onToast, onReset,
}) {
  const { t } = useTranslation();
  const [importDialog, setImportDialog] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleExport = async () => {
    try {
      const data = buildBackupData(getSnapshot());
      await exportBackupData(data);
      onToast(t("profile.exportedToast"), "lime");
    } catch (e) {
      console.error("Export error:", e);
      onToast(t("profile.exportFailedToast"));
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const data = await readJSONFile(file);
      validateBackup(data);
      const exportedDate = data.exportedAt
        ? new Date(data.exportedAt).toLocaleDateString()
        : "unknown date";
      setImportDialog({
        data,
        message: t("profile.importDialogMessage", {
          habits: data.habits?.length || 0,
          tasks: data.tasks?.length || 0,
          date: exportedDate,
        }),
      });
    } catch (err) {
      onToast(t("profile.invalidBackupToast", { error: err.message }));
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
        <div className="title">{t("profile.title")}</div>
        <div />
      </div>

      <div className="profile-logo-section">
        <img src={import.meta.env.BASE_URL + "TaskomonLogo.png"} alt="Taskomon" className="profile-logo-img" />
        <div className="profile-tagline">{t("profile.tagline")}</div>
      </div>

      <div className="profile-stats-row">
        <div className="profile-stat">
          <div className="profile-stat-val">{totalHabits}</div>
          <div className="profile-stat-lbl">{t("profile.statHabits")}</div>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <div className="profile-stat-val">{totalTasksDone}</div>
          <div className="profile-stat-lbl">{t("profile.statTasksDone")}</div>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <div className="profile-stat-val">{streak}d</div>
          <div className="profile-stat-lbl">{t("profile.statStreak")}</div>
        </div>
      </div>

      <div className="profile-divider" />

      <div className="profile-action">
        <button className="btn-block lime" onClick={handleExport}>
          <IconDown /> {t("profile.exportBtn")}
        </button>
        <div className="profile-action-sub">{t("profile.exportSub")}</div>
      </div>

      <div className="profile-action" style={{ marginTop: 10 }}>
        <button className="btn-block ghost" onClick={handleImportClick}>
          <IconUp /> {t("profile.importBtn")}
        </button>
        <div className="profile-action-sub">{t("profile.importSub")}</div>
      </div>

      <div className="profile-divider" />

      <div className="profile-action">
        <button className="btn-block danger-outline" onClick={onReset}>
          {t("profile.resetBtn")}
        </button>
        <div className="profile-action-sub">{t("profile.resetSub")}</div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="profile-made-by">
        {t("profile.madeBy")}
      </div>

      <div className="profile-kofi-wrap">
        <a href="https://ko-fi.com/voidzsan" target="_blank" rel="noopener noreferrer">
          <img
            src={import.meta.env.BASE_URL + "support_me_on_kofi_red.png"}
            alt="Support me on Ko-fi"
            className="profile-kofi-btn"
          />
        </a>
      </div>

      <div className="profile-footer-text">
        {t("profile.footerText")}
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
        title={t("profile.importDialogTitle")}
        message={importDialog?.message || ""}
        confirmLabel={t("profile.importConfirmBtn")}
        onCancel={() => setImportDialog(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}
