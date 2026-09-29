import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';

import { api } from '../api/client';
import GigForm from '../components/GigForm';
import { Alert, ConfirmDialog, EmptyState, Loading, PageHeader } from '../components/ui';
import { capitalise, formatCurrency } from '../utils/format';

export default function MyGigsPage() {
  const [gigs, setGigs] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new gig, gig = editing
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .myGigs()
      .then(({ gigs: data }) => setGigs(data))
      .catch(setError);
  }, []);

  useEffect(load, [load]);

  const handleSave = async (values) => {
    if (editing.id) {
      await api.updateGig(editing.id, values);
      setNotice('Gig updated.');
    } else {
      await api.createGig(values);
      setNotice('Gig created.');
    }
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.deleteGig(deleting.id);
      setNotice('Gig deleted.');
      load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="My gigs"
        subtitle="Create and manage the services you offer."
        actions={
          !editing && (
            <button type="button" className="btn btn--primary" onClick={() => (setNotice(null), setEditing({}))}>
              New gig
            </button>
          )
        }
      />

      <Alert type="success">{notice}</Alert>
      <Alert requestId={error?.requestId}>{error?.message}</Alert>

      {editing && (
        <section className="card">
          <h2>{editing.id ? 'Edit gig' : 'New gig'}</h2>
          <GigForm initialGig={editing.id ? editing : null} onSubmit={handleSave} onCancel={() => setEditing(null)} />
        </section>
      )}

      {!gigs && !error && <Loading />}

      {gigs && gigs.length === 0 && !editing && (
        <EmptyState title="You have no gigs yet">Create your first gig so clients can book you.</EmptyState>
      )}

      {gigs && gigs.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {gigs.map((gig) => (
                <tr key={gig.id}>
                  <td>
                    <Link to={`/gigs/${gig.id}`}>{gig.title}</Link>
                  </td>
                  <td>{capitalise(gig.category)}</td>
                  <td>{formatCurrency(gig.price)}</td>
                  <td>
                    <span className={`badge ${gig.isActive ? 'badge--paid' : 'badge--cancelled'}`}>{gig.isActive ? 'Visible' : 'Hidden'}</span>
                  </td>
                  <td className="table__actions">
                    <button type="button" className="btn btn--ghost btn--small" onClick={() => (setNotice(null), setEditing(gig))}>
                      Edit
                    </button>
                    <button type="button" className="btn btn--danger-ghost btn--small" onClick={() => setDeleting(gig)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete gig?"
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      >
        <p>
          <strong>{deleting?.title}</strong> will be removed. Existing bookings and transactions keep their records.
        </p>
      </ConfirmDialog>
    </>
  );
}
