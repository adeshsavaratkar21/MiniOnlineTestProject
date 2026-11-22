import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const History = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/attempts');
      setAttempts(res.data);
    } catch (err) {
      console.error('Failed to fetch test history:', err);
      setError(
        err.response?.data?.message ||
        'Could not load your test history. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const handleViewDetails = (attempt) => {
    navigate(`/result?id=${attempt._id}`, {
      state: {
        result: {
          attemptId: attempt._id,
          score: attempt.score,
          total: attempt.total,
          percentage:
            attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0,
          date: attempt.date,
          details: attempt.details
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading your test history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <h3>Error Loading History</h3>
          <p>{error}</p>
          <button onClick={fetchAttempts} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container history-page">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Attempt History</h2>
          <p className="page-subtitle">
            Review your past exam submissions, scores, and answer keys.
          </p>
        </div>
        <Link to="/test" className="btn btn-primary">
          Take New Test
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">📋</span>
          <h3>No Test Attempts Yet</h3>
          <p>
            You haven't completed any tests yet. Take your first test now to test your knowledge!
          </p>
          <Link to="/test" className="btn btn-primary">
            Start Your First Test
          </Link>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, index) => {
                const percentage =
                  attempt.total > 0
                    ? Math.round((attempt.score / attempt.total) * 100)
                    : 0;
                const isPassed = percentage >= 60;
                const formattedDate = attempt.date
                  ? new Date(attempt.date).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  : 'N/A';

                return (
                  <tr key={attempt._id}>
                    <td>{attempts.length - index}</td>
                    <td>{formattedDate}</td>
                    <td>
                      <strong>{attempt.score}</strong> / {attempt.total}
                    </td>
                    <td>
                      <span className="percent-text">{percentage}%</span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          isPassed ? 'status-pass' : 'status-fail'
                        }`}
                      >
                        {isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(attempt)}
                        className="btn btn-outline btn-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;
