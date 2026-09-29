import { Navigate, useLocation } from 'react-router';

import { homePathFor, useAuth } from '../context/AuthContext';
import { Loading } from './ui';

// Hides pages from users who are not signed in or lack the role. This is for
// navigation only: the API enforces the same rules on every request.
export default function ProtectedRoute({ roles, children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Loading label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return children;
}
