import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';

import { Alert, FormField } from '../components/ui';
import { homePathFor, useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validation';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);

    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const profile = await login({ email: values.email.trim(), password: values.password });
      // Only redirect back to an internal path that was saved by ProtectedRoute
      const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : null;
      navigate(from || homePathFor(profile.role), { replace: true });
    } catch (error) {
      setServerError(error);
      setValues((current) => ({ ...current, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth">
      <div className="auth__panel">
        <h1>Welcome back</h1>
        <p className="auth__lead">Log in to manage your gigs, bookings and earnings.</p>

        {location.state?.registered && <Alert type="success">Account created. You can log in now.</Alert>}
        <Alert requestId={serverError?.requestId}>{serverError?.message}</Alert>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <FormField label="Email" error={errors.email}>
            {(props) => <input {...props} type="email" autoComplete="email" value={values.email} onChange={update('email')} />}
          </FormField>
          <FormField label="Password" error={errors.password}>
            {(props) => (
              <input {...props} type="password" autoComplete="current-password" value={values.password} onChange={update('password')} />
            )}
          </FormField>
          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth__switch">
          New to HustleHub+? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
