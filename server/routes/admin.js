const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const localDB = require('../utils/localStore');

const isMongooseReady = () => mongoose.connection.readyState === 1;

// Protect all admin routes with auth and admin role verification
router.use(authMiddleware, adminMiddleware);

// Helper for question validation
const validateQuestionPayload = (body) => {
  const { question, options, correctIndex, subject, chapter, difficulty } = body;

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return 'Subject is required and cannot be empty.';
  }

  if (!chapter || typeof chapter !== 'string' || !chapter.trim()) {
    return 'Chapter name is required and cannot be empty.';
  }

  if (!question || typeof question !== 'string' || question.trim().length < 5) {
    return 'Question text is required and must be at least 5 characters long.';
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return 'A question must provide exactly 4 options.';
  }

  const hasInvalidOption = options.some(
    (opt) => typeof opt !== 'string' || !opt.trim()
  );
  if (hasInvalidOption) {
    return 'All 4 options must be non-empty strings.';
  }

  const parsedIndex = Number(correctIndex);
  if (
    !Number.isInteger(parsedIndex) ||
    parsedIndex < 0 ||
    parsedIndex > 3
  ) {
    return 'Please select a valid correct option (Option A, B, C, or D).';
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  const cleanDifficulty = difficulty && typeof difficulty === 'string'
    ? difficulty.trim().toLowerCase()
    : 'medium';

  if (!validDifficulties.includes(cleanDifficulty)) {
    return 'Difficulty must be one of: easy, medium, or hard.';
  }

  return null; // Valid
};

// @route   GET /api/admin/questions
// @desc    Get all questions for admin management (includes correct answers)
// @access  Admin only
router.get('/questions', async (req, res) => {
  try {
    const { subject, chapter, difficulty, search } = req.query;

    if (isMongooseReady()) {
      const filter = {};

      if (subject && subject !== 'All') {
        filter.subject = new RegExp('^' + subject.trim() + '$', 'i');
      }

      if (chapter && chapter !== 'All') {
        filter.chapter = new RegExp('^' + chapter.trim() + '$', 'i');
      }

      if (difficulty && difficulty !== 'All') {
        filter.difficulty = difficulty.trim().toLowerCase();
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [{ question: regex }, { chapter: regex }, { subject: regex }];
      }

      const questions = await Question.find(filter).sort({ createdAt: -1 });
      return res.status(200).json(questions);
    } else {
      const questions = localDB.getAllQuestions({ subject, chapter, difficulty, search });
      return res.status(200).json(questions);
    }
  } catch (error) {
    console.error('Admin get questions error:', error);
    return res.status(500).json({ message: 'Server error retrieving questions list.' });
  }
});

// @route   POST /api/admin/questions
// @desc    Create a new question
// @access  Admin only
router.post('/questions', async (req, res) => {
  try {
    const validationError = validateQuestionPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { question, options, correctIndex, subject, chapter, difficulty } = req.body;
    const cleanDifficulty = (difficulty && difficulty.trim().toLowerCase()) || 'medium';

    if (isMongooseReady()) {
      const newQuestion = new Question({
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctIndex: Number(correctIndex),
        subject: subject.trim(),
        chapter: chapter.trim(),
        difficulty: cleanDifficulty
      });

      const saved = await newQuestion.save();
      return res.status(201).json(saved);
    } else {
      const saved = localDB.createQuestion({
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctIndex: Number(correctIndex),
        subject: subject.trim(),
        chapter: chapter.trim(),
        difficulty: cleanDifficulty
      });

      return res.status(201).json(saved);
    }
  } catch (error) {
    console.error('Admin create question error:', error);
    return res.status(500).json({ message: 'Server error creating question.' });
  }
});

// @route   PUT /api/admin/questions/:id
// @desc    Update an existing question
// @access  Admin only
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const validationError = validateQuestionPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { question, options, correctIndex, subject, chapter, difficulty } = req.body;
    const cleanDifficulty = (difficulty && difficulty.trim().toLowerCase()) || 'medium';

    const updates = {
      question: question.trim(),
      options: options.map((opt) => opt.trim()),
      correctIndex: Number(correctIndex),
      subject: subject.trim(),
      chapter: chapter.trim(),
      difficulty: cleanDifficulty
    };

    if (isMongooseReady()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid question ID format.' });
      }

      const updatedQuestion = await Question.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedQuestion) {
        return res.status(404).json({ message: 'Question not found.' });
      }

      return res.status(200).json(updatedQuestion);
    } else {
      const updatedQuestion = localDB.updateQuestion(id, updates);
      if (!updatedQuestion) {
        return res.status(404).json({ message: 'Question not found.' });
      }

      return res.status(200).json(updatedQuestion);
    }
  } catch (error) {
    console.error('Admin update question error:', error);
    return res.status(500).json({ message: 'Server error updating question.' });
  }
});

// @route   DELETE /api/admin/questions/:id
// @desc    Delete a question
// @access  Admin only
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongooseReady()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid question ID format.' });
      }

      const deleted = await Question.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Question not found.' });
      }

      return res.status(200).json({
        message: 'Question deleted successfully.',
        id
      });
    } else {
      const success = localDB.deleteQuestion(id);
      if (!success) {
        return res.status(404).json({ message: 'Question not found.' });
      }

      return res.status(200).json({
        message: 'Question deleted successfully.',
        id
      });
    }
  } catch (error) {
    console.error('Admin delete question error:', error);
    return res.status(500).json({ message: 'Server error deleting question.' });
  }
});

module.exports = router;
