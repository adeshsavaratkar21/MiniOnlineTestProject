import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../services/api';

const formatTimeTaken = (seconds) => {
  if (typeof seconds !== 'number' || seconds <= 0) return '< 1m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

const History = () => {
  const [attempts, setAttempts] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
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

  // Unique list of subjects present in attempts
  const availableSubjects = useMemo(() => {
    const set = new Set();
    attempts.forEach((a) => {
      if (a.subject) set.add(a.subject);
    });
    return Array.from(set);
  }, [attempts]);

  // Filtered attempts based on subject dropdown
  const filteredAttempts = useMemo(() => {
    if (selectedSubject === 'All') return attempts;
    return attempts.filter((a) => (a.subject || 'General') === selectedSubject);
  }, [attempts, selectedSubject]);

  // Prepare chronological data for Recharts (earliest to latest)
  const chartData = useMemo(() => {
    return [...filteredAttempts]
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      .map((att, index) => {
        const pct =
          att.percentage !== undefined
            ? att.percentage
            : att.total > 0
            ? Math.round((att.score / att.total) * 100)
            : 0;
        const d = att.date ? new Date(att.date) : new Date();
        const dateLabel =
          d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
          ' ' +
          d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        return {
          attemptNum: index + 1,
          dateLabel,
          subject: att.subject || 'General',
          percentage: pct,
          score: att.score,
          total: att.total,
          timeTaken: att.timeTaken || 0
        };
      });
  }, [filteredAttempts]);

  // Navigate to Result page with full attempt details
  const handleViewDetails = (attempt) => {
    navigate(`/result?id=${attempt._id}`, {
      state: {
        result: {
          attemptId: attempt._id,
          subject: attempt.subject || 'General',
          score: attempt.score,
          total: attempt.total,
          percentage:
            attempt.percentage !== undefined
              ? attempt.percentage
              : attempt.total > 0
              ? Math.round((attempt.score / attempt.total) * 100)
              : 0,
          timeTaken: attempt.timeTaken || 0,
          chapterBreakdown: attempt.chapterBreakdown || [],
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
          <h2 className="page-title">Attempt History & Analytics</h2>
          <p className="page-subtitle">
            Review your score trends over time, exam submissions, and chapter breakdown answer keys.
          </p>
        </div>
        <Link to="/subjects" className="btn btn-primary">
          Take New Test
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">📋</span>
          <h3>No Test Attempts Yet</h3>
          <p>
            You haven't completed any tests yet. Choose a Class 10 subject to test your knowledge!
          </p>
          <Link to="/subjects" className="btn btn-primary">
            Start Your First Test
          </Link>
        </div>
      ) : (
        <>
          {/* Performance Line Chart over Time */}
          <div className="history-chart-card">
            <div className="history-chart-header">
              <div className="chart-title-group">
                <span className="chart-badge">📈 Performance Trend</span>
                <h3 className="chart-title">Score Percentage Over Time</h3>
                <p className="chart-subtitle">
                  Tracking your accuracy progression across tests ({chartData.length}{' '}
                  {chartData.length === 1 ? 'attempt' : 'attempts'} recorded)
                </p>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="chart-empty-state">
                <p>No attempts match the selected subject filter.</p>
              </div>
            ) : (
              <div className="chart-container" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="dateLabel"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      domain={[0, 100]}
                      unit="%"
                      tickCount={6}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="chart-custom-tooltip">
                              <p className="tooltip-title">{data.subject}</p>
                              <p className="tooltip-date">{data.dateLabel}</p>
                              <div className="tooltip-divider"></div>
                              <p className="tooltip-stat">
                                Score:{' '}
                                <strong>
                                  {data.score} / {data.total}
                                </strong>{' '}
                                ({data.percentage}%)
                              </p>
                              <p className="tooltip-stat">
                                Time Taken: <strong>{formatTimeTaken(data.timeTaken)}</strong>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      name="Score Percentage (%)"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#1d4ed8', stroke: '#dbeafe', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Subject Filter Bar Above Table */}
          <div className="history-filter-bar">
            <div className="filter-group">
              <label htmlFor="subject-filter" className="filter-label">
                Filter by Subject:
              </label>
              <select
                id="subject-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="subject-filter-select"
              >
                <option value="All">All Subjects ({attempts.length})</option>
                {availableSubjects.map((sub) => {
                  const count = attempts.filter((a) => (a.subject || 'General') === sub).length;
                  return (
                    <option key={sub} value={sub}>
                      {sub} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <span className="filter-count-badge">
              Showing <strong>{filteredAttempts.length}</strong> of {attempts.length} attempts
            </span>
          </div>

          {/* Attempts Table */}
          {filteredAttempts.length === 0 ? (
            <div className="empty-filter-card">
              <span className="empty-icon">🔍</span>
              <h4>No Attempts Found</h4>
              <p>You haven't completed any test attempts for "{selectedSubject}" yet.</p>
              <button
                onClick={() => setSelectedSubject('All')}
                className="btn btn-outline btn-sm"
              >
                Reset Filter to All Subjects
              </button>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Time Taken</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttempts.map((attempt) => {
                    const percentage =
                      attempt.percentage !== undefined
                        ? attempt.percentage
                        : attempt.total > 0
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
                        <td>
                          <span className="table-date">{formattedDate}</span>
                        </td>
                        <td>
                          <span className="subject-tag">
                            {attempt.subject || 'General'}
                          </span>
                        </td>
                        <td>
                          <strong>{attempt.score}</strong> / {attempt.total}
                        </td>
                        <td>
                          <span className="percent-text">{percentage}%</span>
                        </td>
                        <td>
                          <span className="time-taken-badge">
                            ⏱️ {formatTimeTaken(attempt.timeTaken)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              isPassed ? 'status-pass' : 'status-fail'
                            }`}
                          >
                            {isPassed ? 'Passed' : 'Needs Practice'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewDetails(attempt)}
                            className="btn btn-outline btn-sm"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
