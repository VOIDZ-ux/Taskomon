export default function ConfirmDialog({ open, title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className={`dialog-backdrop ${open ? "open" : ""}`} onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h4>{title}</h4>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
