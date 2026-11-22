import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">CBSE 10th Exam Portal</span>
        </NavLink>

        <nav className="navbar-links">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/subjects"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                Subjects
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                History
              </NavLink>
              <div className="navbar-user-info">
                <span className="user-greeting">
                  👤 {user?.name || 'User'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm logout-btn"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  isActive ? 'nav-link active btn-nav-signup' : 'nav-link btn-nav-signup'
                }
              >
                Sign Up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
