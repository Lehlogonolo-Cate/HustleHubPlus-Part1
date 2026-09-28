import { useCallback, useEffect, useState } from 'react';

import { api } from '../api/client';
import { Alert, ConfirmDialog, EmptyState, Loading, PageHeader, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

const ACTIONS = {
  complete: { title: 'Mark booking as completed?', label: 'Mark completed', run: api.completeBooking, notice: 'Booking marked as completed.' },
  cancel: { title: 'Cancel this booking?', label: 'Cancel booking', run: api.cancelBooking, notice: 'Booking cancelled. A simulated refund was issued.' }
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(null); // { type, booking }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .listBookings({ status: status || undefined })
      .then(({ bookings: data }) => setBookings(data))
      .catch(setError);
  }, [status]);

  useEffect(load, [load]);

  const runAction = async () => {
    const action = ACTIONS[pending.type];
    setBusy(true);
    setError(null);
    try {
      await action.run(pending.booking.id);
      setNotice(action.notice);
      load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const counterpartLabel = user.role === 'client' ? 'Freelancer' : 'Client';

  return (
    <>
      <PageHeader
        title={user.role === 'client' ? 'My bookings' : 'Bookings'}
        subtitle={user.role === 'freelancer' ? 'Bookings clients have made for your gigs.' : undefined}
        actions={
          <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
      />

      <Alert type="success">{notice}</Alert>
      <Alert requestId={error?.requestId}>{error?.message}</Alert>

      {!bookings && !error && <Loading />}
      {bookings && bookings.length === 0 && <EmptyState title="No bookings yet" />}

      {bookings && bookings.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Gig</th>
                {user.role === 'admin' ? (
                  <>
                    <th scope="col">Client</th>
                    <th scope="col">Freelancer</th>
                  </>
                ) : (
                  <th scope="col">{counterpartLabel}</th>
                )}
                <th scope="col">Price</th>
                <th scope="col">Booked</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <span className="table__primary">{booking.gigTitle}</span>
                    {booking.requirements && <span className="table__secondary">{booking.requirements}</span>}
                  </td>
                  {user.role === 'admin' ? (
                    <>
                      <td>{booking.client?.name}</td>
                      <td>{booking.freelancer?.name}</td>
                    </>
                  ) : (
                    <td>{user.role === 'client' ? booking.freelancer?.name : booking.client?.name}</td>
                  )}
                  <td>{formatCurrency(booking.price)}</td>
                  <td>{formatDate(booking.createdAt)}</td>
                  <td>
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="table__actions">
                    {booking.status === 'confirmed' && user.role === 'freelancer' && (
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => setPending({ type: 'complete', booking })}>
                        Mark completed
                      </button>
                    )}
                    {booking.status === 'confirmed' && user.role === 'client' && (
                      <button type="button" className="btn btn--danger-ghost btn--small" onClick={() => setPending({ type: 'cancel', booking })}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending ? ACTIONS[pending.type].title : ''}
        confirmLabel={pending ? ACTIONS[pending.type].label : ''}
        danger={pending?.type === 'cancel'}
        busy={busy}
        onConfirm={runAction}
        onCancel={() => setPending(null)}
      >
        <p>{pending?.booking.gigTitle}</p>
      </ConfirmDialog>
    </>
  );
}
