import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { EmptyState, Loading } from './components/ui';
import { homePathFor, useAuth } from './context/AuthContext';
import BookingsPage from './pages/BookingsPage';
import GigDetailPage from './pages/GigDetailPage';
import GigsPage from './pages/GigsPage';
import LoginPage from './pages/LoginPage';
import MyGigsPage from './pages/MyGigsPage';
import RegisterPage from './pages/RegisterPage';
import TransactionsPage from './pages/TransactionsPage';

// The chart library is only downloaded by users who open these pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function Home() {
  const { user, checking } = useAuth();
  if (checking) return null;
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

const guard = (element, roles) => (
  <ProtectedRoute roles={roles}>
    <Suspense fallback={<Loading />}>{element}</Suspense>
  </ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route path="gigs" element={guard(<GigsPage />)} />
        <Route path="gigs/:id" element={guard(<GigDetailPage />)} />
        <Route path="bookings" element={guard(<BookingsPage />)} />
        <Route path="transactions" element={guard(<TransactionsPage />)} />
        <Route path="dashboard" element={guard(<DashboardPage />, ['freelancer'])} />
        <Route path="my-gigs" element={guard(<MyGigsPage />, ['freelancer'])} />
        <Route path="admin" element={guard(<AdminPage />, ['admin'])} />

        <Route
          path="*"
          element={
            <EmptyState title="Page not found">
              <Link to="/">Go to the home page</Link>
            </EmptyState>
          }
        />
      </Route>
    </Routes>
  );
}
