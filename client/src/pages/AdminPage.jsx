import { useCallback, useEffect, useState } from 'react';

import { api } from '../api/client';
import { Alert, ConfirmDialog, Loading, PageHeader, StatCard } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { capitalise, formatCurrency, formatDate } from '../utils/format';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [role, setRole] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.adminStats(), api.adminUsers({ role: role || undefined, limit: 50 })])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData.users);
      })
      .catch(setError);
  }, [role]);

  useEffect(load, [load]);

  const toggleStatus = async () => {
    setBusy(true);
    try {
      const { message } = await api.setUserStatus(target.id, !target.isActive);
      setNotice(message);
      load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  return (
    <>
      <PageHeader title="Platform administration" subtitle="Monitor activity and manage user accounts." />

      <Alert type="success">{notice}</Alert>
      <Alert requestId={error?.requestId}>{error?.message}</Alert>

      {!stats && !error && <Loading />}

      {stats && (
        <section className="stat-grid" aria-label="Platform statistics">
          <StatCard label="Clients" value={stats.users.client} />
          <StatCard label="Freelancers" value={stats.users.freelancer} />
          <StatCard label="Active gigs" value={stats.activeGigs} />
          <StatCard label="Bookings" value={stats.bookings} />
          <StatCard label="Transaction volume" value={formatCurrency(stats.transactionVolume)} tone="accent" />
          <StatCard label="Platform fees" value={formatCurrency(stats.platformFees)} />
        </section>
      )}

      {users && (
        <section className="card">
          <div className="card__header">
            <h2>Users</h2>
            <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id}>
                    <td>{account.name}</td>
                    <td>{account.email}</td>
                    <td>
                      <span className={`role-pill role-pill--${account.role}`}>{capitalise(account.role)}</span>
                    </td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td>
                      <span className={`badge ${account.isActive ? 'badge--paid' : 'badge--cancelled'}`}>
                        {account.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="table__actions">
                      {account.id !== currentUser.id && (
                        <button
                          type="button"
                          className={`btn btn--small ${account.isActive ? 'btn--danger-ghost' : 'btn--ghost'}`}
                          onClick={() => (setNotice(null), setTarget(account))}
                        >
                          {account.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.isActive ? 'Deactivate account?' : 'Reactivate account?'}
        confirmLabel={target?.isActive ? 'Deactivate' : 'Reactivate'}
        danger={target?.isActive}
        busy={busy}
        onConfirm={toggleStatus}
        onCancel={() => setTarget(null)}
      >
        <p>
          {target?.isActive
            ? `${target?.name} will be signed out immediately and will not be able to log in.`
            : `${target?.name} will be able to log in again.`}
        </p>
      </ConfirmDialog>
    </>
  );
}
