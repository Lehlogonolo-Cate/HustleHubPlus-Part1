import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { api } from '../api/client';
import GigCard from '../components/GigCard';
import { Alert, EmptyState, Loading, PageHeader } from '../components/ui';
import { GIG_CATEGORIES, capitalise } from '../utils/format';

export default function GigsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    let active = true;
    api
      .listGigs({ search: search || undefined, category: category || undefined, page, limit: 12 })
      .then((data) => active && (setResult(data), setError(null)))
      .catch((err) => active && setError(err));
    return () => {
      active = false;
    };
  }, [search, category, page]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setSearchParams(next);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ search: searchText.trim().slice(0, 100), page: '' });
  };

  return (
    <>
      <PageHeader title="Browse gigs" subtitle="Find a freelancer for your next project." />

      <form className="toolbar" onSubmit={handleSearch} role="search">
        <label className="visually-hidden" htmlFor="gig-search">
          Search gigs
        </label>
        <input
          id="gig-search"
          type="search"
          placeholder="Search by title…"
          value={searchText}
          maxLength={100}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <label className="visually-hidden" htmlFor="gig-category">
          Category
        </label>
        <select id="gig-category" value={category} onChange={(event) => updateParams({ category: event.target.value, page: '' })}>
          <option value="">All categories</option>
          {GIG_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {capitalise(item)}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn--primary">
          Search
        </button>
      </form>

      <Alert requestId={error?.requestId}>{error?.message}</Alert>

      {!result && !error && <Loading />}

      {result && result.gigs.length === 0 && (
        <EmptyState title="No gigs found">Try a different search or category.</EmptyState>
      )}

      {result && result.gigs.length > 0 && (
        <>
          <div className="gig-grid">
            {result.gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
          {result.pagination.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn--ghost" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
                Previous
              </button>
              <span>
                Page {page} of {result.pagination.pages}
              </span>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={page >= result.pagination.pages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
