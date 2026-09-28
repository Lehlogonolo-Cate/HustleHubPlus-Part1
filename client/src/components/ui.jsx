import { useEffect, useId, useRef } from 'react';

import { capitalise } from '../utils/format';

export function FormField({ label, error, hint, children, id }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={fieldId}>{label}</label>
      {children({ id: fieldId, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p className="field__hint" id={`${fieldId}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${fieldId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// React escapes every string it renders, so server messages are always shown as plain text
export function Alert({ type = 'error', children, requestId }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {requestId && <span className="alert__ref">Reference: {requestId}</span>}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{capitalise(status)}</span>;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, note, tone = 'default' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {note && <p className="stat-card__note">{note}</p>}
    </div>
  );
}

// Accessible modal built on the native <dialog> element
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', onConfirm, onCancel, busy, danger }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Older browsers and jsdom may lack showModal/close; fall back to the open attribute
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog ref={ref} className="dialog" onCancel={onCancel} aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      <div className="dialog__body">{children}</div>
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
