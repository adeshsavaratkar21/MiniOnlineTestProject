import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Science',
  'Social Science',
  'English',
  'Information Technology'
];

const INITIAL_FORM = {
  subject: 'Mathematics',
  customSubject: '',
  chapter: '',
  difficulty: 'medium',
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0
};

const Admin = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters State
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Deletion confirmation state
  const [deletingId, setDeletingId] = useState(null);

  const formRef = useRef(null);

  // Fetch all questions for admin
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/questions');
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError(
        err.response?.data?.message || 'Could not fetch questions list. Please verify your admin access.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle option changes
  const handleOptionChange = (index, value) => {
    setFormData((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  // Handle correct radio selection
  const handleRadioChange = (index) => {
    setFormData((prev) => ({ ...prev, correctIndex: index }));
  };

  // Client-side validation
  const validateForm = () => {
    setFormError('');

    const resolvedSubject =
      formData.subject === 'Other'
        ? formData.customSubject.trim()
        : formData.subject.trim();

    if (!resolvedSubject) {
      return 'Please choose or enter a valid subject.';
    }

    if (!formData.chapter || !formData.chapter.trim()) {
      return 'Please enter a chapter name (e.g., Real Numbers, Life Processes).';
    }

    if (!formData.question || formData.question.trim().length < 5) {
      return 'Question text must be at least 5 characters long.';
    }

    for (let i = 0; i < 4; i++) {
      if (!formData.options[i] || !formData.options[i].trim()) {
        return `Option ${String.fromCharCode(65 + i)} cannot be blank. All 4 options are required.`;
      }
    }

    if (
      formData.correctIndex === null ||
      formData.correctIndex === undefined ||
      formData.correctIndex < 0 ||
      formData.correctIndex > 3
    ) {
      return 'Please select which option (A, B, C, or D) is the correct answer using the radio button.';
    }

    return null;
  };

  // Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const errorMsg = validateForm();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    const resolvedSubject =
      formData.subject === 'Other'
        ? formData.customSubject.trim()
        : formData.subject.trim();

    const payload = {
      subject: resolvedSubject,
      chapter: formData.chapter.trim(),
      difficulty: formData.difficulty,
      question: formData.question.trim(),
      options: formData.options.map((opt) => opt.trim()),
      correctIndex: Number(formData.correctIndex)
    };

    try {
      setSubmitting(true);

      if (editingId) {
        // Update question
        const res = await api.put(`/api/admin/questions/${editingId}`, payload);
        setQuestions((prev) =>
          prev.map((q) => (q._id === editingId ? res.data : q))
        );
        setSuccessMessage('Question updated successfully!');
        setEditingId(null);
      } else {
        // Create question
        const res = await api.post('/api/admin/questions', payload);
        setQuestions((prev) => [res.data, ...prev]);
        setSuccessMessage('New question added successfully to the question bank!');
      }

      // Reset form
      setFormData(INITIAL_FORM);
    } catch (err) {
      console.error('Failed to save question:', err);
      setFormError(
        err.response?.data?.message || 'Failed to save question. Please check all fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Enter Edit mode
  const handleEdit = (q) => {
    setEditingId(q._id);
    setFormError('');
    setSuccessMessage('');

    const isPresetSubject = DEFAULT_SUBJECTS.includes(q.subject);

    setFormData({
      subject: isPresetSubject ? q.subject : 'Other',
      customSubject: isPresetSubject ? '' : q.subject || '',
      chapter: q.chapter || '',
      difficulty: q.difficulty || 'medium',
      question: q.question || '',
      options: Array.isArray(q.options) && q.options.length === 4 ? [...q.options] : ['', '', '', ''],
      correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0
    });

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Cancel Edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setFormError('');
  };

  // Delete question
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setSuccessMessage('Question deleted successfully.');
      setDeletingId(null);

      // If we were editing this deleted question, reset form
      if (editingId === id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError(
        err.response?.data?.message || 'Could not delete question. Please try again.'
      );
      setDeletingId(null);
    }
  };

  // Filtered questions for the list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (subjectFilter !== 'All' && (q.subject || '') !== subjectFilter) {
        return false;
      }
      if (difficultyFilter !== 'All' && (q.difficulty || 'medium') !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const inQuestion = (q.question || '').toLowerCase().includes(query);
        const inChapter = (q.chapter || '').toLowerCase().includes(query);
        const inSubject = (q.subject || '').toLowerCase().includes(query);
        if (!inQuestion && !inChapter && !inSubject) {
          return false;
        }
      }
      return true;
    });
  }, [questions, subjectFilter, difficultyFilter, searchQuery]);

  // Unique subjects for filter
  const allSubjects = useMemo(() => {
    const set = new Set(DEFAULT_SUBJECTS);
    questions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [questions]);

  return (
    <div className="page-container admin-page">
      {/* Top Header */}
      <div className="admin-header-row">
        <div>
          <div className="admin-badge-strip">
            <span className="badge-admin-portal">⚙️ Administration Portal</span>
            <span className="badge-admin-count">{questions.length} Total Questions</span>
          </div>
          <h2 className="admin-page-title">Class 10 CBSE Question Management</h2>
          <p className="admin-page-subtitle">
            Create, update, and manage multiple-choice questions across subjects and chapters.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link to="/subjects" className="btn btn-outline">
            ← View Exam Portal
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Question Form (Add / Edit) */}
      <div className="admin-card-section" ref={formRef}>
        <div className="admin-section-header">
          <div>
            <h3 className="section-title">
              {editingId ? '✏️ Edit Existing Question' : '➕ Add New Question'}
            </h3>
            <p className="section-subtitle">
              {editingId
                ? 'Modify the question text, options, or correct answer below and click Update Question.'
                : 'Enter question details, 4 options, and mark the correct option with its radio button.'}
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn btn-outline btn-sm"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {formError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" role="alert">
            <span className="alert-icon">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-question-form">
          {/* Metadata Row: Subject, Custom Subject, Chapter, Difficulty */}
          <div className="form-grid-3">
            <div className="form-group">
              <label htmlFor="subject" className="form-label">
                Subject <span className="required-star">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                {DEFAULT_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="Other">Other / Custom Subject...</option>
              </select>
            </div>

            {formData.subject === 'Other' && (
              <div className="form-group">
                <label htmlFor="customSubject" className="form-label">
                  Custom Subject Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="customSubject"
                  name="customSubject"
                  value={formData.customSubject}
                  onChange={handleInputChange}
                  placeholder="e.g., Hindi Course A"
                  className="form-control"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="chapter" className="form-label">
                Chapter / Unit <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="chapter"
                name="chapter"
                value={formData.chapter}
                onChange={handleInputChange}
                placeholder="e.g., Real Numbers, Trigonometry"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="difficulty" className="form-label">
                Difficulty Level <span className="required-star">*</span>
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="easy">Easy (Foundational)</option>
                <option value="medium">Medium (Standard CBSE)</option>
                <option value="hard">Hard (Higher Order Thinking)</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div className="form-group">
            <label htmlFor="question" className="form-label">
              Question Text <span className="required-star">*</span>
            </label>
            <textarea
              id="question"
              name="question"
              rows={3}
              value={formData.question}
              onChange={handleInputChange}
              placeholder="Type the multiple-choice question clearly here..."
              className="form-control form-textarea"
              required
            />
          </div>

          {/* 4 Options with Radio Buttons for Correct Answer */}
          <div className="options-form-section">
            <div className="options-section-label">
              <span>Four Multiple Choice Options</span>
              <span className="options-hint">
                👉 Select the radio button corresponding to the <strong>correct answer</strong>.
              </span>
            </div>

            <div className="options-grid">
              {formData.options.map((optionText, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelectedCorrect = formData.correctIndex === optIdx;

                return (
                  <div
                    key={optIdx}
                    className={`admin-option-card ${
                      isSelectedCorrect ? 'is-correct-selected' : ''
                    }`}
                  >
                    <div className="option-radio-col">
                      <label className="radio-label-wrapper">
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={isSelectedCorrect}
                          onChange={() => handleRadioChange(optIdx)}
                          className="admin-radio-input"
                        />
                        <span className="radio-letter-badge">({letter})</span>
                      </label>
                    </div>

                    <div className="option-input-col">
                      <input
                        type="text"
                        value={optionText}
                        onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                        placeholder={`Enter Option ${letter} text...`}
                        className="form-control option-text-field"
                        required
                      />
                    </div>

                    {isSelectedCorrect && (
                      <span className="tag-correct-indicator">✓ Correct</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="admin-form-actions">
            <button
              type="submit"
              disabled={submitting}
              className={`btn ${editingId ? 'btn-success' : 'btn-primary'} btn-md`}
            >
              {submitting
                ? editingId
                  ? 'Saving Changes...'
                  : 'Adding Question...'
                : editingId
                ? '💾 Update Question'
                : '➕ Add Question to Bank'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={submitting}
                className="btn btn-outline btn-md"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Questions List & Search/Filter Section */}
      <div className="admin-card-section questions-list-section">
        <div className="admin-section-header">
          <div>
            <h3 className="section-title">Existing Question Bank</h3>
            <p className="section-subtitle">
              Browse, filter, edit, or delete existing CBSE exam questions.
            </p>
          </div>
          <span className="filter-count-badge">
            Showing <strong>{filteredQuestions.length}</strong> of {questions.length} questions
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="admin-toolbar-row">
          <div className="search-field-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by question text or chapter..."
              className="form-control search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-clear-search"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filters-group-row">
            <div className="filter-item">
              <label className="toolbar-label">Subject:</label>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="form-control select-filter"
              >
                <option value="All">All Subjects</option>
                {allSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="toolbar-label">Difficulty:</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="form-control select-filter"
              >
                <option value="All">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions Table / List */}
        {loading ? (
          <div className="loading-container py-12">
            <div className="spinner"></div>
            <p className="loading-text">Loading question bank...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="empty-state-card">
            <span className="empty-icon">📂</span>
            <h4>No Questions Found</h4>
            <p>
              No questions matched your search query or filter criteria. Try clearing filters or add a new question above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubjectFilter('All');
                setDifficultyFilter('All');
                setSearchQuery('');
              }}
              className="btn btn-outline btn-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '130px' }}>Subject</th>
                  <th style={{ width: '150px' }}>Chapter</th>
                  <th style={{ width: '90px' }}>Difficulty</th>
                  <th>Question & Options</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q, index) => {
                  const diff = q.difficulty || 'medium';
                  const isBeingEdited = editingId === q._id;

                  return (
                    <tr
                      key={q._id}
                      className={`admin-question-row ${
                        isBeingEdited ? 'row-is-editing' : ''
                      }`}
                    >
                      <td className="col-idx">{index + 1}</td>
                      <td>
                        <span className="subject-tag">{q.subject}</span>
                      </td>
                      <td>
                        <span className="chapter-tag">{q.chapter || 'General'}</span>
                      </td>
                      <td>
                        <span className={`diff-pill diff-${diff}`}>
                          {diff}
                        </span>
                      </td>
                      <td>
                        <div className="q-preview-box">
                          <p className="q-preview-text">{q.question}</p>
                          <div className="q-options-inline">
                            {q.options &&
                              q.options.map((opt, optIdx) => {
                                const isCorrect = q.correctIndex === optIdx;
                                const letter = String.fromCharCode(65 + optIdx);
                                return (
                                  <span
                                    key={optIdx}
                                    className={`opt-pill ${
                                      isCorrect ? 'opt-pill-correct' : ''
                                    }`}
                                  >
                                    <strong>{letter}:</strong> {opt}
                                    {isCorrect && ' ✓'}
                                  </span>
                                );
                              })}
                          </div>
                        </div>
                      </td>
                      <td className="col-actions">
                        <div className="table-actions-row">
                          <button
                            type="button"
                            onClick={() => handleEdit(q)}
                            className="btn btn-outline btn-sm btn-edit"
                            title="Edit this question"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(q._id)}
                            className="btn btn-outline btn-sm btn-delete"
                            title="Delete this question"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="cat-modal-backdrop">
          <div className="cat-modal-box">
            <h3 className="modal-title">Delete Question?</h3>
            <p className="modal-desc">
              Are you sure you want to permanently delete this question from the examination question bank? This action cannot be undone.
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="btn btn-danger"
              >
                Yes, Delete Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
