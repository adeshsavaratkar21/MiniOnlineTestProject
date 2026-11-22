const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth');
const localDB = require('../utils/localStore');

const isMongooseReady = () => mongoose.connection.readyState === 1;

// @route   GET /api/questions
// @desc    Get 10 random test questions (WITHOUT correctIndex)
// @access  Protected
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (isMongooseReady()) {
      const totalQuestions = await Question.countDocuments();
      if (totalQuestions === 0) {
        return res.status(404).json({
          message: 'No questions found in the database. Please seed the database first.'
        });
      }

      const sampleSize = Math.min(10, totalQuestions);

      // MongoDB aggregate with $sample to retrieve random questions
      // Exclude correctIndex so user cannot inspect network payload
      const questions = await Question.aggregate([
        { $sample: { size: sampleSize } },
        {
          $project: {
            correctIndex: 0,
            __v: 0
          }
        }
      ]);

      return res.status(200).json(questions);
    } else {
      // Fallback: Local Embedded Database
      const questions = localDB.getQuestions(10);
      return res.status(200).json(questions);
    }
  } catch (error) {
    console.error('Fetch questions error:', error);
    return res.status(500).json({ message: 'Server error retrieving questions.' });
  }
});

// @route   POST /api/questions
// @desc    Add a new question (admin or testing)
// @access  Protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { question, options, correctIndex, subject } = req.body;

    // Validation
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question text is required.' });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ message: 'Exactly 4 options are required.' });
    }

    const hasEmptyOption = options.some((opt) => typeof opt !== 'string' || !opt.trim());
    if (hasEmptyOption) {
      return res.status(400).json({ message: 'All 4 options must be non-empty strings.' });
    }

    const parsedCorrectIndex = Number(correctIndex);
    if (!Number.isInteger(parsedCorrectIndex) || parsedCorrectIndex < 0 || parsedCorrectIndex > 3) {
      return res.status(400).json({ message: 'correctIndex must be an integer between 0 and 3.' });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required.' });
    }

    if (isMongooseReady()) {
      const newQuestion = new Question({
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctIndex: parsedCorrectIndex,
        subject: subject.trim()
      });

      const saved = await newQuestion.save();
      return res.status(201).json(saved);
    } else {
      const saved = localDB.createQuestion({
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correctIndex: parsedCorrectIndex,
        subject: subject.trim()
      });
      return res.status(201).json(saved);
    }
  } catch (error) {
    console.error('Create question error:', error);
    return res.status(500).json({ message: 'Server error creating question.' });
  }
});

module.exports = router;
