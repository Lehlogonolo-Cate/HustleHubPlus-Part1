import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';

import { api, ApiError } from '../api/client';
import { Alert, FormField } from '../components/ui';
import { homePathFor, useAuth } from '../context/AuthContext';
import { PASSWORD_RULES, validateRegistration } from '../utils/validation';

const ROLES = [
  { value: 'client', title: 'I want to hire', text: 'Browse gigs and book freelancers.' },
  { value: 'freelancer', title: 'I want to work', text: 'Offer services and track your income.' }
];

export default function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'client' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);

    const found = validateRegistration(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const details = { name: values.name.trim(), email: values.email.trim(), password: values.password, role: values.role };
    try {
      await api.register(details);
    } catch (error) {
      setServerError(error);
      if (error instanceof ApiError) setErrors(error.fieldErrors());
      setSubmitting(false);
      return;
    }

    try {
      const profile = await login({ email: details.email, password: details.password });
      navigate(homePathFor(profile.role), { replace: true });
    } catch {
      navigate('/login', { replace: true, state: { registered: true } });
    }
  };

  return (
    <section className="auth">
      <div className="auth__panel auth__panel--wide">
        <h1>Create your account</h1>
        <p className="auth__lead">Join HustleHub+ as a client or a freelancer.</p>

        <Alert requestId={serverError?.requestId}>{serverError?.message}</Alert>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <fieldset className="role-picker">
            <legend>Account type</legend>
            {ROLES.map((role) => (
              <label key={role.value} className={`role-option${values.role === role.value ? ' role-option--selected' : ''}`}>
                <input type="radio" name="role" value={role.value} checked={values.role === role.value} onChange={update('role')} />
                <span className="role-option__title">{role.title}</span>
                <span className="role-option__text">{role.text}</span>
              </label>
            ))}
            {errors.role && <p className="field__error">{errors.role}</p>}
          </fieldset>

          <FormField label="Full name" error={errors.name}>
            {(props) => <input {...props} autoComplete="name" value={values.name} onChange={update('name')} maxLength={60} />}
          </FormField>

          <FormField label="Email" error={errors.email}>
            {(props) => <input {...props} type="email" autoComplete="email" value={values.email} onChange={update('email')} />}
          </FormField>

          <FormField label="Password" error={errors.password}>
            {(props) => (
              <input {...props} type="password" autoComplete="new-password" value={values.password} onChange={update('password')} />
            )}
          </FormField>

          <ul className="password-rules" aria-label="Password requirements">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(values.password);
              return (
                <li key={rule.id} className={met ? 'met' : ''}>
                  <span aria-hidden="true">{met ? '✓' : '•'}</span> {rule.label}
                  <span className="visually-hidden">{met ? ' (met)' : ' (not met)'}</span>
                </li>
              );
            })}
          </ul>

          <FormField label="Confirm password" error={errors.confirmPassword}>
            {(props) => (
              <input
                {...props}
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={update('confirmPassword')}
              />
            )}
          </FormField>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
