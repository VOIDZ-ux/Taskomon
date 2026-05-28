import { useTranslation } from "react-i18next";

export default function DeleteDialog({ open, item, onCancel, onKeepHistory, onWipeAll }) {
  const { t } = useTranslation();
  if (!item) return null;
  const isHabit = item.kind === "habit";
  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`} onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h4>{t("deleteDialog.title", { name: item.name })}</h4>
        <p>
          {isHabit
            ? t("deleteDialog.habitMessage")
            : t("deleteDialog.taskMessage")}
        </p>
        <div className="dialog-actions stack">
          <button className="btn-keep" onClick={onKeepHistory}>
            {t("deleteDialog.keepHistory")}
          </button>
          <button className="btn-danger" onClick={onWipeAll}>
            {t("deleteDialog.wipeAll")}
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>{t("deleteDialog.cancel")}</button>
        </div>
        <div className="reserved-note">
          <div className="swatch-mini" style={{ background: item.color }} />
          <span>{t("deleteDialog.reservedNote", { color: item.color.toUpperCase() })}</span>
        </div>
      </div>
    </div>
  );
}
