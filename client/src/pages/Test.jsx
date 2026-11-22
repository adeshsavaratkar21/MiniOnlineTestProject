import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TOTAL_TIME_SECONDS = 10 * 60; // 10 minutes (600 seconds)

const Test = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [visited, setVisited] = useState({}); // { [questionId]: boolean }
  const [review, setReview] = useState({}); // { [questionId]: boolean }
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
        setCurrentIndex(0);
        // Reset timer and answers
        setTimeLeft(TOTAL_TIME_SECONDS);
        setAnswers({});
        setReview({});
        answersRef.current = {};
        isSubmittedRef.current = false;

        // Mark first question as visited
        if (res.data[0]) {
          setVisited({ [res.data[0]._id]: true });
        }
      } else {
        setFetchError('No questions returned by the server.');
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      const msg =
        err.response?.data?.message ||
        'Could not load questions. Please ensure the server is running.';
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
      setShowConfirmModal(false);

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

  // Navigate to a specific question index
  const goToQuestion = (targetIdx) => {
    if (targetIdx < 0 || targetIdx >= questions.length || submitting) return;
    setCurrentIndex(targetIdx);
    const targetQ = questions[targetIdx];
    if (targetQ) {
      setVisited((prev) => ({ ...prev, [targetQ._id]: true }));
    }
  };

  // Next Question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  // Previous Question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  // Handle option selection
  const handleOptionSelect = (optionIndex) => {
    if (submitting || isSubmittedRef.current) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: optionIndex
    }));
  };

  // Clear current question's selected answer
  const handleClearResponse = () => {
    if (submitting || isSubmittedRef.current) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ._id];
      return copy;
    });
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    if (submitting || isSubmittedRef.current) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setReview((prev) => ({
      ...prev,
      [currentQ._id]: !prev[currentQ._id]
    }));
  };

  // Format time into Hours, Minutes, Seconds
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const isTimeCritical = timeLeft < 60; // Less than 1 minute

  // Determine palette state for a question
  const getQuestionState = (q, idx) => {
    const isCurrent = idx === currentIndex;
    const isAnswered = answers[q._id] !== undefined && answers[q._id] !== null;
    const isVisited = visited[q._id] === true;
    const isReviewed = review[q._id] === true;

    if (isCurrent) return 'current'; // Blue
    if (isReviewed) return 'review'; // Maroon / Review
    if (isAnswered) return 'attempted'; // Green
    if (isVisited) return 'skip'; // Orange / Skipped
    return 'null'; // Gray / Not Attempted (null)
  };

  // Summary counts
  const totalCount = questions.length;
  let attemptedCount = 0;
  let skippedCount = 0;
  let nullCount = 0;
  let reviewCount = 0;

  questions.forEach((q, idx) => {
    const isAnswered = answers[q._id] !== undefined && answers[q._id] !== null;
    const isVisited = visited[q._id] === true;
    const isReviewed = review[q._id] === true;

    if (isReviewed) reviewCount += 1;
    if (isAnswered) {
      attemptedCount += 1;
    } else if (isVisited) {
      skippedCount += 1;
    } else {
      nullCount += 1;
    }
  });

  // Group questions by Subject for the palette
  const subjectsMap = {};
  questions.forEach((q, idx) => {
    const subject = q.subject || 'General';
    if (!subjectsMap[subject]) {
      subjectsMap[subject] = [];
    }
    subjectsMap[subject].push({ question: q, index: idx });
  });

  const currentQ = questions[currentIndex];
  const isCurrentAnswered =
    currentQ && answers[currentQ._id] !== undefined && answers[currentQ._id] !== null;
  const isCurrentReviewed = currentQ && review[currentQ._id] === true;

  if (loading) {
    return (
      <div className="cat-page-wrapper loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading examination paper...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="cat-page-wrapper">
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
    <div className="cat-exam-portal">
      {/* Top Exam Header Bar */}
      <div className="cat-top-header">
        <h2 className="cat-exam-title">Online Test - CAT / Examination Portal</h2>
        <span className="cat-total-badge">
          Total Questions: {questions.length}
        </span>
      </div>

      {submitError && (
        <div className="alert alert-error cat-portal-alert" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      {/* Main 2-Column Examination Workspace */}
      <div className="cat-workspace">
        {/* Left Column: Question Area & Navigation */}
        <div className="cat-left-pane">
          {currentQ && (
            <div className="cat-question-container">
              {/* Question Header */}
              <div className="cat-question-header">
                <h3 className="cat-question-title">
                  {currentQ.subject || 'General'} - Question {currentIndex + 1}
                </h3>
                {isCurrentReviewed && (
                  <span className="badge-review-flag">🚩 Marked for Review</span>
                )}
              </div>

              <div className="cat-question-divider"></div>

              {/* Question Text */}
              <div className="cat-question-body">
                <p className="cat-question-text">{currentQ.question}</p>
              </div>

              {/* 4 Multiple Choice Options */}
              <div className="cat-options-list">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = answers[currentQ._id] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleOptionSelect(optIdx)}
                      className={`cat-option-row ${isSelected ? 'cat-option-selected' : ''}`}
                    >
                      <div className={`cat-option-box ${isSelected ? 'checked' : ''}`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div className="cat-option-label-text">
                        <span className="cat-option-letter">{letter}.</span>
                        <span className="cat-option-text">{optionText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action & Navigation Buttons */}
          <div className="cat-bottom-action-bar">
            <div className="cat-actions-left">
              <button
                type="button"
                onClick={handleToggleReview}
                className={`btn cat-btn-review ${isCurrentReviewed ? 'is-active' : ''}`}
                disabled={submitting}
              >
                {isCurrentReviewed ? 'Unmark Review' : 'Mark for review'}
              </button>

              {isCurrentAnswered && (
                <button
                  type="button"
                  onClick={handleClearResponse}
                  className="btn cat-btn-clear"
                  disabled={submitting}
                >
                  Clear Response
                </button>
              )}
            </div>

            <div className="cat-actions-middle">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0 || submitting}
                className="btn cat-btn-nav"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1 || submitting}
                className="btn cat-btn-nav"
              >
                Next
              </button>
            </div>

            <div className="cat-actions-right">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="btn cat-btn-submit"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>

          {/* Color Code Legend */}
          <div className="cat-legend-bar">
            <div className="cat-legend-item">
              <span className="legend-dot dot-current"></span>
              <span>Current</span>
            </div>
            <div className="cat-legend-item">
              <span className="legend-dot dot-null"></span>
              <span>Not Attempted</span>
            </div>
            <div className="cat-legend-item">
              <span className="legend-dot dot-attempted"></span>
              <span>Answered</span>
            </div>
            <div className="cat-legend-item">
              <span className="legend-dot dot-skip"></span>
              <span>Not Answered</span>
            </div>
            <div className="cat-legend-item">
              <span className="legend-dot dot-review"></span>
              <span>Review</span>
            </div>
          </div>
        </div>

        {/* Right Column: Time Left & Question Palette Grid */}
        <aside className="cat-right-pane">
          {/* Time Left Box */}
          <div className="cat-sidebar-card cat-timer-card">
            <div className="cat-card-header">
              <h4>Time Left</h4>
            </div>
            <div className={`cat-timer-digits ${isTimeCritical ? 'critical' : ''}`}>
              <div className="timer-unit">
                <span className="timer-num">
                  {String(hours).padStart(2, '0')}
                </span>
                <span className="timer-lbl">hours</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-unit">
                <span className="timer-num">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span className="timer-lbl">minutes</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-unit">
                <span className="timer-num">
                  {String(seconds).padStart(2, '0')}
                </span>
                <span className="timer-lbl">seconds</span>
              </div>
            </div>
          </div>

          {/* Question Palette grouped by Sections / Subjects */}
          <div className="cat-sidebar-card cat-palette-card">
            {Object.keys(subjectsMap).map((subject) => {
              const list = subjectsMap[subject];
              return (
                <div key={subject} className="cat-palette-section">
                  <div className="cat-card-header">
                    <h4>{subject}</h4>
                  </div>
                  <div className="cat-palette-grid">
                    {list.map(({ question: q, index: idx }) => {
                      const state = getQuestionState(q, idx);
                      return (
                        <button
                          key={q._id}
                          type="button"
                          onClick={() => goToQuestion(idx)}
                          className={`cat-palette-cell cell-${state}`}
                          title={`Question ${idx + 1} (${state})`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Summary Pill Stats */}
          <div className="cat-sidebar-card cat-summary-card">
            <div className="summary-stat-row">
              <span className="stat-pill-label">
                <span className="legend-dot dot-attempted"></span> Answered:
              </span>
              <strong>{attemptedCount}</strong>
            </div>
            <div className="summary-stat-row">
              <span className="stat-pill-label">
                <span className="legend-dot dot-skip"></span> Not Answered:
              </span>
              <strong>{skippedCount}</strong>
            </div>
            <div className="summary-stat-row">
              <span className="stat-pill-label">
                <span className="legend-dot dot-null"></span> Not Visited:
              </span>
              <strong>{nullCount}</strong>
            </div>
            {reviewCount > 0 && (
              <div className="summary-stat-row">
                <span className="stat-pill-label">
                  <span className="legend-dot dot-review"></span> In Review:
                </span>
                <strong>{reviewCount}</strong>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Confirmation Modal before Final Submit */}
      {showConfirmModal && (
        <div className="cat-modal-backdrop">
          <div className="cat-modal-box">
            <h3 className="modal-title">Ready to Submit Examination?</h3>
            <p className="modal-desc">
              Please review your test status summary before submitting:
            </p>

            <div className="modal-stats-grid">
              <div className="modal-stat-card stat-green">
                <span className="stat-value">{attemptedCount}</span>
                <span className="stat-name">Answered</span>
              </div>
              <div className="modal-stat-card stat-orange">
                <span className="stat-value">{skippedCount}</span>
                <span className="stat-name">Not Answered</span>
              </div>
              <div className="modal-stat-card stat-gray">
                <span className="stat-value">{nullCount}</span>
                <span className="stat-name">Not Visited</span>
              </div>
            </div>

            {skippedCount + nullCount > 0 && (
              <p className="modal-warning-text">
                ⚠️ You have {skippedCount + nullCount} unanswered question(s). Unanswered questions will receive 0 points.
              </p>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-outline"
                disabled={submitting}
              >
                Back to Test
              </button>
              <button
                type="button"
                onClick={() => submitTest(false)}
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Final Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;
