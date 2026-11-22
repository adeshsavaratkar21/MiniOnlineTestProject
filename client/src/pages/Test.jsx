import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TOTAL_TIME_SECONDS = 10 * 60; // 10 minutes (600 seconds)

const Test = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const navigate = useNavigate();

  // Use refs to avoid stale closure issues in countdown interval
  const answersRef = useRef({});
  const isSubmittedRef = useRef(false);
  const questionsRef = useRef([]);

  // Keep refs in sync with state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Fetch 10 random questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await api.get('/api/questions');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setQuestions(res.data);
        questionsRef.current = res.data;
        // Reset timer and answers
        setTimeLeft(TOTAL_TIME_SECONDS);
        setAnswers({});
        answersRef.current = {};
        isSubmittedRef.current = false;
      } else {
        setFetchError('No questions returned by the server.');
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      const msg =
        err.response?.data?.message ||
        'Could not load questions. Please ensure the server is running and database is seeded.';
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Submit test function
  const submitTest = useCallback(
    async (isAutoSubmit = false) => {
      // Prevent double submissions
      if (isSubmittedRef.current || submitting) {
        return;
      }

      isSubmittedRef.current = true;
      setSubmitting(true);
      setSubmitError('');

      try {
        const currentQuestions = questionsRef.current;
        const currentAnswers = answersRef.current;

        // Build answers payload: send selectedIndex or null for unanswered
        const answersPayload = currentQuestions.map((q) => ({
          questionId: q._id,
          selectedIndex:
            currentAnswers[q._id] !== undefined && currentAnswers[q._id] !== null
              ? currentAnswers[q._id]
              : null
        }));

        const res = await api.post('/api/attempts', { answers: answersPayload });

        // Navigate to result page with the returned evaluation details
        navigate('/result', {
          state: {
            result: res.data,
            autoSubmitted: isAutoSubmit
          },
          replace: true
        });
      } catch (err) {
        console.error('Failed to submit test:', err);
        isSubmittedRef.current = false;
        setSubmitting(false);
        const msg =
          err.response?.data?.message ||
          'Failed to submit test answers. Please try clicking Submit again.';
        setSubmitError(msg);
      }
    },
    [navigate, submitting]
  );

  // 10-Minute Countdown Timer
  useEffect(() => {
    if (loading || fetchError || questions.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Auto submit when timer reaches 0
          submitTest(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, fetchError, questions.length, submitTest]);

  // Handle radio selection
  const handleOptionSelect = (questionId, optionIndex) => {
    if (submitting || isSubmittedRef.current) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Format seconds into MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeft < 60; // Less than 1 minute

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Preparing your test questions...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-container">
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <h3>Unable to Start Test</h3>
          <p>{fetchError}</p>
          <button onClick={fetchQuestions} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="test-page-container">
      {/* Top Sticky Header with Timer & Stats */}
      <div className="test-sticky-bar">
        <div className="test-header-content">
          <div className="test-info-block">
            <h2 className="test-title">Online Examination</h2>
            <span className="answered-pill">
              {answeredCount} of {questions.length} Answered
            </span>
          </div>

          <div className={`timer-badge ${isTimeCritical ? 'critical' : ''}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">{formatTime(timeLeft)}</span>
            {isTimeCritical && <span className="timer-warning-label">Hurry!</span>}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="test-content">
        {submitError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="questions-list">
          {questions.map((q, index) => {
            const isAnswered = answers[q._id] !== undefined;

            return (
              <div
                key={q._id}
                className={`question-card ${isAnswered ? 'is-answered' : ''}`}
                id={`q-${index + 1}`}
              >
                <div className="question-header">
                  <div className="question-number-badge">
                    Question {index + 1} of {questions.length}
                  </div>
                  {q.subject && <span className="subject-tag">{q.subject}</span>}
                </div>

                <h3 className="question-text">{q.question}</h3>

                <div className="options-grid">
                  {q.options.map((option, optIdx) => {
                    const isSelected = answers[q._id] === optIdx;
                    return (
                      <label
                        key={optIdx}
                        className={`option-label ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`question-${q._id}`}
                          value={optIdx}
                          checked={isSelected}
                          onChange={() => handleOptionSelect(q._id, optIdx)}
                          disabled={submitting}
                          className="option-radio"
                        />
                        <span className="option-indicator">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="option-text">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Submission Action Bar */}
        <div className="test-footer-actions">
          <div className="footer-status-text">
            {answeredCount === questions.length ? (
              <span className="status-complete">
                ✓ All {questions.length} questions answered.
              </span>
            ) : (
              <span className="status-incomplete">
                ⚠️ {questions.length - answeredCount} unanswered{' '}
                {questions.length - answeredCount === 1 ? 'question' : 'questions'}.
                Unanswered questions count as incorrect.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                answeredCount < questions.length &&
                !window.confirm(
                  `You have ${questions.length - answeredCount} unanswered questions. Unanswered questions will be scored 0. Submit now?`
                )
              ) {
                return;
              }
              submitTest(false);
            }}
            className="btn btn-success btn-lg submit-test-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting Test...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Test;
