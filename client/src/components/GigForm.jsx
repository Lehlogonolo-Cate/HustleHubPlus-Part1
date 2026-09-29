import { useState } from 'react';

import { ApiError } from '../api/client';
import { GIG_CATEGORIES, capitalise } from '../utils/format';
import { validateGig } from '../utils/validation';
import { Alert, FormField } from './ui';

const EMPTY = { title: '', description: '', category: '', price: '', deliveryDays: '', isActive: true };

export default function GigForm({ initialGig, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => (initialGig ? { ...EMPTY, ...initialGig } : EMPTY));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);

    const found = validateGig(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        price: Number(values.price),
        deliveryDays: Number(values.deliveryDays),
        isActive: values.isActive
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors());
        setServerError(error);
      } else {
        setServerError({ message: 'Something went wrong. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <Alert requestId={serverError?.requestId}>{serverError?.message}</Alert>

      <FormField label="Title" error={errors.title} hint="5 to 100 characters">
        {(props) => <input {...props} value={values.title} onChange={update('title')} maxLength={100} />}
      </FormField>

      <FormField label="Description" error={errors.description} hint="Describe what the client gets (20 to 2000 characters)">
        {(props) => (
          <textarea {...props} rows={5} value={values.description} onChange={update('description')} maxLength={2000} />
        )}
      </FormField>

      <div className="form__row">
        <FormField label="Category" error={errors.category}>
          {(props) => (
            <select {...props} value={values.category} onChange={update('category')}>
              <option value="">Choose…</option>
              {GIG_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {capitalise(category)}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Price (ZAR)" error={errors.price}>
          {(props) => (
            <input {...props} type="number" inputMode="decimal" min="50" step="0.01" value={values.price} onChange={update('price')} />
          )}
        </FormField>

        <FormField label="Delivery (days)" error={errors.deliveryDays}>
          {(props) => (
            <input {...props} type="number" min="1" max="90" step="1" value={values.deliveryDays} onChange={update('deliveryDays')} />
          )}
        </FormField>
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={values.isActive} onChange={update('isActive')} />
        Visible to clients
      </label>

      <div className="form__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : initialGig ? 'Save changes' : 'Create gig'}
        </button>
      </div>
    </form>
  );
}
