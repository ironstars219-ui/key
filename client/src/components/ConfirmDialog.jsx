// Окно подтверждения (отмена заказа, отключение). Если reasonLabel задан,
// поле причины обязательно.
import { useState } from 'react';
import ErrorMessage from './ErrorMessage.jsx';

export default function ConfirmDialog({ title, text, confirmLabel, danger, reasonLabel, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (reasonLabel && !reason.trim()) return setError(new Error('Укажите причину'));
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <div className="overlay" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <div className="dialog-head">
          <h2 id="dlg-title">{title}</h2>
          {text && <p className="muted" style={{ margin: '4px 0 0' }}>{text}</p>}
        </div>
        {(reasonLabel || error) && (
          <div className="dialog-body stack">
            {reasonLabel && (
              <div className="field">
                <label htmlFor="reason">{reasonLabel}</label>
                <textarea id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
              </div>
            )}
            <ErrorMessage error={error} />
          </div>
        )}
        <div className="dialog-foot">
          <button className="btn" onClick={onClose} disabled={busy}>Назад</button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={submit} disabled={busy}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
