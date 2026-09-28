import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { api } from '../api/client';
import { Alert, ConfirmDialog, Loading } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { capitalise, formatCurrency } from '../utils/format';

export default function GigDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [gig, setGig] = useState(null);
  const [error, setError] = useState(null);
  const [requirements, setRequirements] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    api
      .getGig(id)
      .then(({ gig: data }) => setGig(data))
      .catch(setError);
  }, [id]);

  const handleBook = async () => {
    setBooking(true);
    setBookingError(null);
    try {
      const { booking: created } = await api.createBooking({ gigId: gig.id, requirements: requirements.trim() || undefined });
      setConfirmation(created);
      setRequirements('');
    } catch (err) {
      setBookingError(err);
    } finally {
      setBooking(false);
      setConfirming(false);
    }
  };

  if (error) {
    return (
      <>
        <Alert requestId={error.requestId}>{error.message}</Alert>
        <Link to="/gigs">Back to gigs</Link>
      </>
    );
  }
  if (!gig) return <Loading />;

  const isOwner = user.id === gig.freelancer?.id;

  return (
    <div className="detail">
      <Link to="/gigs" className="back-link">
        ← Back to gigs
      </Link>

      <article className="detail__main card">
        <div className="gig-card__top">
          <span className={`category category--${gig.category}`}>{capitalise(gig.category)}</span>
          {!gig.isActive && <span className="badge badge--cancelled">Hidden</span>}
        </div>
        <h1>{gig.title}</h1>
        <p className="detail__seller">Offered by {gig.freelancer?.name}</p>
        {/* Rendered as text: React escapes it, so stored text can never run as HTML */}
        <p className="detail__description">{gig.description}</p>
      </article>

      <aside className="detail__side card">
        <p className="detail__price">{formatCurrency(gig.price)}</p>
        <p className="detail__meta">Delivered in {gig.deliveryDays} days</p>

        {confirmation && (
          <Alert type="success">
            Booking confirmed. Transaction {confirmation.transaction?.reference} recorded.{' '}
            <Link to="/bookings">View your bookings</Link>
          </Alert>
        )}
        <Alert requestId={bookingError?.requestId}>{bookingError?.message}</Alert>

        {user.role === 'client' && gig.isActive && (
          <>
            <label htmlFor="requirements">Project requirements (optional)</label>
            <textarea
              id="requirements"
              rows={4}
              maxLength={1000}
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              placeholder="Tell the freelancer what you need…"
            />
            <button type="button" className="btn btn--primary btn--block" onClick={() => setConfirming(true)}>
              Book this gig
            </button>
          </>
        )}

        {isOwner && (
          <Link to="/my-gigs" className="btn btn--ghost btn--block">
            Manage in My gigs
          </Link>
        )}
      </aside>

      <ConfirmDialog
        open={confirming}
        title="Confirm simulated payment"
        confirmLabel={`Pay ${formatCurrency(gig.price)}`}
        onConfirm={handleBook}
        onCancel={() => setConfirming(false)}
        busy={booking}
      >
        <p>
          You are booking <strong>{gig.title}</strong> for <strong>{formatCurrency(gig.price)}</strong>.
        </p>
        <p className="muted">This is a simulated payment. No card details are collected and no money is charged.</p>
      </ConfirmDialog>
    </div>
  );
}
