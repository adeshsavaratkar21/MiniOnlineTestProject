const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth');
const localDB = require('../utils/localStore');

const isMongooseReady = () => mongoose.connection.readyState === 1;

// @route   GET /api/questions/subjects
// @desc    List available subjects with question counts
// @access  Protected
router.get('/subjects', authMiddleware, async (req, res) => {
  try {
    if (isMongooseReady()) {
      const subjects = await Question.aggregate([
        {
          $group: {
            _id: '$subject',
            questionCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            questionCount: 1
          }
        },
        { $sort: { name: 1 } }
      ]);
      return res.status(200).json(subjects);
    } else {
      const subjects = localDB.getSubjects();
      return res.status(200).json(subjects);
    }
  } catch (error) {
    console.error('Fetch subjects error:', error);
    return res.status(500).json({ message: 'Server error retrieving subjects list.' });
  }
});

// @route   GET /api/questions
// @desc    Get 10 random test questions (strictly filtered by ?subject=...) WITHOUT correctIndex
// @access  Protected
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { subject } = req.query;

    if (isMongooseReady()) {
      let filter = {};
      if (subject && subject.trim() && subject.toLowerCase() !== 'all') {
        filter = { subject: new RegExp('^' + subject.trim() + '$', 'i') };
      }

      const count = await Question.countDocuments(filter);
      if (count === 0) {
        return res.status(404).json({
          message: `No questions found for subject: ${subject || 'All'}.`
        });
      }

      const sampleSize = Math.min(10, count);

      const pipeline = [];
      if (Object.keys(filter).length > 0) {
        pipeline.push({ $match: filter });
      }
      pipeline.push({ $sample: { size: sampleSize } });
      pipeline.push({
        $project: {
          correctIndex: 0,
          __v: 0
        }
      });

      const questions = await Question.aggregate(pipeline);
      return res.status(200).json(questions);
    } else {
      // Local Embedded DB fallback
      const questions = localDB.getQuestions(10, subject);
      if (questions.length === 0) {
        return res.status(404).json({
          message: `No questions found for subject: ${subject || 'All'}.`
        });
      }
      return res.status(200).json(questions);
    }
  } catch (error) {
    console.error('Fetch questions error:', error);
    return res.status(500).json({ message: 'Server error retrieving questions.' });
  }
});

// @route   POST /api/questions
// @desc    Add a new question
// @access  Protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { question, options, correctIndex, subject } = req.body;

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
