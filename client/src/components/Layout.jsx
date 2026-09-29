import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';

import { homePathFor, useAuth } from '../context/AuthContext';
import { capitalise } from '../utils/format';

const LINKS = {
  client: [
    { to: '/gigs', label: 'Browse gigs' },
    { to: '/bookings', label: 'My bookings' },
    { to: '/transactions', label: 'Payments' }
  ],
  freelancer: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/my-gigs', label: 'My gigs' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/transactions', label: 'Transactions' }
  ],
  admin: [
    { to: '/admin', label: 'Admin' },
    { to: '/gigs', label: 'Gigs' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/transactions', label: 'Transactions' }
  ]
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const links = user ? LINKS[user.role] || [] : [];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to={user ? homePathFor(user.role) : '/login'} className="brand" aria-label="HustleHub+ home">
            <span className="brand__mark" aria-hidden="true">H+</span>
            <span className="brand__name">HustleHub+</span>
          </Link>

          {user && (
            <>
              <button
                type="button"
                className="topbar__toggle"
                aria-expanded={menuOpen}
                aria-controls="main-nav"
                onClick={() => setMenuOpen((open) => !open)}
              >
                Menu
              </button>
              <nav id="main-nav" className={`nav${menuOpen ? ' nav--open' : ''}`} aria-label="Main">
                {links.map((link) => (
                  <NavLink key={link.to} to={link.to} className="nav__link" onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                ))}
                <div className="nav__user">
                  <span className="nav__name">
                    {user.name} <span className={`role-pill role-pill--${user.role}`}>{capitalise(user.role)}</span>
                  </span>
                  <button type="button" className="btn btn--ghost btn--small" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              </nav>
            </>
          )}
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        HustleHub+ · Payments on this platform are simulated. No real money is charged.
      </footer>
    </div>
  );
}
