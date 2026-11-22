import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Verifying permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="error-card admin-forbidden-card">
          <span className="error-icon">🚫</span>
          <h3>Access Denied</h3>
          <p>
            You are currently signed in as <strong>{user?.name || user?.email}</strong> (Role:{' '}
            <span className="user-role-badge">{user?.role || 'student'}</span>).
          </p>
          <p className="forbidden-text">
            This administration portal is strictly restricted to users with administrator privileges.
          </p>
          <div className="actions-row">
            <Link to="/subjects" className="btn btn-primary">
              ← Return to Subjects
            </Link>
            <Link to="/history" className="btn btn-outline">
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
