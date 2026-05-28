import { useTranslation } from "react-i18next";

export default function IllInfoDialog({ open, onDismiss, onGoSettings }) {
  const { t } = useTranslation();
  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`} onClick={onDismiss}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h4>{t("illDialog.title")}</h4>
        <p>{t("illDialog.message")}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onDismiss}>{t("illDialog.gotIt")}</button>
          <button className="btn btn-primary" onClick={onGoSettings}>{t("illDialog.settings")}</button>
        </div>
      </div>
    </div>
  );
}
