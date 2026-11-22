const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth');
const localDB = require('../utils/localStore');

const isMongooseReady = () => mongoose.connection.readyState === 1;

// Helper to determine chapter status message
const getChapterStatus = (percentage) => {
  if (percentage >= 75) return 'Strong';
  if (percentage >= 50) return 'Needs practice';
  return 'Revise';
};

// @route   POST /api/attempts
// @desc    Submit test answers, evaluate score, compute chapter breakdown & time taken, save attempt, and return results
// @access  Protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { answers, subject, timeTaken } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Submission must include an array of answers.' });
    }

    const parsedTimeTaken = typeof timeTaken === 'number' && timeTaken >= 0 ? Math.round(timeTaken) : 0;

    if (isMongooseReady()) {
      const questionIds = answers
        .map((a) => a.questionId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (questionIds.length === 0) {
        return res.status(400).json({ message: 'No valid question IDs provided.' });
      }

      const questions = await Question.find({ _id: { $in: questionIds } });
      const questionMap = new Map();
      questions.forEach((q) => {
        questionMap.set(q._id.toString(), q);
      });

      // Determine subject
      let resolvedSubject = subject && typeof subject === 'string' && subject.trim() ? subject.trim() : '';
      if (!resolvedSubject && questions.length > 0 && questions[0].subject) {
        resolvedSubject = questions[0].subject;
      }
      if (!resolvedSubject) {
        resolvedSubject = 'General';
      }

      let score = 0;
      const details = [];
      const sanitizedAnswers = [];
      const chapterStatsMap = new Map();

      for (const ans of answers) {
        const qIdStr = ans.questionId ? ans.questionId.toString() : '';
        const q = questionMap.get(qIdStr);
        if (!q) continue;

        const selectedIndex =
          typeof ans.selectedIndex === 'number' && ans.selectedIndex >= 0 && ans.selectedIndex <= 3
            ? ans.selectedIndex
            : null;

        const isCorrect = selectedIndex !== null && selectedIndex === q.correctIndex;
        if (isCorrect) score += 1;

        sanitizedAnswers.push({
          questionId: q._id,
          selectedIndex
        });

        const chap = q.chapter || 'General';

        details.push({
          questionId: q._id,
          chapter: chap,
          question: q.question,
          options: q.options,
          selectedIndex,
          correctIndex: q.correctIndex,
          isCorrect
        });

        // Track chapter accuracy
        if (!chapterStatsMap.has(chap)) {
          chapterStatsMap.set(chap, { chapter: chap, correct: 0, total: 0 });
        }
        const stat = chapterStatsMap.get(chap);
        stat.total += 1;
        if (isCorrect) {
          stat.correct += 1;
        }
      }

      const total = details.length;

      // Compute chapter breakdown array
      const chapterBreakdown = Array.from(chapterStatsMap.values()).map((c) => {
        const pct = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
        return {
          chapter: c.chapter,
          correct: c.correct,
          total: c.total,
          percentage: pct,
          status: getChapterStatus(pct)
        };
      });

      const attempt = new Attempt({
        user: req.userId,
        subject: resolvedSubject,
        timeTaken: parsedTimeTaken,
        chapterBreakdown,
        answers: sanitizedAnswers,
        score,
        total,
        date: new Date(),
        details
      });

      const savedAttempt = await attempt.save();

      return res.status(201).json({
        message: 'Test submitted and evaluated successfully.',
        attemptId: savedAttempt._id,
        subject: savedAttempt.subject,
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        timeTaken: savedAttempt.timeTaken,
        chapterBreakdown: savedAttempt.chapterBreakdown,
        date: savedAttempt.date,
        details
      });
    } else {
      // Local fallback evaluation
      let score = 0;
      const details = [];
      const sanitizedAnswers = [];
      const chapterStatsMap = new Map();
      let resolvedSubject = subject && typeof subject === 'string' && subject.trim() ? subject.trim() : '';

      for (const ans of answers) {
        const qIdStr = ans.questionId ? ans.questionId.toString() : '';
        const q = localDB.getQuestionById(qIdStr);
        if (!q) continue;

        if (!resolvedSubject && q.subject) {
          resolvedSubject = q.subject;
        }

        const selectedIndex =
          typeof ans.selectedIndex === 'number' && ans.selectedIndex >= 0 && ans.selectedIndex <= 3
            ? ans.selectedIndex
            : null;

        const isCorrect = selectedIndex !== null && selectedIndex === q.correctIndex;
        if (isCorrect) score += 1;

        sanitizedAnswers.push({
          questionId: q._id,
          selectedIndex
        });

        const chap = q.chapter || 'General';

        details.push({
          questionId: q._id,
          chapter: chap,
          question: q.question,
          options: q.options,
          selectedIndex,
          correctIndex: q.correctIndex,
          isCorrect
        });

        if (!chapterStatsMap.has(chap)) {
          chapterStatsMap.set(chap, { chapter: chap, correct: 0, total: 0 });
        }
        const stat = chapterStatsMap.get(chap);
        stat.total += 1;
        if (isCorrect) {
          stat.correct += 1;
        }
      }

      if (!resolvedSubject) {
        resolvedSubject = 'General';
      }

      const total = details.length;

      const chapterBreakdown = Array.from(chapterStatsMap.values()).map((c) => {
        const pct = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
        return {
          chapter: c.chapter,
          correct: c.correct,
          total: c.total,
          percentage: pct,
          status: getChapterStatus(pct)
        };
      });

      const savedAttempt = localDB.createAttempt({
        userId: req.userId,
        subject: resolvedSubject,
        timeTaken: parsedTimeTaken,
        chapterBreakdown,
        answers: sanitizedAnswers,
        score,
        total,
        details
      });

      return res.status(201).json({
        message: 'Test submitted and evaluated successfully.',
        attemptId: savedAttempt._id,
        subject: savedAttempt.subject,
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        timeTaken: savedAttempt.timeTaken,
        chapterBreakdown: savedAttempt.chapterBreakdown,
        date: savedAttempt.date,
        details
      });
    }
  } catch (error) {
    console.error('Submit attempt error:', error);
    return res.status(500).json({ message: 'Server error evaluating test submission.' });
  }
});

// @route   GET /api/attempts
// @desc    Get all test attempts for the logged-in user
// @access  Protected
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (isMongooseReady()) {
      const attempts = await Attempt.find({ user: req.userId })
        .sort({ date: -1 })
        .select('subject score total date timeTaken chapterBreakdown details createdAt');
      return res.status(200).json(attempts);
    } else {
      const attempts = localDB.getAttemptsByUser(req.userId);
      return res.status(200).json(attempts);
    }
  } catch (error) {
    console.error('Fetch attempts error:', error);
    return res.status(500).json({ message: 'Server error retrieving attempts history.' });
  }
});

// @route   GET /api/attempts/:id
// @desc    Get a specific attempt by ID
// @access  Protected
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongooseReady()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid attempt ID.' });
      }

      const attempt = await Attempt.findOne({ _id: id, user: req.userId });
      if (!attempt) {
        return res.status(404).json({ message: 'Attempt not found.' });
      }

      return res.status(200).json({
        attemptId: attempt._id,
        subject: attempt.subject || 'General',
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0,
        timeTaken: attempt.timeTaken || 0,
        chapterBreakdown: attempt.chapterBreakdown || [],
        date: attempt.date,
        details: attempt.details
      });
    } else {
      const attempt = localDB.getAttemptById(id, req.userId);
      if (!attempt) {
        return res.status(404).json({ message: 'Attempt not found.' });
      }

      return res.status(200).json({
        attemptId: attempt._id,
        subject: attempt.subject || 'General',
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0,
        timeTaken: attempt.timeTaken || 0,
        chapterBreakdown: attempt.chapterBreakdown || [],
        date: attempt.date,
        details: attempt.details
      });
    }
  } catch (error) {
    console.error('Fetch attempt by ID error:', error);
    return res.status(500).json({ message: 'Server error retrieving attempt details.' });
  }
});

module.exports = router;
