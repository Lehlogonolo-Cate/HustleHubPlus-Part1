import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { client, freelancer, mockApi, renderWithProviders, signInAs } from './utils';

describe('LoginPage', () => {
  it('renders the login form', () => {
    mockApi({});
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('shows validation errors and does not call the API when fields are empty', async () => {
    const { fetchMock } = mockApi({});
    renderWithProviders(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs in, stores the token and redirects a freelancer to the dashboard', async () => {
    const { calls } = mockApi({
      'POST /auth/login': { body: { token: 'jwt-token', user: freelancer } }
    });
    renderWithProviders(<LoginPage />, {
      route: '/login',
      path: '/login',
      extraRoutes: [{ path: '/dashboard', element: <p>Dashboard page</p> }]
    });

    await userEvent.type(screen.getByLabelText('Email'), 'thandi@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Str0ng!Passw0rd');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(calls[0].body).toEqual({ email: 'thandi@example.com', password: 'Str0ng!Passw0rd' });
    expect(sessionStorage.getItem('hustlehub.token')).toBe('jwt-token');
  });

  it('shows the server error message and clears the password on failure', async () => {
    mockApi({ 'POST /auth/login': { status: 401, body: { error: 'Invalid email or password', requestId: 'req-1' } } });
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'thandi@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByText('Reference: req-1')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('never shows internal details from a server error', async () => {
    mockApi({ 'POST /auth/login': { status: 500, body: { error: 'MongoServerError at /app/src/db.js:12' } } });
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'thandi@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText(/MongoServerError/)).not.toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('shows each password rule as it is met', async () => {
    mockApi({});
    renderWithProviders(<RegisterPage />);

    await userEvent.type(screen.getByLabelText('Password'), 'abc');

    const rules = screen.getByRole('list', { name: 'Password requirements' });
    expect(rules.querySelector('.met')).toHaveTextContent('A lowercase letter');
    expect(rules.querySelectorAll('.met')).toHaveLength(1);
  });

  it('rejects mismatched passwords before calling the API', async () => {
    const { fetchMock } = mockApi({});
    renderWithProviders(<RegisterPage />);

    await userEvent.type(screen.getByLabelText('Full name'), 'Thandi Mokoena');
    await userEvent.type(screen.getByLabelText('Email'), 'thandi@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Str0ng!Passw0rd');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Different!1');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers as a freelancer and signs in', async () => {
    const { calls } = mockApi({
      'POST /auth/register': { status: 201, body: { user: freelancer } },
      'POST /auth/login': { body: { token: 't', user: freelancer } }
    });
    renderWithProviders(<RegisterPage />, {
      route: '/register',
      path: '/register',
      extraRoutes: [{ path: '/dashboard', element: <p>Dashboard page</p> }]
    });

    await userEvent.click(screen.getByLabelText(/I want to work/));
    await userEvent.type(screen.getByLabelText('Full name'), 'Thandi Mokoena');
    await userEvent.type(screen.getByLabelText('Email'), 'thandi@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Str0ng!Passw0rd');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Str0ng!Passw0rd');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(calls[0].body).toMatchObject({ role: 'freelancer', email: 'thandi@example.com' });
    expect(calls[0].body).not.toHaveProperty('confirmPassword');
  });
});

describe('ProtectedRoute', () => {
  it('redirects to login when there is no session', async () => {
    mockApi({});
    renderWithProviders(
      <ProtectedRoute>
        <p>Secret</p>
      </ProtectedRoute>,
      { route: '/secret', path: '/secret', extraRoutes: [{ path: '/login', element: <p>Login page</p> }] }
    );

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('sends a user with the wrong role to their own home page', async () => {
    mockApi(signInAs(client));
    renderWithProviders(
      <ProtectedRoute roles={['freelancer']}>
        <p>Freelancer only</p>
      </ProtectedRoute>,
      { route: '/dashboard', path: '/dashboard', extraRoutes: [{ path: '/gigs', element: <p>Gigs page</p> }] }
    );

    expect(await screen.findByText('Gigs page')).toBeInTheDocument();
  });

  it('renders the page for an allowed role after checking the token with the API', async () => {
    const { calls } = mockApi(signInAs(freelancer));
    renderWithProviders(
      <ProtectedRoute roles={['freelancer']}>
        <p>Freelancer only</p>
      </ProtectedRoute>
    );

    expect(await screen.findByText('Freelancer only')).toBeInTheDocument();
    await waitFor(() => expect(calls[0].headers.Authorization).toBe('Bearer test-token'));
  });
});
