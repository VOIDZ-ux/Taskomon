import { useTranslation } from "react-i18next";

export default function OnboardingDialog({ open, onDismiss }) {
  const { t } = useTranslation();
  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`}>
      <div className="dialog onboarding-dialog" onClick={e => e.stopPropagation()}>

        <h4>{t("onboarding.title")}</h4>
        <p style={{ marginBottom: 18 }}>{t("onboarding.intro")}</p>

        <div className="ob-block">
          <div className="ob-label" style={{ background: "rgba(127,232,23,0.12)", color: "#7FE817", borderColor: "rgba(127,232,23,0.3)" }}>
            {t("onboarding.habitsLabel")}
          </div>
          <p className="ob-desc">{t("onboarding.habitsDesc")}</p>
        </div>

        <div className="ob-block">
          <div className="ob-label" style={{ background: "rgba(251,146,60,0.12)", color: "#FB923C", borderColor: "rgba(251,146,60,0.3)" }}>
            {t("onboarding.tasksLabel")}
          </div>
          <p className="ob-desc">{t("onboarding.tasksDesc")}</p>
        </div>

        <div className="ob-block" style={{ marginBottom: 0 }}>
          <div className="ob-label" style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", borderColor: "rgba(167,139,250,0.3)" }}>
            {t("onboarding.pantryLabel")}
          </div>
          <p className="ob-desc" style={{ marginBottom: 0 }}>{t("onboarding.pantryDesc")}</p>
        </div>

        <div className="dialog-actions" style={{ marginTop: 20 }}>
          <button className="btn-keep" style={{ flex: 1 }} onClick={onDismiss}>
            {t("onboarding.gotIt")}
          </button>
        </div>

      </div>
    </div>
  );
}
