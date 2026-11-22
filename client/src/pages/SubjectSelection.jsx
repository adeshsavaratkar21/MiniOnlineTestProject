import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CBSE_10TH_SUBJECTS = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    code: 'Course 041 / 241',
    icon: '📐',
    colorTheme: '#2563eb',
    bgLight: '#eff6ff',
    badge: 'Class 10 Core',
    topics: [
      'Real Numbers & HCF/LCM',
      'Polynomials & Quadratic Equations',
      'Arithmetic Progressions (AP)',
      'Trigonometry & Statistics'
    ]
  },
  {
    id: 'science',
    name: 'Science',
    code: 'Course 086',
    icon: '🔬',
    colorTheme: '#16a34a',
    bgLight: '#f0fdf4',
    badge: 'Class 10 Core',
    topics: [
      'Chemical Reactions & Equations',
      'Life Processes & Nephrons',
      'Light - Reflection & Refraction',
      'Electricity (Ohm\'s Law) & Environment'
    ]
  },
  {
    id: 'social-science',
    name: 'Social Science',
    code: 'Course 087',
    icon: '🌍',
    colorTheme: '#d97706',
    bgLight: '#fffbeb',
    badge: 'Class 10 Core',
    topics: [
      'Nationalism in Europe & India',
      'Regur Soils & Resources',
      'Federalism & Power Sharing',
      'Sectors of Indian Economy & Money'
    ]
  },
  {
    id: 'english',
    name: 'English',
    code: 'Course 184',
    icon: '📖',
    colorTheme: '#7c3aed',
    bgLight: '#f5f3ff',
    badge: 'Language & Lit',
    topics: [
      'Modals, Tenses & Determiners',
      'Subject-Verb Concord',
      'Reported Speech Rules',
      'Poetic Devices & Literature'
    ]
  },
  {
    id: 'information-technology',
    name: 'Information Technology',
    code: 'Skill Code 402',
    icon: '💻',
    colorTheme: '#0891b2',
    bgLight: '#ecfeff',
    badge: 'Skill Elective',
    topics: [
      'Digital Documentation (Mail Merge)',
      'Spreadsheets (Goal Seek)',
      'RDBMS & SQL Primary Keys',
      'Network Security & Ergonomics'
    ]
  }
];

const SubjectSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState(null);

  const handleStartExam = (subjectName) => {
    navigate(`/test?subject=${encodeURIComponent(subjectName)}`);
  };

  return (
    <div className="page-container subject-selection-page">
      {/* Hero Welcome Banner */}
      <div className="cbse-hero-banner">
        <div className="hero-text-content">
          <div className="hero-badge">
            <span>🇮🇳 CBSE Class 10 Board Examination Portal</span>
          </div>
          <h1 className="hero-title">
            Welcome, {user?.name || 'Examinee'}!
          </h1>
          <p className="hero-subtitle">
            Choose your Class 10 subject below to launch your official 10-minute timed mock test.
          </p>
        </div>
      </div>

      {/* Subject Cards Section */}
      <div className="subjects-section-heading">
        <h2>Select Examination Subject</h2>
        <p>Pick any subject below to begin your test session</p>
      </div>

      <div className="subject-cards-grid">
        {CBSE_10TH_SUBJECTS.map((sub) => {
          return (
            <div
              key={sub.id}
              className="subject-card"
              style={{
                '--theme-color': sub.colorTheme,
                '--theme-bg': sub.bgLight
              }}
            >
              <div className="subject-card-top">
                <span className="subject-icon">{sub.icon}</span>
                <span className="subject-code-tag">{sub.code}</span>
              </div>

              <h3 className="subject-title">{sub.name}</h3>

              <div className="subject-meta-row">
                <span className="meta-pill">⏱️ 10 Mins</span>
                <span className="meta-pill">📝 10 Questions</span>
                <span className="meta-pill">🏆 10 Marks</span>
              </div>

              <div className="subject-topics-list">
                <span className="topics-heading">Syllabus Highlights:</span>
                <ul>
                  {sub.topics.map((t, idx) => (
                    <li key={idx}>✓ {t}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleStartExam(sub.name)}
                className="btn btn-primary btn-block btn-start-subject"
                style={{ backgroundColor: sub.colorTheme }}
              >
                Start {sub.name} Exam →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectSelection;
