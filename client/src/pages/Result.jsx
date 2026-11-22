import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [resultData, setResultData] = useState(() => location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState('');

  const autoSubmitted = location.state?.autoSubmitted || false;
  const attemptIdParam = searchParams.get('id');

  // If result data wasn't in location.state, try fetching from ID query parameter
  useEffect(() => {
    if (resultData) {
      setLoading(false);
      return;
    }

    if (!attemptIdParam) {
      setLoading(false);
      return;
    }

    const fetchAttempt = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/attempts/${attemptIdParam}`);
        setResultData(res.data);
      } catch (err) {
        console.error('Failed to load attempt details:', err);
        setError(
          err.response?.data?.message || 'Could not find or retrieve this test result.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptIdParam, resultData]);

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading test results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <h3>Result Error</h3>
          <p>{error}</p>
          <div className="actions-row">
            <Link to="/test" className="btn btn-primary">
              Take New Test
            </Link>
            <Link to="/history" className="btn btn-outline">
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <span className="empty-icon">📊</span>
          <h3>No Test Result Selected</h3>
          <p>
            You can take a new online test or select a completed test from your history.
          </p>
          <div className="actions-row">
            <Link to="/test" className="btn btn-primary">
              Start a Test
            </Link>
            <Link to="/history" className="btn btn-outline">
              Review History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { score, total, details, date } = resultData;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const isPassed = percentage >= 60;
  const formattedDate = date ? new Date(date).toLocaleString() : 'Just now';

  return (
    <div className="page-container result-page">
      {autoSubmitted && (
        <div className="alert alert-warning" role="alert">
          <span className="alert-icon">⏱️</span>
          <span>Time is up! Your test answers were automatically submitted.</span>
        </div>
      )}

      {/* Score Overview Card */}
      <div className="score-summary-card">
        <div className="score-summary-left">
          <span className="summary-date">Completed on {formattedDate}</span>
          <h2 className="summary-heading">Test Evaluation Summary</h2>
          <p className="summary-subtext">
            {isPassed
              ? 'Great job! You demonstrated strong comprehension of the subject material.'
              : 'Keep practicing! Review the detailed breakdown below to see what you missed.'}
          </p>
          <div className="summary-actions">
            <button
              onClick={() => navigate('/subjects')}
              className="btn btn-primary btn-md"
            >
              ← Choose Another Subject
            </button>
            <Link to="/history" className="btn btn-outline btn-md">
              View All Attempts
            </Link>
          </div>
        </div>

        <div className="score-summary-right">
          <div className={`score-circle ${isPassed ? 'passed' : 'failed'}`}>
            <span className="score-large">{score}</span>
            <span className="score-divider">/ {total}</span>
            <span className="score-percent">{percentage}%</span>
          </div>
          <span className={`status-pill ${isPassed ? 'status-pass' : 'status-fail'}`}>
            {isPassed ? 'Passed' : 'Needs Practice'}
          </span>
        </div>
      </div>

      {/* Breakdown Header */}
      <div className="review-section-header">
        <h3>Question Breakdown & Answers</h3>
        <p className="review-hint">
          Green denotes correct choices, while red highlights mistakes or unanswered questions.
        </p>
      </div>

      {/* Questions Review List */}
      <div className="review-list">
        {details &&
          details.map((item, idx) => {
            const isCorrect = item.isCorrect;
            const hasAnswered = item.selectedIndex !== null && item.selectedIndex !== undefined;

            return (
              <div
                key={item.questionId || idx}
                className={`review-card ${isCorrect ? 'card-correct' : 'card-incorrect'}`}
              >
                <div className="review-card-top">
                  <div className="review-q-number">
                    <span className="badge-q">Q{idx + 1}</span>
                    <span
                      className={`badge-status ${
                        isCorrect ? 'badge-correct' : 'badge-wrong'
                      }`}
                    >
                      {isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
                    </span>
                  </div>

                  {!hasAnswered && (
                    <span className="badge-unanswered">Unanswered</span>
                  )}
                </div>

                <h4 className="review-question-text">{item.question}</h4>

                <div className="review-options-list">
                  {item.options.map((optText, optIdx) => {
                    const isUserChoice = item.selectedIndex === optIdx;
                    const isTheCorrectOption = item.correctIndex === optIdx;

                    let optClass = 'review-option';
                    if (isTheCorrectOption) {
                      optClass += ' option-is-correct';
                    }
                    if (isUserChoice && !isTheCorrectOption) {
                      optClass += ' option-user-wrong';
                    }

                    return (
                      <div key={optIdx} className={optClass}>
                        <div className="option-letter">
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <div className="option-text-col">
                          <span>{optText}</span>
                          <div className="option-flags">
                            {isUserChoice && (
                              <span className="tag-your-answer">Your Answer</span>
                            )}
                            {isTheCorrectOption && (
                              <span className="tag-correct-answer">Correct Answer</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Result;
